import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ExternalLink, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Cpu,
  Radio,
  HelpCircle,
  Image as ImageIcon,
  Terminal,
  HardDrive,
  Smartphone,
  Palette,
  Check
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AssistantState, AudioMetrics, ToolCallEvent } from './types/assistant';
import { 
  ElementCustomization, 
  LayoutCustomizationMap, 
  DEFAULT_ELEMENT_CUSTOMIZATIONS 
} from './types/customization';
import { LiveSession } from './gemini/LiveSession';
import { AiTeacherAvatar } from './components/AiTeacherAvatar';
import { Waveform } from './components/Waveform';
import { MicButton } from './components/MicButton';
import { PythonEmbedRunnerModal } from './components/PythonEmbedRunnerModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { PermissionModal } from './components/PermissionModal';
import { CustomizableElement } from './components/CustomizableElement';
import { CustomizePanel } from './components/CustomizePanel';
import { renderCustomIcon } from './utils/iconMap';

const STORAGE_AVATAR_KEY = 'ai_teacher_avatar_photo';
const STORAGE_LAYOUT_KEY = 'ai_teacher_ui_layout_v1';

export function App() {
  const [state, setState] = useState<AssistantState>('disconnected');
  const [metrics, setMetrics] = useState<AudioMetrics>({
    inputVolume: 0,
    outputVolume: 0,
    mouthOpening: 0,
    frequencyData: new Uint8Array(64),
  });
  const [toolEvents, setToolEvents] = useState<ToolCallEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showPythonEmbedModal, setShowPythonEmbedModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Customization Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [customizations, setCustomizations] = useState<LayoutCustomizationMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAYOUT_KEY);
      if (saved) {
        return { ...DEFAULT_ELEMENT_CUSTOMIZATIONS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_ELEMENT_CUSTOMIZATIONS;
  });

  const [customAvatar, setCustomAvatar] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_AVATAR_KEY);
    } catch {
      return null;
    }
  });

  const liveSessionRef = useRef<LiveSession | null>(null);

  useEffect(() => {
    // Instantiate LiveSession once (persistent connection)
    const session = new LiveSession();
    liveSessionRef.current = session;

    session.setOnStateChange((newState) => {
      setState(newState);
      if (newState !== 'error') {
        setErrorMessage(null);
      }
    });

    session.setOnMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });

    session.setOnToolCall((event) => {
      setToolEvents((prev) => [event, ...prev.slice(0, 3)]);
      // Auto clear completed notifications after 6 seconds
      setTimeout(() => {
        setToolEvents((current) => current.filter((e) => e.id !== event.id));
      }, 6000);
    });

    session.setOnError((err) => {
      setErrorMessage(err);
      setState('error');
    });

    return () => {
      session.cleanup();
    };
  }, []);

  // Native Android & Capacitor Mobile Lifecycle Integration
  useEffect(() => {
    // Hide native splash screen smoothly when UI loads
    SplashScreen.hide().catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#020617' }).catch(() => {});

    // Handle Android hardware back button gracefully
    const backListenerPromise = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (isEditMode) {
        setIsEditMode(false);
        setSelectedElementId(null);
      } else if (showAndroidModal) {
        setShowAndroidModal(false);
      } else if (showPermissionModal) {
        setShowPermissionModal(false);
      } else if (showDriveModal) {
        setShowDriveModal(false);
      } else if (showPythonEmbedModal) {
        setShowPythonEmbedModal(false);
      } else if (showInfo) {
        setShowInfo(false);
      } else if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [isEditMode, showAndroidModal, showPermissionModal, showDriveModal, showPythonEmbedModal, showInfo]);

  const handleToggleSession = async () => {
    if (isEditMode) return; // In edit mode, clicking elements selects them
    if (!liveSessionRef.current) return;

    if (state === 'listening' || state === 'speaking' || state === 'connecting') {
      liveSessionRef.current.disconnect();
    } else {
      setErrorMessage(null);
      await liveSessionRef.current.connect();
    }
  };

  const handleAvatarChange = (newUrl: string | null) => {
    setCustomAvatar(newUrl);
    try {
      if (newUrl) {
        localStorage.setItem(STORAGE_AVATAR_KEY, newUrl);
      } else {
        localStorage.removeItem(STORAGE_AVATAR_KEY);
      }
    } catch {}
  };

  // Customization Handlers
  const handleUpdateElement = (id: string, updates: Partial<ElementCustomization>) => {
    setCustomizations((prev) => {
      const current = prev[id] || DEFAULT_ELEMENT_CUSTOMIZATIONS[id] || {
        id,
        name: id,
        category: 'button',
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        borderRadius: 12,
        rotation: 0,
        visible: true,
      };
      const updated = { ...current, ...updates };
      const nextMap = { ...prev, [id]: updated };
      
      // Auto-save changes to localStorage
      try {
        localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(nextMap));
      } catch {}
      return nextMap;
    });
  };

  const handleSaveLayout = () => {
    try {
      localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(customizations));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {}
  };

  const handleResetLayout = () => {
    setCustomizations(DEFAULT_ELEMENT_CUSTOMIZATIONS);
    try {
      localStorage.removeItem(STORAGE_LAYOUT_KEY);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {}
  };

  const quickActionPrompts = [
    { id: 'action_btn_0', label: 'Explain Physics', defaultIcon: 'Atom' },
    { id: 'action_btn_1', label: 'Open YouTube', defaultIcon: 'Play' },
    { id: 'action_btn_2', label: 'Open WhatsApp', defaultIcon: 'MessageCircle' },
    { id: 'action_btn_3', label: 'Give me a lesson', defaultIcon: 'Sparkles' },
  ];

  const handleQuickPromptClick = async (prompt: string) => {
    if (isEditMode) return;
    if (state === 'disconnected' || state === 'error') {
      await handleToggleSession();
    }
    if (liveSessionRef.current) {
      await liveSessionRef.current.sendUserPrompt(prompt);
    }
  };

  // Helper to safely get element customization
  const getCustom = (id: string): ElementCustomization => {
    return customizations[id] || DEFAULT_ELEMENT_CUSTOMIZATIONS[id] || {
      id,
      name: id,
      category: 'button',
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      borderRadius: 12,
      rotation: 0,
      visible: true,
    };
  };

  return (
    <main 
      className="relative w-screen h-screen w-[100vw] h-[100vh] min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none"
      onClick={() => {
        if (isEditMode && selectedElementId) {
          // Click on background deselects element if not handled
        }
      }}
    >
      {/* 1. LAYER 1: 100% FULL-SCREEN COVER AI TEACHER PHOTO (Customizable) */}
      <CustomizableElement
        id="teacher_avatar"
        customization={getCustom('teacher_avatar')}
        isEditMode={isEditMode}
        isSelected={selectedElementId === 'teacher_avatar'}
        onSelect={(id) => setSelectedElementId(id)}
        onChange={handleUpdateElement}
        className="absolute inset-0 w-full h-full"
      >
        <AiTeacherAvatar
          state={state}
          audioMetrics={metrics}
          customAvatarUrl={getCustom('teacher_avatar').customImage || customAvatar}
          onAvatarChange={handleAvatarChange}
          onTap={handleToggleSession}
        />
      </CustomizableElement>

      {/* 2. LAYER 2: TOP HEADER BAR */}
      <header className={`relative z-20 w-full max-w-5xl mx-auto px-3.5 pt-3 sm:pt-4 flex items-center justify-between pointer-events-auto ${isEditMode ? 'mt-12' : ''}`}>
        {/* Branding Container */}
        <CustomizableElement
          id="header_bar"
          customization={getCustom('header_bar')}
          isEditMode={isEditMode}
          isSelected={selectedElementId === 'header_bar'}
          onSelect={(id) => setSelectedElementId(id)}
          onChange={handleUpdateElement}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-2.5 bg-slate-950/60 backdrop-blur-xl px-3.5 py-1.5 rounded-2xl border border-white/10 shadow-lg">
            {/* Custom or Default Logo Icon */}
            <CustomizableElement
              id="mithila_logo"
              customization={getCustom('mithila_logo')}
              isEditMode={isEditMode}
              isSelected={selectedElementId === 'mithila_logo'}
              onSelect={(id) => setSelectedElementId(id)}
              onChange={handleUpdateElement}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-[1.5px] shadow-md shadow-purple-500/25 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                    {getCustom('mithila_logo').customImage ? (
                      <img src={getCustom('mithila_logo').customImage!} alt="Logo" className="w-full h-full object-cover rounded-[9px]" />
                    ) : getCustom('mithila_logo').customIcon ? (
                      renderCustomIcon(getCustom('mithila_logo').customIcon, 'w-4 h-4 text-pink-400')
                    ) : (
                      <Cpu className="w-4 h-4 text-pink-400" />
                    )}
                  </div>
                </div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-200 to-cyan-200">
                  {getCustom('mithila_logo').customText || 'Mithila Academy'}
                </h1>
              </div>
            </CustomizableElement>

            {/* AI Teacher Live Pulse Badge */}
            <CustomizableElement
              id="ai_teacher_live_badge"
              customization={getCustom('ai_teacher_live_badge')}
              isEditMode={isEditMode}
              isSelected={selectedElementId === 'ai_teacher_live_badge'}
              onSelect={(id) => setSelectedElementId(id)}
              onChange={handleUpdateElement}
            >
              <span className="flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300">
                {getCustom('ai_teacher_live_badge').customIcon ? (
                  renderCustomIcon(getCustom('ai_teacher_live_badge').customIcon, 'w-2 h-2 text-pink-400')
                ) : (
                  <Radio className="w-2 h-2 animate-pulse text-pink-400" />
                )}
                <span>{getCustom('ai_teacher_live_badge').customText || 'AI TEACHER LIVE'}</span>
              </span>
            </CustomizableElement>
          </div>
        </CustomizableElement>

        {/* Action Controls & EDIT UI TOGGLE */}
        <div className="flex items-center gap-1.5">
          {/* EDIT MODE Toggle Button */}
          <button
            id="btn-toggle-customize-mode"
            type="button"
            onClick={() => {
              setIsEditMode(!isEditMode);
              setSelectedElementId(null);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 backdrop-blur-xl transition-all shadow-md cursor-pointer ${
              isEditMode
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-pink-400 text-white shadow-pink-500/30'
                : 'bg-slate-950/70 hover:bg-slate-900/90 border-cyan-400/60 text-cyan-300 hover:text-cyan-200'
            }`}
            title="Toggle Touch Editing Mode (One-finger drag, Two-finger pinch & rotate)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'DONE' : 'EDIT MODE'}</span>
          </button>

          {/* Python Embed Modal Button */}
          <CustomizableElement
            id="python_embed_btn"
            customization={getCustom('python_embed_btn')}
            isEditMode={isEditMode}
            isSelected={selectedElementId === 'python_embed_btn'}
            onSelect={(id) => setSelectedElementId(id)}
            onChange={handleUpdateElement}
          >
            <button
              id="btn-open-python-embedder"
              type="button"
              onClick={() => !isEditMode && setShowPythonEmbedModal(true)}
              aria-label="Python Photo Embedder Tool"
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-white/10 text-cyan-300 hover:text-cyan-200 backdrop-blur-xl transition-all shadow-md flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              {getCustom('python_embed_btn').customIcon ? (
                renderCustomIcon(getCustom('python_embed_btn').customIcon, 'w-3.5 h-3.5')
              ) : (
                <Terminal className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Python Embed (.py)</span>
            </button>
          </CustomizableElement>

          {/* Google Drive Modal Button */}
          <CustomizableElement
            id="drive_btn"
            customization={getCustom('drive_btn')}
            isEditMode={isEditMode}
            isSelected={selectedElementId === 'drive_btn'}
            onSelect={(id) => setSelectedElementId(id)}
            onChange={handleUpdateElement}
          >
            <button
              id="btn-open-google-drive"
              type="button"
              onClick={() => !isEditMode && setShowDriveModal(true)}
              aria-label="Google Drive Files & Photos"
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-white/10 text-cyan-300 hover:text-cyan-200 backdrop-blur-xl transition-all shadow-md flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              {getCustom('drive_btn').customIcon ? (
                renderCustomIcon(getCustom('drive_btn').customIcon, 'w-3.5 h-3.5')
              ) : (
                <HardDrive className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Google Drive</span>
            </button>
          </CustomizableElement>

          {/* Android APK Modal Button */}
          <CustomizableElement
            id="apk_btn"
            customization={getCustom('apk_btn')}
            isEditMode={isEditMode}
            isSelected={selectedElementId === 'apk_btn'}
            onSelect={(id) => setSelectedElementId(id)}
            onChange={handleUpdateElement}
          >
            <button
              id="btn-open-android-apk"
              type="button"
              onClick={() => !isEditMode && setShowAndroidModal(true)}
              aria-label="Android APK App Center"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 backdrop-blur-xl transition-all shadow-md flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              {getCustom('apk_btn').customIcon ? (
                renderCustomIcon(getCustom('apk_btn').customIcon, 'w-3.5 h-3.5')
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">Android APK</span>
            </button>
          </CustomizableElement>

          {/* Help & Info Button */}
          <CustomizableElement
            id="info_btn"
            customization={getCustom('info_btn')}
            isEditMode={isEditMode}
            isSelected={selectedElementId === 'info_btn'}
            onSelect={(id) => setSelectedElementId(id)}
            onChange={handleUpdateElement}
          >
            <button
              id="btn-info-dialog"
              type="button"
              onClick={() => !isEditMode && setShowInfo(true)}
              aria-label="Assistant Info & Voice Commands"
              className="p-2 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white backdrop-blur-xl transition-all shadow-md focus:outline-none cursor-pointer"
            >
              {getCustom('info_btn').customIcon ? (
                renderCustomIcon(getCustom('info_btn').customIcon, 'w-3.5 h-3.5')
              ) : (
                <HelpCircle className="w-3.5 h-3.5" />
              )}
            </button>
          </CustomizableElement>
        </div>
      </header>

      {/* 3. TOOL CALL & ACTION NOTIFICATION TOASTS */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 pointer-events-none flex flex-col gap-2">
        <AnimatePresence>
          {toolEvents.map((evt) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto w-full p-2.5 rounded-xl backdrop-blur-xl bg-slate-950/85 border border-cyan-500/40 shadow-xl shadow-cyan-500/10 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <p className="font-semibold text-cyan-200 truncate text-[11px]">
                    {evt.name === 'openWebsite' ? `Opened ${evt.args?.name || 'Website'}` : evt.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {evt.args?.url || evt.result || 'Action executed'}
                  </p>
                </div>
              </div>
              {evt.args?.url && (
                <a
                  href={evt.args.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                >
                  Visit <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto w-full p-3 rounded-xl backdrop-blur-xl bg-rose-950/90 border border-rose-500/50 shadow-xl shadow-rose-950/50 flex items-start justify-between gap-2.5 text-xs text-rose-200"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. LAYER 3: LOWER-MIDDLE / STATUS BOX & AUDIO EQUALIZER (Customizable) */}
      <section className="relative z-20 w-full max-w-sm mx-auto flex flex-col items-center justify-center px-4 mt-auto mb-2 pointer-events-none">
        <CustomizableElement
          id="status_card"
          customization={getCustom('status_card')}
          isEditMode={isEditMode}
          isSelected={selectedElementId === 'status_card'}
          onSelect={(id) => setSelectedElementId(id)}
          onChange={handleUpdateElement}
          className="w-full pointer-events-auto"
        >
          <div className="w-full text-center bg-slate-950/60 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-xl flex flex-col items-center gap-1 overflow-hidden">
            {/* Custom Image on Card if set */}
            {getCustom('status_card').customImage && (
              <div className="w-full h-16 rounded-xl overflow-hidden mb-1">
                <img src={getCustom('status_card').customImage!} alt="Card Banner" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {/* Title Element */}
              <CustomizableElement
                id="status_title"
                customization={getCustom('status_title')}
                isEditMode={isEditMode}
                isSelected={selectedElementId === 'status_title'}
                onSelect={(id) => setSelectedElementId(id)}
                onChange={handleUpdateElement}
              >
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                  {getCustom('status_title').customIcon && renderCustomIcon(getCustom('status_title').customIcon, 'w-4 h-4 text-cyan-400')}
                  <span>{getCustom('status_title').customText || 'AI Teacher'}</span>
                </h2>
              </CustomizableElement>

              {/* Status Pill Element */}
              <CustomizableElement
                id="status_pill"
                customization={getCustom('status_pill')}
                isEditMode={isEditMode}
                isSelected={selectedElementId === 'status_pill'}
                onSelect={(id) => setSelectedElementId(id)}
                onChange={handleUpdateElement}
              >
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-300 font-semibold flex items-center gap-1">
                  {getCustom('status_pill').customIcon && renderCustomIcon(getCustom('status_pill').customIcon, 'w-2.5 h-2.5')}
                  <span>{getCustom('status_pill').customText || 'AI Teacher • Live'}</span>
                </span>
              </CustomizableElement>

              {/* Live Status Pulse Dot */}
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  state === 'speaking'
                    ? 'bg-pink-400 shadow-[0_0_8px_#f43f5e] animate-pulse'
                    : state === 'listening'
                    ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-ping'
                    : state === 'connecting'
                    ? 'bg-amber-400 animate-bounce'
                    : 'bg-emerald-400/80 shadow-[0_0_6px_#34d399]'
                }`}
              />
            </div>

            {/* Description Subtitle */}
            <CustomizableElement
              id="status_desc"
              customization={getCustom('status_desc')}
              isEditMode={isEditMode}
              isSelected={selectedElementId === 'status_desc'}
              onSelect={(id) => setSelectedElementId(id)}
              onChange={handleUpdateElement}
            >
              <p className="text-[11px] text-slate-300 font-medium">
                {state === 'speaking'
                  ? 'AI Teacher is speaking'
                  : state === 'listening'
                  ? 'Listening to you... speak naturally'
                  : state === 'connecting'
                  ? 'Connecting to AI Teacher...'
                  : 'Voice Stream Standby • READY'}
              </p>
            </CustomizableElement>

            {/* Dynamic Audio Waveform Equalizer */}
            <CustomizableElement
              id="waveform_visualizer"
              customization={getCustom('waveform_visualizer')}
              isEditMode={isEditMode}
              isSelected={selectedElementId === 'waveform_visualizer'}
              onSelect={(id) => setSelectedElementId(id)}
              onChange={handleUpdateElement}
              className="w-full flex justify-center mt-1"
            >
              <Waveform state={state} audioMetrics={metrics} />
            </CustomizableElement>
          </div>
        </CustomizableElement>
      </section>

      {/* 5. LAYER 4: BOTTOM QUICK ACTIONS & LIVE VOICE POWER BUTTON (Customizable) */}
      <footer className="relative z-20 w-full max-w-md mx-auto px-4 pb-4 sm:pb-6 flex flex-col items-center gap-3.5 pointer-events-auto">
        {/* Quick Action Pills Container */}
        <CustomizableElement
          id="quick_actions_bar"
          customization={getCustom('quick_actions_bar')}
          isEditMode={isEditMode}
          isSelected={selectedElementId === 'quick_actions_bar'}
          onSelect={(id) => setSelectedElementId(id)}
          onChange={handleUpdateElement}
          className="w-full"
        >
          <div className="w-full flex items-center justify-center gap-2 flex-wrap">
            {quickActionPrompts.map((item) => {
              const elemCustom = getCustom(item.id);
              return (
                <CustomizableElement
                  key={item.id}
                  id={item.id}
                  customization={elemCustom}
                  isEditMode={isEditMode}
                  isSelected={selectedElementId === item.id}
                  onSelect={(id) => setSelectedElementId(id)}
                  onChange={handleUpdateElement}
                >
                  <button
                    type="button"
                    onClick={() => handleQuickPromptClick(item.label)}
                    className="text-xs sm:text-[13px] font-medium px-3.5 py-1.5 rounded-full bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 hover:border-purple-500/40 text-slate-200 hover:text-white select-none backdrop-blur-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    {elemCustom.customImage ? (
                      <img src={elemCustom.customImage} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                    ) : elemCustom.customIcon ? (
                      renderCustomIcon(elemCustom.customIcon, 'w-3.5 h-3.5 text-cyan-300')
                    ) : (
                      renderCustomIcon(item.defaultIcon, 'w-3.5 h-3.5 text-cyan-300')
                    )}
                    <span>{elemCustom.customText || item.label}</span>
                  </button>
                </CustomizableElement>
              );
            })}
          </div>
        </CustomizableElement>

        {/* Central Live Voice Power / Mic Button */}
        <CustomizableElement
          id="mic_button"
          customization={getCustom('mic_button')}
          isEditMode={isEditMode}
          isSelected={selectedElementId === 'mic_button'}
          onSelect={(id) => setSelectedElementId(id)}
          onChange={handleUpdateElement}
        >
          <MicButton
            state={state}
            onToggle={handleToggleSession}
          />
        </CustomizableElement>
      </footer>

      {/* 6. Info & Persona Modal */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">About AI Teacher</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs leading-relaxed text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <p className="font-semibold text-pink-400 mb-1">🎭 Persona & Style</p>
                  <p className="text-slate-400">
                    Natural, friendly, smart, and professional mentor at Mithila Academy. Helps you learn, study, and explore any topic with clear, conversational explanations.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <p className="font-semibold text-amber-400 mb-1">✨ Creator & Developer</p>
                  <p className="text-slate-400">
                    Created by <span className="text-amber-300 font-semibold">SP</span> • Developed by <span className="text-pink-300 font-semibold">Mithila Academy</span>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <p className="font-semibold text-cyan-400 mb-1">🎨 Visual Customizer</p>
                  <p className="text-slate-400">
                    Click <span className="text-cyan-300 font-semibold">EDIT UI</span> in the top header to freely move, scale, resize, replace icons, and upload custom images for every single element!
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <p className="font-semibold text-purple-400 mb-1">🎙️ High-Speed Voice Pipeline & VAD</p>
                  <p className="text-slate-400">
                    Persistent streaming with zero-lag client-side Voice Activity Detection (Barge-in). Speak naturally and interrupt the AI anytime.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                Got It, Let's Chat!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Python Script & HTML Embedder Runner Modal */}
      <PythonEmbedRunnerModal
        isOpen={showPythonEmbedModal}
        onClose={() => setShowPythonEmbedModal(false)}
        onApplyAsAvatar={handleAvatarChange}
        currentAvatarUrl={customAvatar}
      />

      {/* 8. Google Drive Explorer & Avatar Picker Modal */}
      <GoogleDriveModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        onSelectAvatarImage={handleAvatarChange}
      />

      {/* 9. Android APK & Mobile App Center Modal */}
      <AndroidApkModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />

      {/* 10. Microphone Permission Blocked Help Modal */}
      {showPermissionModal && (
        <PermissionModal onClose={() => setShowPermissionModal(false)} />
      )}

      {/* 11. Global UI Customize Panel & Inspector Drawer */}
      <CustomizePanel
        isEditMode={isEditMode}
        selectedElementId={selectedElementId}
        customizations={customizations}
        onSelectElement={(id) => setSelectedElementId(id)}
        onUpdateElement={handleUpdateElement}
        onSaveLayout={handleSaveLayout}
        onResetLayout={handleResetLayout}
        onCloseEditMode={() => {
          setIsEditMode(false);
          setSelectedElementId(null);
        }}
        isSaved={isSaved}
      />
    </main>
  );
}

export default App;
