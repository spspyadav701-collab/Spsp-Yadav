import { useState, useEffect, useCallback } from 'react';

export interface CachedVideoMeta {
  id: string;
  blobUrl: string;
  sizeBytes: number;
  downloadedAt: number;
  mimeType: string;
}

const DB_NAME = 'AiTeacher_VideoCache_DB';
const STORE_NAME = 'offline_video_blobs';
const DB_VERSION = 1;

function openVideoCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Custom Hook to handle secure local IndexedDB caching of video files for offline learning.
 * Provides progressive download tracking and instant offline playback blob URL resolution.
 */
export function useSecureVideoDownloader(videoId: string, remoteUrl: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0); // 0 to 100
  const [isCachedOffline, setIsCachedOffline] = useState(false);
  const [cachedBlobUrl, setCachedBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if this video is already cached in local IndexedDB
  const checkCacheStatus = useCallback(async () => {
    try {
      const db = await openVideoCacheDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoId);

      req.onsuccess = () => {
        const record = req.result as { id: string; blob: Blob; mimeType: string; timestamp: number } | undefined;
        if (record && record.blob) {
          const url = URL.createObjectURL(record.blob);
          setCachedBlobUrl(url);
          setIsCachedOffline(true);
        } else {
          setIsCachedOffline(false);
          setCachedBlobUrl(null);
        }
      };
    } catch {
      // Ignore initial cache lookup errors gracefully
    }
  }, [videoId]);

  useEffect(() => {
    checkCacheStatus();
    return () => {
      if (cachedBlobUrl) {
        URL.revokeObjectURL(cachedBlobUrl);
      }
    };
  }, [videoId, checkCacheStatus]);

  // Download video file with real-time progress tracking and store into IndexedDB
  const downloadForOffline = async () => {
    if (isDownloading || isCachedOffline) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      const response = await fetch(remoteUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) throw new Error('Response body is null');

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          if (totalBytes > 0) {
            const progress = Math.round((receivedBytes / totalBytes) * 100);
            setDownloadProgress(progress);
          } else {
            // Indeterminate simulation for streaming endpoints
            setDownloadProgress((prev) => Math.min(prev + 5, 95));
          }
        }
      }

      const mimeType = response.headers.get('content-type') || 'video/mp4';
      const videoBlob = new Blob(chunks, { type: mimeType });

      // Save blob into IndexedDB
      const db = await openVideoCacheDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const putReq = store.put({
          id: videoId,
          blob: videoBlob,
          mimeType,
          timestamp: Date.now(),
        });
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });

      const localBlobUrl = URL.createObjectURL(videoBlob);
      setCachedBlobUrl(localBlobUrl);
      setIsCachedOffline(true);
      setDownloadProgress(100);
    } catch (err: any) {
      setError(err?.message || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  // Remove video from offline cache
  const removeOfflineCache = async () => {
    try {
      const db = await openVideoCacheDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const delReq = store.delete(videoId);
        delReq.onsuccess = () => resolve();
        delReq.onerror = () => reject(delReq.error);
      });
      if (cachedBlobUrl) {
        URL.revokeObjectURL(cachedBlobUrl);
      }
      setCachedBlobUrl(null);
      setIsCachedOffline(false);
      setDownloadProgress(0);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove from cache');
    }
  };

  return {
    isDownloading,
    downloadProgress,
    isCachedOffline,
    cachedBlobUrl,
    downloadForOffline,
    removeOfflineCache,
    error,
  };
}
