import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Share2, 
  ThumbsUp, 
  UserCheck, 
  UserPlus, 
  Trash2, 
  WifiOff, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useSecureVideoDownloader } from './useSecureVideoDownloader';

export interface AcademicVideo {
  id: string;
  title: string;
  description: string;
  category: 'Physics' | 'Mathematics' | 'Chemistry' | 'Computer Science' | 'General GK';
  duration: string;
  views: number;
  likes: number;
  uploadedAt: string;
  teacherName: string;
  teacherAvatar: string;
  isVerifiedTeacher?: boolean;
  thumbnailUrl: string;
  videoUrl: string;
}

// Sample initial curriculum data (can be replaced with live Firebase Firestore stream)
export const DEFAULT_ACADEMIC_VIDEOS: AcademicVideo[] = [
  {
    id: 'vid-photosynthesis-01',
    title: 'Photosynthesis & Solar Cellular Energy Conversion',
    description: 'Complete breakdown of light reactions, Calvin cycle, ATP synthesis, and chloroplast mechanics for senior secondary & entrance exams.',
    category: 'Chemistry',
    duration: '14:20',
    views: 12400,
    likes: 980,
    uploadedAt: '2 days ago',
    teacherName: 'Teacher SP',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerifiedTeacher: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 'vid-calculus-02',
    title: 'Visual Calculus: Integrals as Area & Volume Transforms',
    description: 'Fundamental Theorem of Calculus explained intuitively with 3D graphical representations and differential step-downs.',
    category: 'Mathematics',
    duration: '22:15',
    views: 8900,
    likes: 740,
    uploadedAt: '5 days ago',
    teacherName: 'Mithila Academy Dept.',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVerifiedTeacher: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'vid-quantum-03',
    title: 'Quantum Wave Mechanics & Schrödinger Equation',
    description: 'Probability density, wave-particle duality, and Heisenberg uncertainty principle simplified with clear visual proofs.',
    category: 'Physics',
    duration: '18:40',
    views: 15300,
    likes: 1240,
    uploadedAt: '1 week ago',
    teacherName: 'Teacher SP',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerifiedTeacher: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  }
];

interface VideoCardProps {
  video: AcademicVideo;
  onAskAiTeacher?: (videoTopic: string) => void;
}

export const AcademicVideoCard: React.FC<VideoCardProps> = ({ video, onAskAiTeacher }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likes, setLikes] = useState(video.likes);
  const [hasLiked, setHasLiked] = useState(false);

  const {
    isDownloading,
    downloadProgress,
    isCachedOffline,
    cachedBlobUrl,
    downloadForOffline,
    removeOfflineCache,
  } = useSecureVideoDownloader(video.id, video.videoUrl);

  const toggleLike = () => {
    if (hasLiked) {
      setLikes((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  // Play from local encrypted IndexedDB blob if available offline, otherwise stream from network
  const activePlaySource = cachedBlobUrl || video.videoUrl;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:border-cyan-500/40">
      {/* Video Media Container */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {isPlaying ? (
          <video
            src={activePlaySource}
            controls
            autoPlay
            className="w-full h-full object-contain"
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-cyan-400 transition-all">
                <Play className="w-7 h-7 fill-slate-950 ml-1" />
              </div>
            </div>
            {/* Badges */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-medium text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {video.category}
            </div>
            <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-xs font-mono text-white">
              {video.duration}
            </div>
            {isCachedOffline && (
              <div className="absolute top-3 right-3 bg-emerald-500/90 text-slate-950 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Offline Ready
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Meta & Controls */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <img
              src={video.teacherAvatar}
              alt={video.teacherName}
              className="w-10 h-10 rounded-full border border-cyan-500/40 object-cover mt-0.5"
            />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm md:text-base line-clamp-2 leading-snug">
                {video.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span className="font-medium text-slate-300">{video.teacherName}</span>
                <span>•</span>
                <span>{video.views.toLocaleString()} views</span>
                <span>•</span>
                <span>{video.uploadedAt}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsSubscribed(!isSubscribed)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
              isSubscribed
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 font-bold'
            }`}
          >
            {isSubscribed ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                Subscribed
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Subscribe
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {video.description}
        </p>

        {/* Action Buttons: Like, Download Offline, Ask AI Teacher */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLike}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                hasLiked
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-cyan-400' : ''}`} />
              {likes}
            </button>

            {/* Offline Downloader Control */}
            {isCachedOffline ? (
              <div className="flex items-center gap-1">
                <button
                  disabled
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Saved Offline
                </button>
                <button
                  onClick={removeOfflineCache}
                  title="Remove from offline storage"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isDownloading ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-lg text-xs text-cyan-300 border border-cyan-500/30">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Downloading {downloadProgress}%</span>
              </div>
            ) : (
              <button
                onClick={downloadForOffline}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700/60 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Offline Save
              </button>
            )}
          </div>

          {onAskAiTeacher && (
            <button
              onClick={() => onAskAiTeacher(video.title)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:brightness-125 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Ask AI Teacher
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export interface VideoFeedProps {
  videos?: AcademicVideo[];
  onAskAiTeacher?: (topic: string) => void;
}

/**
 * Modular Academic Video Streaming Feed Component.
 * Supports category filtering, offline indicators, and instant live player initiation.
 */
export const AcademicVideoFeed: React.FC<VideoFeedProps> = ({ 
  videos = DEFAULT_ACADEMIC_VIDEOS,
  onAskAiTeacher 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [offlineFilterOnly, setOfflineFilterOnly] = useState(false);

  const categories = ['All', 'Physics', 'Mathematics', 'Chemistry', 'Computer Science', 'General GK'];

  const filteredVideos = videos.filter((v) => {
    const matchesCat = selectedCategory === 'All' || v.category === selectedCategory;
    return matchesCat;
  });

  return (
    <div className="w-full space-y-6">
      {/* Category Pills & Filters */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <AcademicVideoCard
            key={video.id}
            video={video}
            onAskAiTeacher={onAskAiTeacher}
          />
        ))}
      </div>
    </div>
  );
};
