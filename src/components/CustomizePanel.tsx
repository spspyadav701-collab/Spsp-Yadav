import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Palette, 
  X, 
  RotateCcw, 
  RotateCw,
  Save, 
  Check, 
  Sliders, 
  Move, 
  ZoomIn, 
  Eye, 
  EyeOff, 
  Upload, 
  Trash2,
  ChevronDown,
  Layers,
  Touchpad
} from 'lucide-react';
import { ElementCustomization, LayoutCustomizationMap } from '../types/customization';
import { AVAILABLE_ICONS } from '../utils/iconMap';

interface CustomizePanelProps {
  isEditMode: boolean;
  selectedElementId: string | null;
  customizations: LayoutCustomizationMap;
  onSelectElement: (id: string) => void;
  onUpdateElement: (id: string, updates: Partial<ElementCustomization>) => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  onCloseEditMode: () => void;
  isSaved: boolean;
}

export const CustomizePanel: React.FC<CustomizePanelProps> = ({
  isEditMode,
  selectedElementId,
  customizations,
  onSelectElement,
  onUpdateElement,
  onSaveLayout,
  onResetLayout,
  onCloseEditMode,
  isSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'transform' | 'icon' | 'image'>('transform');
  const [isExpanded, setIsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isEditMode) return null;

  const currentElement = selectedElementId ? customizations[selectedElementId] : null;
  const elementsList = Object.values(customizations) as ElementCustomization[];

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedElementId) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateElement(selectedElementId, {
            customImage: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* 1. TOP TOUCH EDIT BAR BANNER & GLOBAL CONTROLS */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 border-b border-cyan-500/50 backdrop-blur-xl px-3 sm:px-4 py-2 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Touchpad className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-wide text-cyan-200">
                TOUCH EDIT MODE
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-300 font-semibold">
                Mobile Touch Active
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400 hidden sm:block">
              One-finger drag to move • Two-finger pinch to resize • Two-finger rotate
            </p>
          </div>
        </div>

        {/* Action Buttons: SAVE, RESET, DONE */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-save-custom-layout"
            type="button"
            onClick={onSaveLayout}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isSaved
                ? 'bg-emerald-600/90 border-emerald-400 text-white'
                : 'bg-cyan-600/90 hover:bg-cyan-500 border-cyan-400 text-white'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'SAVED' : 'SAVE'}</span>
          </button>

          <button
            id="btn-reset-custom-layout"
            type="button"
            onClick={onResetLayout}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-pink-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
            title="Reset to default layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">RESET</span>
          </button>

          <button
            id="btn-done-custom-mode"
            type="button"
            onClick={onCloseEditMode}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>DONE</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. FLOATING INSPECTOR DRAWER / PANEL */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-4 right-2 sm:right-4 z-50 w-[calc(100vw-16px)] max-w-xs sm:max-w-sm rounded-2xl bg-slate-950/95 border border-cyan-500/50 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-hidden select-none"
      >
        {/* Drawer Header */}
        <div className="p-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">
              {currentElement ? currentElement.name : 'Select Element'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="p-3 max-h-[70vh] overflow-y-auto space-y-3 text-xs">
            {/* Quick Element Selector Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Tap / Select UI Element
              </label>
              <select
                value={selectedElementId || ''}
                onChange={(e) => onSelectElement(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="" disabled>Choose element...</option>
                {elementsList.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.name} {!el.visible ? '(Hidden)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {currentElement ? (
              <>
                {/* Tabs */}
                <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('transform')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      activeTab === 'transform'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Move & Size
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('icon')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      activeTab === 'icon'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('image')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      activeTab === 'image'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Replace Image
                  </button>
                </div>

                {/* TAB 1: TRANSFORM */}
                {activeTab === 'transform' && (
                  <div className="space-y-2.5">
                    {/* Scale Controls */}
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5 text-pink-400" />
                          Scale (Pinch / Slider)
                        </span>
                        <span className="text-[11px] font-bold text-cyan-300">
                          {Math.round(currentElement.scale * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.35"
                        max="3.5"
                        step="0.05"
                        value={currentElement.scale}
                        onChange={(e) =>
                          onUpdateElement(currentElement.id, {
                            scale: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1 mt-1">
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              onUpdateElement(currentElement.id, { scale: preset })
                            }
                            className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors ${
                              currentElement.scale === preset
                                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {Math.round(preset * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rotation Controls */}
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                          <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                          Rotation (Two-Finger / Wheel)
                        </span>
                        <span className="text-[11px] font-bold text-purple-300">
                          {currentElement.rotation}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="5"
                        value={currentElement.rotation}
                        onChange={(e) =>
                          onUpdateElement(currentElement.id, {
                            rotation: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-purple-400 cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1 mt-1">
                        {[-90, -45, 0, 45, 90, 180].map((rot) => (
                          <button
                            key={rot}
                            type="button"
                            onClick={() =>
                              onUpdateElement(currentElement.id, { rotation: rot })
                            }
                            className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors ${
                              currentElement.rotation === rot
                                ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {rot}°
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Position X / Y Nudges */}
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                          <Move className="w-3.5 h-3.5 text-cyan-400" />
                          Position Offsets
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateElement(currentElement.id, { x: 0, y: 0 })
                          }
                          className="text-[10px] text-slate-400 hover:text-cyan-300"
                        >
                          Center (0,0)
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>X</span>
                            <span>{currentElement.x}px</span>
                          </div>
                          <input
                            type="range"
                            min="-250"
                            max="250"
                            step="2"
                            value={currentElement.x}
                            onChange={(e) =>
                              onUpdateElement(currentElement.id, {
                                x: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>Y</span>
                            <span>{currentElement.y}px</span>
                          </div>
                          <input
                            type="range"
                            min="-250"
                            max="250"
                            step="2"
                            value={currentElement.y}
                            onChange={(e) =>
                              onUpdateElement(currentElement.id, {
                                y: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Visibility & Reset */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement(currentElement.id, {
                            visible: !currentElement.visible,
                          })
                        }
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          currentElement.visible
                            ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
                            : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {currentElement.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{currentElement.visible ? 'Visible' : 'Hidden'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement(currentElement.id, {
                            x: 0,
                            y: 0,
                            scale: 1,
                            opacity: 1,
                            rotation: 0,
                            visible: true,
                            customIcon: null,
                            customImage: null,
                          })
                        }
                        className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-pink-300 hover:border-pink-500/50 transition-colors"
                        title="Reset element to original defaults"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: ICON SELECTOR */}
                {activeTab === 'icon' && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-slate-400">
                      Pick any icon for <span className="text-cyan-300 font-semibold">{currentElement.name}</span>:
                    </p>

                    <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-1 rounded-xl bg-slate-900/60 border border-slate-800">
                      {AVAILABLE_ICONS.map((opt) => {
                        const isSelected = currentElement.customIcon === opt.id;
                        const IconComp = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              onUpdateElement(currentElement.id, {
                                customIcon: opt.id,
                              })
                            }
                            title={opt.label}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                                : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-600'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                            <span className="text-[8px] truncate max-w-[45px]">{opt.id}</span>
                          </button>
                        );
                      })}
                    </div>

                    {currentElement.customIcon && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement(currentElement.id, { customIcon: null })
                        }
                        className="w-full py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Restore Original Icon</span>
                      </button>
                    )}
                  </div>
                )}

                {/* TAB 3: IMAGE UPLOAD & REPLACEMENT */}
                {activeTab === 'image' && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-slate-400">
                      Upload from phone for <span className="text-cyan-300 font-semibold">{currentElement.name}</span>:
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />

                    {currentElement.customImage ? (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 relative">
                          <img
                            src={currentElement.customImage}
                            alt="Custom Element"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Change Image</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateElement(currentElement.id, { customImage: null })
                            }
                            className="p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 hover:text-white text-xs cursor-pointer"
                            title="Restore Original Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-6 rounded-2xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-900/60 hover:bg-slate-900 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all"
                      >
                        <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">Select Image from Phone</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP supported</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-5 text-center text-slate-400 space-y-1">
                <p className="text-xs">Tap any element on your screen to move, pinch-resize, rotate, or replace with your own image.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
};
