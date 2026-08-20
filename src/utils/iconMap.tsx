import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Cpu,
  Radio,
  HelpCircle,
  Terminal,
  HardDrive,
  Smartphone,
  Atom,
  Play,
  Video,
  MessageSquare,
  MessageCircle,
  Send,
  GraduationCap,
  BookOpen,
  Book,
  School,
  Star,
  Heart,
  Smile,
  Flame,
  Zap,
  Music,
  Sun,
  Moon,
  Compass,
  Globe,
  Camera,
  Image as ImageIcon,
  Settings,
  Sliders,
  Shield,
  CheckCircle2,
  RefreshCw,
  Power,
  Layers,
  LucideIcon
} from 'lucide-react';

export interface IconOption {
  id: string;
  label: string;
  category: 'Tech & Voice' | 'Education' | 'Media' | 'Social' | 'Symbols';
  icon: LucideIcon;
}

export const AVAILABLE_ICONS: IconOption[] = [
  // Tech & Voice
  { id: 'Mic', label: 'Microphone', category: 'Tech & Voice', icon: Mic },
  { id: 'MicOff', label: 'Mic Off', category: 'Tech & Voice', icon: MicOff },
  { id: 'Volume2', label: 'Volume High', category: 'Tech & Voice', icon: Volume2 },
  { id: 'VolumeX', label: 'Mute', category: 'Tech & Voice', icon: VolumeX },
  { id: 'Power', label: 'Power', category: 'Tech & Voice', icon: Power },
  { id: 'Cpu', label: 'CPU Processor', category: 'Tech & Voice', icon: Cpu },
  { id: 'Radio', label: 'Radio Broadcast', category: 'Tech & Voice', icon: Radio },
  { id: 'Terminal', label: 'Terminal Code', category: 'Tech & Voice', icon: Terminal },
  { id: 'HardDrive', label: 'Google Drive', category: 'Tech & Voice', icon: HardDrive },
  { id: 'Smartphone', label: 'Android Phone', category: 'Tech & Voice', icon: Smartphone },
  { id: 'Zap', label: 'Lightning Zap', category: 'Tech & Voice', icon: Zap },
  { id: 'Sliders', label: 'Equalizer Sliders', category: 'Tech & Voice', icon: Sliders },

  // Education
  { id: 'GraduationCap', label: 'Graduation Cap', category: 'Education', icon: GraduationCap },
  { id: 'School', label: 'School Building', category: 'Education', icon: School },
  { id: 'Book', label: 'Book', category: 'Education', icon: Book },
  { id: 'BookOpen', label: 'Open Book', category: 'Education', icon: BookOpen },
  { id: 'Atom', label: 'Physics Atom', category: 'Education', icon: Atom },
  { id: 'Globe', label: 'Globe World', category: 'Education', icon: Globe },
  { id: 'Compass', label: 'Compass', category: 'Education', icon: Compass },

  // Media
  { id: 'Youtube', label: 'Video Player', category: 'Media', icon: Play },
  { id: 'Play', label: 'Play Triangle', category: 'Media', icon: Play },
  { id: 'Video', label: 'Video Camera', category: 'Media', icon: Video },
  { id: 'Music', label: 'Music Note', category: 'Media', icon: Music },
  { id: 'Camera', label: 'Camera Photo', category: 'Media', icon: Camera },
  { id: 'ImageIcon', label: 'Picture Image', category: 'Media', icon: ImageIcon },

  // Social & Chat
  { id: 'MessageCircle', label: 'Message Circle', category: 'Social', icon: MessageCircle },
  { id: 'MessageSquare', label: 'Message Square', category: 'Social', icon: MessageSquare },
  { id: 'Send', label: 'Send Paper Plane', category: 'Social', icon: Send },
  { id: 'HelpCircle', label: 'Help Question', category: 'Social', icon: HelpCircle },

  // Symbols
  { id: 'Sparkles', label: 'Sparkles Magic', category: 'Symbols', icon: Sparkles },
  { id: 'Star', label: 'Star', category: 'Symbols', icon: Star },
  { id: 'Heart', label: 'Heart Love', category: 'Symbols', icon: Heart },
  { id: 'Smile', label: 'Happy Smile', category: 'Symbols', icon: Smile },
  { id: 'Flame', label: 'Flame Fire', category: 'Symbols', icon: Flame },
  { id: 'Sun', label: 'Sun Daylight', category: 'Symbols', icon: Sun },
  { id: 'Moon', label: 'Moon Night', category: 'Symbols', icon: Moon },
  { id: 'Shield', label: 'Security Shield', category: 'Symbols', icon: Shield },
  { id: 'CheckCircle2', label: 'Check Success', category: 'Symbols', icon: CheckCircle2 },
  { id: 'RefreshCw', label: 'Refresh Repeat', category: 'Symbols', icon: RefreshCw },
  { id: 'Layers', label: 'Layers Stack', category: 'Symbols', icon: Layers },
];

export function renderCustomIcon(iconName: string | null | undefined, className = 'w-4 h-4'): React.ReactNode {
  if (!iconName) return null;

  // Check if it is an emoji
  if (iconName.length <= 4 && !/^[a-zA-Z0-9]+$/.test(iconName)) {
    return <span className="inline-block text-base leading-none">{iconName}</span>;
  }

  const match = AVAILABLE_ICONS.find(item => item.id.toLowerCase() === iconName.toLowerCase());
  if (match) {
    const IconComponent = match.icon;
    return <IconComponent className={className} />;
  }

  // Fallback icon
  return <Sparkles className={className} />;
}
