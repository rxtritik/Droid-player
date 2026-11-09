import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Sliders, Sparkles, Activity, Check } from 'lucide-react';

export interface EQBand {
  id: string;
  freq: string;
  label: string;
  value: number; // in dB, range -12 to +12
}

export const DEFAULT_BANDS: EQBand[] = [
  { id: 'sub', freq: '60 Hz', label: 'Sub', value: 0 },
  { id: 'bass', freq: '230 Hz', label: 'Bass', value: 0 },
  { id: 'mid', freq: '910 Hz', label: 'Mid', value: 0 },
  { id: 'presence', freq: '3.6 kHz', label: 'Presence', value: 0 },
  { id: 'treble', freq: '14 kHz', label: 'Treble', value: 0 },
];

export const EQ_PRESETS: { name: string; bands: number[]; bassBoost: number; virtualizer: number }[] = [
  { name: 'Flat', bands: [0, 0, 0, 0, 0], bassBoost: 0, virtualizer: 0 },
  { name: 'Bass Boost', bands: [7, 5, 2, 0, -1], bassBoost: 65, virtualizer: 20 },
  { name: 'Electronic', bands: [5, 4, -1, 3, 5], bassBoost: 50, virtualizer: 40 },
  { name: 'Rock', bands: [5, 3, -1, 3, 6], bassBoost: 40, virtualizer: 30 },
  { name: 'Vocal', bands: [-2, 0, 5, 4, 1], bassBoost: 10, virtualizer: 25 },
  { name: 'Acoustic', bands: [3, 2, 2, 4, 3], bassBoost: 20, virtualizer: 35 },
  { name: 'Jazz', bands: [3, 2, -1, 2, 4], bassBoost: 25, virtualizer: 45 },
  { name: 'Hip-Hop', bands: [6, 4, 0, 2, 3], bassBoost: 60, virtualizer: 15 },
];

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  bands: EQBand[];
  setBands: React.Dispatch<React.SetStateAction<EQBand[]>>;
  bassBoost: number;
  setBassBoost: (val: number) => void;
  virtualizer: number;
  setVirtualizer: (val: number) => void;
  selectedPreset: string;
  setSelectedPreset: (preset: string) => void;
  isPlaying: boolean;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  isEnabled,
  setIsEnabled,
  bands,
  setBands,
  bassBoost,
  setBassBoost,
  virtualizer,
  setVirtualizer,
  selectedPreset,
  setSelectedPreset,
  isPlaying,
}) => {
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const sliderRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Real-time animated spectrum bars to simulate reactive EQ output
  const [spectrumEnergy, setSpectrumEnergy] = useState<number[]>(new Array(16).fill(10));

  useEffect(() => {
    if (!isPlaying) {
      setSpectrumEnergy(new Array(16).fill(6));
      return;
    }

    const interval = setInterval(() => {
      setSpectrumEnergy(() => {
        return Array.from({ length: 16 }, (_, i) => {
          // Weight spectrum by the closest EQ band
          const bandIndex = Math.min(4, Math.floor((i / 16) * 5));
          const bandBoost = isEnabled ? bands[bandIndex].value : 0;
          const bassExtra = isEnabled && i < 6 ? bassBoost * 0.2 : 0;
          const base = 25 + Math.random() * 45;
          const calculated = Math.min(95, Math.max(10, base + bandBoost * 3 + bassExtra));
          return calculated;
        });
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, isEnabled, bands, bassBoost]);

  const handleBandValueChange = (index: number, newValue: number) => {
    const clamped = Math.max(-12, Math.min(12, Math.round(newValue)));
    setBands((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: clamped };
      return updated;
    });
    setSelectedPreset('Custom');
  };

  const handleSelectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const presetObj = EQ_PRESETS.find((p) => p.name === presetName);
    if (presetObj) {
      setBands((prev) =>
        prev.map((band, idx) => ({
          ...band,
          value: presetObj.bands[idx] ?? 0,
        }))
      );
      setBassBoost(presetObj.bassBoost);
      setVirtualizer(presetObj.virtualizer);
    }
  };

  const handleReset = () => {
    handleSelectPreset('Flat');
  };

  // Drag interaction handler for vertical sliders
  const handlePointerDown = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEnabled) return;
    setActiveDragIndex(index);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSliderFromPointer(index, e.clientY);
  };

  const handlePointerMove = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragIndex === index) {
      updateSliderFromPointer(index, e.clientY);
    }
  };

  const handlePointerUp = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragIndex === index) {
      setActiveDragIndex(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
    }
  };

  const updateSliderFromPointer = (index: number, clientY: number) => {
    const el = sliderRefs.current[index];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const height = rect.height;
    const relativeY = clientY - rect.top;
    // Top is +12dB (0%), Bottom is -12dB (100%)
    const clampedY = Math.max(0, Math.min(height, relativeY));
    const ratio = 1 - clampedY / height; // 0 to 1
    const dB = -12 + ratio * 24; // map 0..1 to -12..+12
    handleBandValueChange(index, dB);
  };

  // Generate SVG curve points for the visual EQ response
  const curvePoints = () => {
    const width = 340;
    const height = 90;
    const midY = height / 2; // 0 dB line

    const pts = bands.map((b, i) => {
      const x = (i / (bands.length - 1)) * (width - 40) + 20;
      // b.value is -12 to +12. When disabled, value acts as 0
      const val = isEnabled ? b.value : 0;
      // +12dB -> y = 10, -12dB -> y = 80
      const y = midY - (val / 12) * (midY - 10);
      return { x, y };
    });

    if (pts.length < 2) return '';

    // Smooth spline
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const fillPath = `${path} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;
    return { strokePath: path, fillPath, pts };
  };

  const curveData = curvePoints();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="equalizer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-end"
        >
          {/* Modal / Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[88%] bg-[#0d0704] border-t border-white/10 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden text-white safe-bottom"
          >
            {/* Sheet Handle */}
            <div className="w-full flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold italic tracking-tight">Equalizer</h3>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider font-mono">
                    {isEnabled ? `${selectedPreset} Preset` : 'Bypassed'}
                  </p>
                </div>
              </div>

              {/* Master Power Toggle & Close */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isEnabled
                      ? 'bg-brand text-white shadow-lg shadow-brand/30'
                      : 'bg-white/10 text-white/40 hover:bg-white/15'
                  }`}
                  title={isEnabled ? 'Disable Equalizer' : 'Enable Equalizer'}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isEnabled ? 'bg-white animate-pulse' : 'bg-white/30'
                    }`}
                  />
                  <span>{isEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  aria-label="Close Equalizer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 no-scrollbar">
              {/* Visual Frequency Response Curve & Real-Time Spectrum */}
              <div className="relative rounded-2xl bg-white/5 border border-white/5 p-4 overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 flex items-center gap-1">
                    <Activity size={12} className="text-brand" /> Response Curve
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      className="text-[11px] text-white/50 hover:text-brand flex items-center gap-1 transition-colors"
                      title="Reset all bands to flat"
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* SVG Curve Display */}
                <div className="relative h-24 w-full flex items-center justify-center">
                  {/* Subtle 0dB Center Reference Line */}
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 border-b border-dashed border-white/15 pointer-events-none" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/30">
                    0dB
                  </span>

                  {/* Reactive Spectrum Bars in Background */}
                  <div className="absolute inset-x-6 bottom-0 top-3 flex items-end justify-between gap-1 opacity-25 pointer-events-none">
                    {spectrumEnergy.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-brand to-brand/40 rounded-t-sm transition-all duration-150"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>

                  {/* SVG Graph */}
                  {typeof curveData !== 'string' && (
                    <svg
                      viewBox="0 0 340 90"
                      className="w-full h-full overflow-visible z-10"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="eqGlowGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff4e00" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#ff4e00" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path d={curveData.fillPath} fill="url(#eqGlowGradient)" />

                      {/* Line Stroke */}
                      <path
                        d={curveData.strokePath}
                        fill="none"
                        stroke={isEnabled ? '#ff4e00' : 'rgba(255,255,255,0.3)'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        style={{
                          filter: isEnabled ? 'drop-shadow(0 0 8px rgba(255, 78, 0, 0.6))' : 'none',
                        }}
                      />

                      {/* Node Dots */}
                      {curveData.pts.map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r={activeDragIndex === i ? '5' : '3.5'}
                          fill={isEnabled ? '#ffffff' : '#888888'}
                          stroke="#ff4e00"
                          strokeWidth="2"
                          className="transition-all"
                        />
                      ))}
                    </svg>
                  )}
                </div>
              </div>

              {/* Preset Selector Chips */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                    Audio Presets
                  </span>
                  {selectedPreset === 'Custom' && (
                    <span className="text-[10px] text-brand uppercase font-mono tracking-wider font-semibold">
                      Customized
                    </span>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {EQ_PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.name;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handleSelectPreset(preset.name)}
                        className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all border ${
                          isSelected
                            ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20 font-semibold'
                            : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5-Band Vertical Interactive Sliders */}
              <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                    Frequency Bands (±12 dB)
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Drag to tune</span>
                </div>

                <div className="grid grid-cols-5 gap-2 select-none">
                  {bands.map((band, index) => {
                    // Position percentage: -12dB is 0% (bottom), +12dB is 100% (top)
                    const percent = ((band.value + 12) / 24) * 100;
                    const isCenter = band.value === 0;
                    const isPositive = band.value > 0;
                    const isDragging = activeDragIndex === index;

                    return (
                      <div key={band.id} className="flex flex-col items-center">
                        {/* dB Value Readout */}
                        <div
                          className={`text-[11px] font-mono font-semibold mb-2 transition-colors ${
                            !isEnabled
                              ? 'text-white/30'
                              : isDragging
                              ? 'text-brand scale-110'
                              : isCenter
                              ? 'text-white/50'
                              : 'text-brand'
                          }`}
                        >
                          {band.value > 0 ? `+${band.value}` : band.value}
                          <span className="text-[9px] opacity-60 ml-0.5">dB</span>
                        </div>

                        {/* Interactive Vertical Slider Track */}
                        <div
                          ref={(el) => {
                            sliderRefs.current[index] = el;
                          }}
                          onPointerDown={(e) => handlePointerDown(index, e)}
                          onPointerMove={(e) => handlePointerMove(index, e)}
                          onPointerUp={(e) => handlePointerUp(index, e)}
                          onPointerCancel={(e) => handlePointerUp(index, e)}
                          className={`relative w-8 h-36 rounded-full flex justify-center items-center cursor-pointer transition-opacity ${
                            isEnabled ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
                          } ${isDragging ? 'ring-2 ring-brand/40' : ''}`}
                          style={{ touchAction: 'none' }}
                        >
                          {/* Outer Track Bar */}
                          <div className="w-2 h-full bg-white/10 rounded-full relative overflow-hidden">
                            {/* Center 0dB tick indicator */}
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/30 z-10" />

                            {/* Active Fill from 0dB center line */}
                            {isEnabled && !isCenter && (
                              <div
                                className="absolute inset-x-0 bg-brand rounded-full transition-all duration-75"
                                style={
                                  isPositive
                                    ? {
                                        bottom: '50%',
                                        height: `${((band.value) / 24) * 100}%`,
                                      }
                                    : {
                                        top: '50%',
                                        height: `${(Math.abs(band.value) / 24) * 100}%`,
                                      }
                                }
                              />
                            )}
                          </div>

                          {/* Draggable Slider Thumb */}
                          <div
                            className={`absolute w-6 h-6 rounded-full border-2 transition-transform duration-75 flex items-center justify-center shadow-md ${
                              isDragging
                                ? 'scale-125 bg-white border-brand shadow-brand/60'
                                : 'bg-[#180e09] border-brand hover:scale-110'
                            }`}
                            style={{
                              bottom: `calc(${percent}% - 12px)`,
                              boxShadow: isEnabled
                                ? '0 0 10px rgba(255, 78, 0, 0.4)'
                                : 'none',
                            }}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDragging ? 'bg-brand' : 'bg-white'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Frequency & Label */}
                        <div className="mt-2 text-center">
                          <p className="text-[11px] font-semibold text-white/90 truncate">
                            {band.freq}
                          </p>
                          <p className="text-[9px] uppercase tracking-wider text-white/40">
                            {band.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Audio DSP Sliders (Bass Boost & 3D Virtualizer) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Bass Boost */}
                <div className="rounded-2xl bg-white/5 border border-white/5 p-3.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold flex items-center gap-1.5 text-white/90">
                      <Sparkles size={13} className="text-brand" /> Bass Boost
                    </span>
                    <span className="text-xs font-mono font-semibold text-brand">
                      {isEnabled ? `${bassBoost}%` : '0%'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mb-2">Punchy low-frequency dynamic boost</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isEnabled ? bassBoost : 0}
                    disabled={!isEnabled}
                    onChange={(e) => {
                      setBassBoost(Number(e.target.value));
                      setSelectedPreset('Custom');
                    }}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand disabled:opacity-40"
                    style={{
                      background: `linear-gradient(to right, #ff4e00 ${bassBoost}%, rgba(255,255,255,0.1) ${bassBoost}%)`,
                    }}
                  />
                </div>

                {/* 3D Surround Virtualizer */}
                <div className="rounded-2xl bg-white/5 border border-white/5 p-3.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold flex items-center gap-1.5 text-white/90">
                      <Activity size={13} className="text-brand" /> 3D Surround
                    </span>
                    <span className="text-xs font-mono font-semibold text-brand">
                      {isEnabled ? `${virtualizer}%` : '0%'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mb-2">Wide immersive acoustic soundstage</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isEnabled ? virtualizer : 0}
                    disabled={!isEnabled}
                    onChange={(e) => {
                      setVirtualizer(Number(e.target.value));
                      setSelectedPreset('Custom');
                    }}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand disabled:opacity-40"
                    style={{
                      background: `linear-gradient(to right, #ff4e00 ${virtualizer}%, rgba(255,255,255,0.1) ${virtualizer}%)`,
                    }}
                  />
                </div>
              </div>

              {/* Status Note */}
              <div className="px-1 py-1 text-center">
                <p className="text-[10px] text-white/35 font-mono">
                  {isEnabled
                    ? 'DSP audio processing simulated with reactive spectral shaping'
                    : 'Equalizer currently bypassed. Toggle ON to activate custom sound profile'}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/5 bg-[#0a0502]/60 flex items-center justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-brand text-white shadow-lg shadow-brand/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Apply & Close</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
