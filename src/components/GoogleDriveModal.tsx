import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HardDrive, 
  X, 
  Search, 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  FileSpreadsheet, 
  Presentation, 
  Film, 
  Music, 
  File, 
  Upload, 
  FolderPlus, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  LogOut, 
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logoutGoogle, initAuth, getAccessToken } from '../services/googleAuth';
import { 
  DriveFile, 
  listDriveFiles, 
  uploadDriveFile, 
  createDriveFolder, 
  trashDriveFile, 
  getDriveImageAsDataUrl 
} from '../services/googleDrive';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAvatarImage?: (dataUrl: string) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onSelectAvatarImage,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }>({ id: 'root', name: 'My Drive' });
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'My Drive' },
  ]);

  // Modal actions
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<DriveFile | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen && token) {
      loadFiles(currentFolder.id);
    }
  }, [isOpen, token, currentFolder.id]);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setStatusNotification({ msg, type });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showNotification('Successfully connected to Google Drive!');
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setAuthError(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setToken(null);
    setFiles([]);
    showNotification('Disconnected from Google Drive.');
  };

  const loadFiles = async (folderId: string = currentFolder.id, query: string = searchQuery) => {
    setIsLoadingFiles(true);
    try {
      const data = await listDriveFiles(folderId, query);
      setFiles(data.files || []);
    } catch (err: any) {
      console.error('Failed to load Drive files:', err);
      showNotification(err.message || 'Error loading files from Drive', 'error');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleOpenFolder = (folder: DriveFile) => {
    const newFolder = { id: folder.id, name: folder.name };
    setCurrentFolder(newFolder);
    setFolderHistory((prev) => [...prev, newFolder]);
    setSearchQuery('');
  };

  const handleNavigateBack = (targetIndex: number) => {
    const newHistory = folderHistory.slice(0, targetIndex + 1);
    const targetFolder = newHistory[newHistory.length - 1];
    setFolderHistory(newHistory);
    setCurrentFolder(targetFolder);
    setSearchQuery('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadDriveFile(file, currentFolder.id);
      showNotification(`Uploaded "${file.name}" to Google Drive!`);
      loadFiles(currentFolder.id);
    } catch (err: any) {
      showNotification(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
      if (fileUploadInputRef.current) fileUploadInputRef.current.value = '';
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createDriveFolder(newFolderName.trim(), currentFolder.id);
      showNotification(`Created folder "${newFolderName.trim()}"`);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadFiles(currentFolder.id);
    } catch (err: any) {
      showNotification(err.message || 'Failed to create folder', 'error');
    }
  };

  const handleDeleteFile = async () => {
    if (!deleteConfirmFile) return;

    try {
      await trashDriveFile(deleteConfirmFile.id);
      showNotification(`Moved "${deleteConfirmFile.name}" to trash.`);
      setDeleteConfirmFile(null);
      loadFiles(currentFolder.id);
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete file', 'error');
    }
  };

  const handleSetAsAvatar = async (file: DriveFile) => {
    try {
      showNotification(`Setting "${file.name}" as AI Teacher photo...`);
      const dataUrl = await getDriveImageAsDataUrl(file.id);
      if (onSelectAvatarImage) {
        onSelectAvatarImage(dataUrl);
        showNotification('AI Teacher photo updated from Google Drive!');
      }
    } catch (err: any) {
      showNotification('Failed to download image from Drive', 'error');
    }
  };

  // Helper to determine file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="w-5 h-5 text-amber-400" />;
    if (mimeType.includes('image/')) return <ImageIcon className="w-5 h-5 text-pink-400" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="w-5 h-5 text-blue-400" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Presentation className="w-5 h-5 text-amber-500" />;
    if (mimeType.includes('video/')) return <Film className="w-5 h-5 text-purple-400" />;
    if (mimeType.includes('audio/')) return <Music className="w-5 h-5 text-cyan-400" />;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('python')) return <FileCode className="w-5 h-5 text-cyan-300" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-950 border border-cyan-500/50 shadow-2xl flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileUploadInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* 1. Header */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">Google Drive</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40">
                  AI Teacher Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Browse documents, study materials, and select photos directly from your Drive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        <AnimatePresence>
          {statusNotification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`px-4 py-2 text-xs flex items-center gap-2 font-medium ${
                statusNotification.type === 'error'
                  ? 'bg-rose-950/90 text-rose-200 border-b border-rose-800'
                  : 'bg-emerald-950/90 text-emerald-200 border-b border-emerald-800'
              }`}
            >
              {statusNotification.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{statusNotification.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Main Content Body */}
        {!token ? (
          /* NOT LOGGED IN: Official Sign in with Google Screen */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <HardDrive className="w-8 h-8 text-cyan-400" />
            </div>

            <div className="max-w-md space-y-1.5">
              <h4 className="text-lg font-bold text-slate-100">Connect Your Google Drive</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your Google Drive to load study files, worksheets, presentation slides, or set photos directly as the AI Teacher's appearance.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-300 max-w-sm">
                {authError}
              </div>
            )}

            {/* Official Material Google Sign In Button */}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoadingAuth}
              className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs tracking-wide shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoadingAuth ? 'Signing In...' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          /* LOGGED IN: DRIVE FILE EXPLORER */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* User status & Search Bar */}
            <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
              {/* Breadcrumb Path Navigation */}
              <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full text-xs">
                {folderHistory.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                    <button
                      type="button"
                      onClick={() => handleNavigateBack(index)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                        index === folderHistory.length - 1
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Action Buttons: Upload, New Folder, Refresh, Sign Out */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileUploadInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  title="Upload a file to this folder"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Create new folder"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => loadFiles(currentFolder.id)}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Refresh files"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title={`Sign out (${user?.email || ''})`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search and New Folder Form */}
            <div className="px-3 pt-2.5 pb-1 flex flex-col gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files in Google Drive..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    loadFiles(currentFolder.id, e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Inline New Folder Form */}
              {isCreatingFolder && (
                <form onSubmit={handleCreateFolder} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-cyan-500/40">
                  <FolderPlus className="w-4 h-4 text-cyan-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="New Folder Name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                    className="flex-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs cursor-pointer"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* File List Grid / Table */}
            <div className="flex-1 p-3 overflow-y-auto max-h-[50vh] space-y-1.5">
              {isLoadingFiles ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <p className="text-xs">Loading Google Drive items...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <Folder className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-medium">No files found in this folder</p>
                  <p className="text-[11px] text-slate-500">Upload a file or create a folder to get started.</p>
                </div>
              ) : (
                files.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  const isImage = file.mimeType.includes('image/');

                  return (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors group"
                    >
                      {/* Left: Icon & Name */}
                      <div
                        onClick={() => isFolder && handleOpenFolder(file)}
                        className={`flex items-center gap-2.5 flex-1 min-w-0 ${
                          isFolder ? 'cursor-pointer' : ''
                        }`}
                      >
                        <div className="shrink-0">{getFileIcon(file.mimeType)}</div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-2">
                            {file.modifiedTime && (
                              <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                            )}
                            {file.size && <span>• {formatFileSize(file.size)}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* If image: Set as AI Teacher Photo */}
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => handleSetAsAvatar(file)}
                            className="px-2 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Set as AI Teacher avatar image"
                          >
                            <Sparkles className="w-3 h-3 text-pink-400" />
                            <span>Set as Photo</span>
                          </button>
                        )}

                        {/* Open in Web Drive */}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Delete / Move to Trash */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmFile(file)}
                          className="p-1.5 rounded-lg hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Move to trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 3. MANDATORY CONFIRMATION DIALOG FOR FILE DELETION (Workspace Requirement) */}
        <AnimatePresence>
          {deleteConfirmFile && (
            <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-500/50 p-5 space-y-4 shadow-2xl text-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Move to Google Drive Trash?</h4>
                    <p className="text-xs text-rose-300/90 truncate max-w-[200px]">
                      "{deleteConfirmFile.name}"
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to move this file to trash? This operation will affect your Google Drive file.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmFile(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteFile}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
                  >
                    Move to Trash
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
