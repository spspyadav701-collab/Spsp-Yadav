import { AudioMetrics } from '../types/assistant';

/**
 * High-Performance AudioStreamer manages Web Audio API for:
 * 1. 16kHz PCM16 microphone recording & streaming with ultra-low latency.
 * 2. 24kHz PCM16 Gemini audio playback with instant gapless scheduling.
 * 3. Client-side Voice Activity Detection (VAD) for instant zero-lag barge-in / interruption.
 * 4. Real-time AnalyserNode metrics for live avatar pulsing & lip-sync.
 */
export class AudioStreamer {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micProcessor: ScriptProcessorNode | null = null;
  private micAnalyser: AnalyserNode | null = null;

  private outputAnalyser: AnalyserNode | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  
  private isRecording = false;
  private isOutputPlaying = false;
  private checkPlayingTimeout: any = null;

  // Interruption / VAD tracking
  private speechCounter = 0;
  private onInterruptCallback: (() => void) | null = null;

  private onMicAudioCallback: ((base64Pcm: string) => void) | null = null;
  private onMetricsCallback: ((metrics: AudioMetrics) => void) | null = null;
  private onSpeakingStateCallback: ((isSpeaking: boolean) => void) | null = null;

  private animFrameId: number | null = null;
  private currentMouthOpening = 0;

  constructor() {
    this.startMetricsLoop();
  }

  public setOnMicAudio(cb: (base64Pcm: string) => void) {
    this.onMicAudioCallback = cb;
  }

  public setOnMetrics(cb: (metrics: AudioMetrics) => void) {
    this.onMetricsCallback = cb;
  }

  public setOnSpeakingState(cb: (isSpeaking: boolean) => void) {
    this.onSpeakingStateCallback = cb;
  }

  public setOnInterrupt(cb: () => void) {
    this.onInterruptCallback = cb;
  }

  /**
   * Initializes microphone capture and Web Audio output
   */
  public async init(): Promise<void> {
    // 1. Setup Output AudioContext (24kHz for Gemini Live)
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000, latencyHint: 'interactive' });
      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 128;
      this.outputAnalyser.smoothingTimeConstant = 0.7;
      this.outputAnalyser.connect(this.outputAudioCtx.destination);
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }

    if (this.outputAudioCtx.state === 'suspended') {
      await this.outputAudioCtx.resume();
    }

    // 2. Request Microphone Access with optimal low-latency voice settings
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 3. Setup Input AudioContext (16kHz for Gemini input)
    this.inputAudioCtx = new AudioCtx({ sampleRate: 16000, latencyHint: 'interactive' });
    if (this.inputAudioCtx.state === 'suspended') {
      await this.inputAudioCtx.resume();
    }

    this.micSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);
    this.micAnalyser = this.inputAudioCtx.createAnalyser();
    this.micAnalyser.fftSize = 128;
    this.micAnalyser.smoothingTimeConstant = 0.6;

    // Use ScriptProcessorNode (2048 samples = ~128ms at 16kHz for prompt streaming)
    this.micProcessor = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);
    
    this.micProcessor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);

      // Fast conversion to PCM16 Base64
      const pcm16Base64 = this.fastFloatTo16BitPCMBase64(inputData);
      if (this.onMicAudioCallback) {
        this.onMicAudioCallback(pcm16Base64);
      }
    };

    this.micSource.connect(this.micAnalyser);
    this.micAnalyser.connect(this.micProcessor);
    this.micProcessor.connect(this.inputAudioCtx.destination);

    this.isRecording = true;
  }

  /**
   * Resumes or starts recording mic input
   */
  public startRecording() {
    this.isRecording = true;
    if (this.inputAudioCtx?.state === 'suspended') {
      this.inputAudioCtx.resume();
    }
  }

  /**
   * Pauses mic capture
   */
  public stopRecording() {
    this.isRecording = false;
  }

  /**
   * Ultra-fast conversion of Float32Array PCM (-1.0 to 1.0) to Int16 Little Endian Base64
   */
  private fastFloatTo16BitPCMBase64(float32Array: Float32Array): string {
    const len = float32Array.length;
    const buffer = new ArrayBuffer(len * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const byteLen = bytes.byteLength;
    const chunkSize = 0x8000; // 32KB chunks for fast String.fromCharCode
    for (let i = 0; i < byteLen; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as any);
    }
    return btoa(binary);
  }

  /**
   * Decodes Base64 PCM16 24kHz and queues for immediate gapless playback
   */
  public playAudioChunk(base64Pcm: string) {
    if (!this.outputAudioCtx || !this.outputAnalyser) return;

    if (this.outputAudioCtx.state === 'suspended') {
      this.outputAudioCtx.resume();
    }

    // Fast base64 decode
    const binary = atob(base64Pcm);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Convert 16-bit signed PCM to Float32 array
    const sampleCount = Math.floor(len / 2);
    const float32 = new Float32Array(sampleCount);
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    for (let i = 0; i < sampleCount; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      float32[i] = int16 / 32768;
    }

    // Create AudioBuffer (24kHz, 1 channel)
    const audioBuffer = this.outputAudioCtx.createBuffer(1, sampleCount, 24000);
    audioBuffer.getChannelData(0).set(float32);

    // Create BufferSourceNode
    const sourceNode = this.outputAudioCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(this.outputAnalyser);

    const currentTime = this.outputAudioCtx.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    sourceNode.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.activeSources.push(sourceNode);

    // Mark as speaking immediately
    if (!this.isOutputPlaying) {
      this.isOutputPlaying = true;
      if (this.onSpeakingStateCallback) {
        this.onSpeakingStateCallback(true);
      }
    }

    // Schedule check for when playback completes
    this.schedulePlaybackCompletionCheck();

    sourceNode.onended = () => {
      const idx = this.activeSources.indexOf(sourceNode);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }
    };
  }

  private schedulePlaybackCompletionCheck() {
    if (this.checkPlayingTimeout) {
      clearTimeout(this.checkPlayingTimeout);
    }

    if (!this.outputAudioCtx) return;

    const remainingTimeMs = Math.max(0, (this.nextStartTime - this.outputAudioCtx.currentTime) * 1000 + 40);
    
    this.checkPlayingTimeout = setTimeout(() => {
      if (this.outputAudioCtx && this.outputAudioCtx.currentTime >= this.nextStartTime - 0.04) {
        this.isOutputPlaying = false;
        if (this.onSpeakingStateCallback) {
          this.onSpeakingStateCallback(false);
        }
      }
    }, remainingTimeMs);
  }

  /**
   * Barge-in / Interruption: immediately halts current audio output and clears queued chunks
   */
  public interrupt() {
    if (this.checkPlayingTimeout) {
      clearTimeout(this.checkPlayingTimeout);
      this.checkPlayingTimeout = null;
    }

    // Stop all playing sources immediately
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSources = [];

    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }

    this.isOutputPlaying = false;
    this.currentMouthOpening = 0;

    if (this.onSpeakingStateCallback) {
      this.onSpeakingStateCallback(false);
    }
  }

  /**
   * Continuously measures audio frequency & volume for avatar, lip-sync, and client-side barge-in
   */
  private startMetricsLoop() {
    const freqData = new Uint8Array(64);

    const check = () => {
      let inputVol = 0;
      let outputVol = 0;

      // 1. Microphone Input Volume & VAD check
      if (this.micAnalyser && this.isRecording) {
        const timeData = new Uint8Array(this.micAnalyser.fftSize);
        this.micAnalyser.getByteTimeDomainData(timeData);
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
          const val = (timeData[i] - 128) / 128;
          sum += val * val;
        }
        inputVol = Math.min(1, Math.sqrt(sum / timeData.length) * 3.5);

        // Client-side instant voice activity detection (Barge-in):
        // If user starts speaking while AI output is actively playing, cut AI voice instantly!
        if (this.isOutputPlaying && inputVol > 0.18) {
          this.speechCounter++;
          if (this.speechCounter >= 3) {
            console.log('[AudioStreamer] User speech detected during AI turn -> Instant Client Barge-in');
            this.interrupt();
            if (this.onInterruptCallback) {
              this.onInterruptCallback();
            }
            this.speechCounter = 0;
          }
        } else {
          this.speechCounter = 0;
        }
      }

      // 2. Assistant Output Volume & Frequency Data
      if (this.outputAnalyser && this.isOutputPlaying) {
        this.outputAnalyser.getByteFrequencyData(freqData);
        const timeData = new Uint8Array(this.outputAnalyser.fftSize);
        this.outputAnalyser.getByteTimeDomainData(timeData);
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
          const val = (timeData[i] - 128) / 128;
          sum += val * val;
        }
        outputVol = Math.min(1, Math.sqrt(sum / timeData.length) * 3.0);
      } else {
        freqData.fill(0);
      }

      // Calculate mouth opening smoothing
      const targetMouth = outputVol > 0.08 ? Math.min(1, outputVol * 1.5) : 0;
      this.currentMouthOpening += (targetMouth - this.currentMouthOpening) * 0.35;

      if (this.onMetricsCallback) {
        this.onMetricsCallback({
          inputVolume: inputVol,
          outputVolume: outputVol,
          mouthOpening: this.currentMouthOpening,
          frequencyData: freqData,
        });
      }

      this.animFrameId = requestAnimationFrame(check);
    };

    this.animFrameId = requestAnimationFrame(check);
  }

  /**
   * Full cleanup of audio resources
   */
  public cleanup() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.checkPlayingTimeout) {
      clearTimeout(this.checkPlayingTimeout);
    }
    this.interrupt();

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.micProcessor) {
      this.micProcessor.disconnect();
      this.micProcessor = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }

    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      this.outputAudioCtx.close();
      this.outputAudioCtx = null;
    }
  }
}
