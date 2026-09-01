import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Sliders, 
  RotateCcw, 
  RotateCw,
  EyeOff, 
  Upload, 
  Trash2,
  Check,
  X
} from 'lucide-react';
import { ElementCustomization } from '../types/customization';

interface CustomizableElementProps {
  id: string;
  customization: ElementCustomization;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
  onChange: (id: string, updates: Partial<ElementCustomization>) => void;
  onOpenInspector?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const CustomizableElement: React.FC<CustomizableElementProps> = ({
  id,
  customization,
  isEditMode,
  isSelected,
  onSelect,
  onChange,
  onOpenInspector,
  className = '',
  style = {},
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [activeGesture, setActiveGesture] = useState<'drag' | 'pinch' | 'rotate' | null>(null);
  const [showQuickToolbar, setShowQuickToolbar] = useState(true);

  // Multi-Touch tracking state
  const touchState = useRef<{
    startX: number;
    startY: number;
    startElemX: number;
    startElemY: number;
    startScale: number;
    startRotation: number;
    startDistance: number;
    startAngle: number;
    centerX: number;
    centerY: number;
  }>({
    startX: 0,
    startY: 0,
    startElemX: 0,
    startElemY: 0,
    startScale: 1,
    startRotation: 0,
    startDistance: 0,
    startAngle: 0,
    centerX: 0,
    centerY: 0,
  });

  // --- TOUCH & POINTER HANDLERS ---

  // 1. Start Touch / Mouse Drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditMode) return;
    onSelect(id, e);

    const touches = e.touches;

    if (touches.length === 1) {
      // Single Finger Drag
      const t = touches[0];
      touchState.current = {
        startX: t.clientX,
        startY: t.clientY,
        startElemX: customization.x || 0,
        startElemY: customization.y || 0,
        startScale: customization.scale || 1,
        startRotation: customization.rotation || 0,
        startDistance: 0,
        startAngle: 0,
        centerX: t.clientX,
        centerY: t.clientY,
      };
      setIsDragging(true);
      setActiveGesture('drag');
    } else if (touches.length === 2) {
      // Two-Finger Pinch & Rotate Gesture
      e.preventDefault();
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const angle = (Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180) / Math.PI;

      touchState.current = {
        startX: (t1.clientX + t2.clientX) / 2,
        startY: (t1.clientY + t2.clientY) / 2,
        startElemX: customization.x || 0,
        startElemY: customization.y || 0,
        startScale: customization.scale || 1,
        startRotation: customization.rotation || 0,
        startDistance: dist || 1,
        startAngle: angle,
        centerX: (t1.clientX + t2.clientX) / 2,
        centerY: (t1.clientY + t2.clientY) / 2,
      };
      setIsDragging(false);
      setActiveGesture('pinch');
    }
  };

  // Mouse Drag Start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    onSelect(id, e);

    touchState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startElemX: customization.x || 0,
      startElemY: customization.y || 0,
      startScale: customization.scale || 1,
      startRotation: customization.rotation || 0,
      startDistance: 0,
      startAngle: 0,
      centerX: e.clientX,
      centerY: e.clientY,
    };
    setIsDragging(true);
    setActiveGesture('drag');
  };

  // 2. Corner Resize Handle Touch/Mouse Start
  const handleResizeStart = (handle: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if ('preventDefault' in e) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    touchState.current = {
      startX: clientX,
      startY: clientY,
      startElemX: customization.x || 0,
      startElemY: customization.y || 0,
      startScale: customization.scale || 1,
      startRotation: customization.rotation || 0,
      startDistance: 0,
      startAngle: 0,
      centerX: clientX,
      centerY: clientY,
    };
    setIsResizing(handle);
    setActiveGesture('pinch');
  };

  // 3. Rotation Handle Touch/Mouse Start
  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if ('preventDefault' in e) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      touchState.current.centerX = rect.left + rect.width / 2;
      touchState.current.centerY = rect.top + rect.height / 2;
    }

    const startAngle =
      (Math.atan2(clientY - touchState.current.centerY, clientX - touchState.current.centerX) * 180) / Math.PI;

    touchState.current.startAngle = startAngle;
    touchState.current.startRotation = customization.rotation || 0;

    setIsRotating(true);
    setActiveGesture('rotate');
  };

  // Global Pointer / Touch Move
  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isEditMode) return;

      if ('touches' in e) {
        const touches = e.touches;

        // Two-Finger Pinch & Rotate in real-time
        if (touches.length === 2) {
          e.preventDefault();
          const t1 = touches[0];
          const t2 = touches[1];
          const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
          const angle = (Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180) / Math.PI;

          // Pinch scale calculation
          const scaleFactor = dist / touchState.current.startDistance;
          const newScale = Math.max(0.35, Math.min(3.5, Number((touchState.current.startScale * scaleFactor).toFixed(2))));

          // Two-finger rotation calculation
          let deltaAngle = angle - touchState.current.startAngle;
          let newRotation = Math.round(touchState.current.startRotation + deltaAngle);
          if (newRotation > 180) newRotation -= 360;
          if (newRotation < -180) newRotation += 360;

          // Translation mid-point delta
          const currentMidX = (t1.clientX + t2.clientX) / 2;
          const currentMidY = (t1.clientY + t2.clientY) / 2;
          const deltaX = currentMidX - touchState.current.startX;
          const deltaY = currentMidY - touchState.current.startY;

          onChange(id, {
            scale: newScale,
            rotation: newRotation,
            x: Math.round(touchState.current.startElemX + deltaX),
            y: Math.round(touchState.current.startElemY + deltaY),
          });
          return;
        }
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const deltaX = clientX - touchState.current.startX;
        const deltaY = clientY - touchState.current.startY;

        onChange(id, {
          x: Math.round(touchState.current.startElemX + deltaX),
          y: Math.round(touchState.current.startElemY + deltaY),
        });
      } else if (isResizing) {
        const deltaX = clientX - touchState.current.startX;
        const deltaY = clientY - touchState.current.startY;

        const factor = isResizing.includes('e') || isResizing.includes('s') ? 1 : -1;
        const dist = (deltaX + deltaY * factor) / 160;
        const newScale = Math.max(0.35, Math.min(3.5, Number((touchState.current.startScale + dist).toFixed(2))));

        onChange(id, {
          scale: newScale,
        });
      } else if (isRotating) {
        const currentAngle =
          (Math.atan2(clientY - touchState.current.centerY, clientX - touchState.current.centerX) * 180) / Math.PI;

        let deltaAngle = currentAngle - touchState.current.startAngle;
        let newRotation = Math.round(touchState.current.startRotation + deltaAngle);
        if (newRotation > 180) newRotation -= 360;
        if (newRotation < -180) newRotation += 360;

        onChange(id, {
          rotation: newRotation,
        });
      }
    },
    [id, isEditMode, isDragging, isResizing, isRotating, onChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
    setIsRotating(false);
    setActiveGesture(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing || isRotating || activeGesture) {
      window.addEventListener('mousemove', handlePointerMove, { passive: false });
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      window.addEventListener('touchcancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [isDragging, isResizing, isRotating, activeGesture, handlePointerMove, handlePointerUp]);

  // Handle phone image selection directly from touch toolbar
  const handlePhoneImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(id, {
            customImage: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Derived transform and styling
  const customStyles: React.CSSProperties = {
    ...style,
    transform: `translate3d(${customization.x}px, ${customization.y}px, 0px) scale(${customization.scale}) rotate(${customization.rotation}deg)`,
    opacity: customization.visible ? customization.opacity : isEditMode ? 0.35 : 0,
    borderRadius: customization.borderRadius !== undefined ? `${customization.borderRadius}px` : undefined,
    touchAction: isEditMode && isSelected ? 'none' : 'auto',
    transition: isDragging || isResizing || isRotating || activeGesture ? 'none' : 'transform 0.12s ease-out, opacity 0.15s ease',
  };

  // If hidden and not in edit mode, don't render (must be after all hooks)
  if (!customization.visible && !isEditMode) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id={`custom-elem-${id}`}
      onTouchStart={handleTouchStart}
      onMouseDown={handleMouseDown}
      className={`relative ${isEditMode ? 'cursor-pointer select-none group' : ''} ${className}`}
      style={customStyles}
    >
      {/* Hidden file input for phone image picker */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handlePhoneImageUpload}
      />

      {/* Visual Component Content */}
      <div className="w-full h-full relative pointer-events-auto">
        {children}
      </div>

      {/* EDIT MODE OVERLAY, TOUCH HANDLES & COMPACT TOOLBAR */}
      {isEditMode && (
        <div
          className={`absolute -inset-1 rounded-xl transition-all pointer-events-none z-30 ${
            isSelected
              ? 'border-2 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.65)] ring-2 ring-purple-500/40'
              : 'border border-dashed border-white/35 hover:border-cyan-400/80 hover:bg-cyan-500/10'
          } ${!customization.visible ? 'border-rose-500/70 bg-rose-950/20' : ''}`}
        >
          {/* Active Gesture / Rotation / Scale Indicator */}
          {isSelected && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950/95 border border-cyan-400 text-[10px] font-bold text-cyan-300 shadow-xl flex items-center gap-1.5 whitespace-nowrap z-50 pointer-events-auto">
              <span>{customization.name}</span>
              <span className="text-purple-300">({Math.round(customization.scale * 100)}%)</span>
              {customization.rotation !== 0 && (
                <span className="text-amber-300">🔄 {customization.rotation}°</span>
              )}
            </div>
          )}

          {/* Selected State: Touch Handles & Floating Compact Toolbar */}
          {isSelected && (
            <>
              {/* 1. Top Rotation Lollipop Handle (Touch & Drag to Rotate) */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-40">
                <div
                  onMouseDown={handleRotateStart}
                  onTouchStart={handleRotateStart}
                  className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-125 transition-transform"
                  title="Touch and drag to rotate"
                >
                  <RotateCw className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="w-0.5 h-3 bg-cyan-400" />
              </div>

              {/* 2. Four Corner Pinch/Resize Touch Handles */}
              <div
                onMouseDown={(e) => handleResizeStart('nw', e)}
                onTouchStart={(e) => handleResizeStart('nw', e)}
                className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-lg cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center"
                title="Pinch or drag corner to resize"
              />
              <div
                onMouseDown={(e) => handleResizeStart('ne', e)}
                onTouchStart={(e) => handleResizeStart('ne', e)}
                className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-lg cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center"
                title="Pinch or drag corner to resize"
              />
              <div
                onMouseDown={(e) => handleResizeStart('sw', e)}
                onTouchStart={(e) => handleResizeStart('sw', e)}
                className="absolute -bottom-2.5 -left-2.5 w-5 h-5 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-lg cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center"
                title="Pinch or drag corner to resize"
              />
              <div
                onMouseDown={(e) => handleResizeStart('se', e)}
                onTouchStart={(e) => handleResizeStart('se', e)}
                className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-lg cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center"
                title="Pinch or drag corner to resize"
              />

              {/* 3. Center Drag & Move Surface Indicator */}
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 shadow-xl cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center transition-transform hover:scale-110 z-40"
                title="Touch and drag anywhere to move"
              >
                <Move className="w-3.5 h-3.5" />
              </div>

              {/* 4. COMPACT FLOATING TOUCH TOOLBAR (Move | Resize | Rotate | Replace | Delete | Reset) */}
              <div
                className="absolute -bottom-11 left-1/2 -translate-x-1/2 px-2 py-1 rounded-2xl bg-slate-950/95 border border-cyan-500/60 shadow-2xl backdrop-blur-2xl flex items-center gap-1.5 z-50 pointer-events-auto whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {/* Resize Smaller */}
                <button
                  type="button"
                  onClick={() =>
                    onChange(id, {
                      scale: Math.max(0.35, Number((customization.scale - 0.1).toFixed(2))),
                    })
                  }
                  title="Resize Smaller"
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                {/* Resize Larger */}
                <button
                  type="button"
                  onClick={() =>
                    onChange(id, {
                      scale: Math.min(3.5, Number((customization.scale + 0.1).toFixed(2))),
                    })
                  }
                  title="Resize Larger"
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                {/* Rotate Step (-15°) */}
                <button
                  type="button"
                  onClick={() => {
                    let nextRot = (customization.rotation || 0) - 15;
                    if (nextRot < -180) nextRot += 360;
                    onChange(id, { rotation: nextRot });
                  }}
                  title="Rotate Left (-15°)"
                  className="p-1 rounded-lg hover:bg-slate-800 text-purple-300 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Rotate Step (+15°) */}
                <button
                  type="button"
                  onClick={() => {
                    let nextRot = (customization.rotation || 0) + 15;
                    if (nextRot > 180) nextRot -= 360;
                    onChange(id, { rotation: nextRot });
                  }}
                  title="Rotate Right (+15°)"
                  className="p-1 rounded-lg hover:bg-slate-800 text-purple-300 hover:text-white transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Replace Image from Phone */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Replace Image from Phone"
                  className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>Replace</span>
                </button>

                {/* Delete / Hide */}
                <button
                  type="button"
                  onClick={() => onChange(id, { visible: !customization.visible })}
                  title={customization.visible ? 'Hide Element' : 'Show Element'}
                  className={`p-1 rounded-lg hover:bg-slate-800 ${customization.visible ? 'text-slate-400 hover:text-rose-400' : 'text-rose-400'}`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>

                {/* Open Full Inspector */}
                {onOpenInspector && (
                  <button
                    type="button"
                    onClick={() => onOpenInspector(id)}
                    title="Open Full Inspector & Icon Catalog"
                    className="p-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Reset Element */}
                <button
                  type="button"
                  onClick={() =>
                    onChange(id, {
                      x: 0,
                      y: 0,
                      scale: 1,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                      customImage: null,
                      customIcon: null,
                    })
                  }
                  title="Reset element to original"
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-pink-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
