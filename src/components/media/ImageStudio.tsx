'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import AIModelSelector, { type AIModel } from '@/components/AIModelSelector';

// ── Types ──────────────────────────────────────────────────────────────────
type StudioTab = 'enhance' | 'stage' | 'renovate' | 'cleanup';

interface ToolDef {
  id: string;
  icon: string;
  label: string;
  apiType: string;
  tab: StudioTab;
}

// ── Tool definitions ───────────────────────────────────────────────────────
const tools: ToolDef[] = [
  // Enhance
  { id: 'auto-lighting', icon: 'light_mode', label: 'Auto-Lighting', apiType: 'auto', tab: 'enhance' },
  { id: 'denoise', icon: 'grain', label: 'Denoise & Sharp', apiType: 'denoise', tab: 'enhance' },
  { id: 'sky-blue', icon: 'wb_sunny', label: 'Blue Sky', apiType: 'sky', tab: 'enhance' },
  { id: 'sky-sunset', icon: 'wb_twilight', label: 'Golden Sunset', apiType: 'sky_sunset', tab: 'enhance' },
  { id: 'sky-dramatic', icon: 'cloud', label: 'Dramatic Clouds', apiType: 'sky_dramatic', tab: 'enhance' },
  { id: 'twilight', icon: 'dark_mode', label: 'Virtual Twilight', apiType: 'twilight', tab: 'enhance' },
  { id: 'season-summer', icon: 'local_florist', label: 'Summer', apiType: 'season_summer', tab: 'enhance' },
  { id: 'season-autumn', icon: 'eco', label: 'Autumn', apiType: 'season_autumn', tab: 'enhance' },
  { id: 'season-winter', icon: 'ac_unit', label: 'Winter', apiType: 'season_winter', tab: 'enhance' },
  // Stage
  { id: 'stage-living', icon: 'weekend', label: 'Living Room', apiType: 'living', tab: 'stage' },
  { id: 'stage-bedroom', icon: 'bed', label: 'Bedroom', apiType: 'bedroom', tab: 'stage' },
  { id: 'stage-kitchen', icon: 'countertops', label: 'Kitchen', apiType: 'kitchen', tab: 'stage' },
  { id: 'stage-dining', icon: 'table_restaurant', label: 'Dining Room', apiType: 'dining', tab: 'stage' },
  { id: 'stage-bathroom', icon: 'bathtub', label: 'Bathroom', apiType: 'bathroom', tab: 'stage' },
  { id: 'stage-office', icon: 'desk', label: 'Office', apiType: 'office', tab: 'stage' },
  { id: 'stage-basement', icon: 'foundation', label: 'Basement', apiType: 'basement', tab: 'stage' },
  { id: 'stage-patio', icon: 'deck', label: 'Patio', apiType: 'patio', tab: 'stage' },
  // Renovate
  { id: 'reno-kitchen', icon: 'kitchen', label: 'Kitchen Remodel', apiType: 'kitchen_renovate', tab: 'renovate' },
  { id: 'reno-bathroom', icon: 'shower', label: 'Bathroom Remodel', apiType: 'bathroom_renovate', tab: 'renovate' },
  { id: 'reno-living', icon: 'chair', label: 'Living Room', apiType: 'living_renovate', tab: 'renovate' },
  { id: 'reno-bedroom', icon: 'king_bed', label: 'Bedroom Refresh', apiType: 'bedroom_renovate', tab: 'renovate' },
  { id: 'reno-exterior', icon: 'home', label: 'Exterior Facelift', apiType: 'exterior_renovate', tab: 'renovate' },
  { id: 'reno-flooring', icon: 'grid_on', label: 'New Flooring', apiType: 'flooring_renovate', tab: 'renovate' },
  { id: 'reno-paint', icon: 'format_paint', label: 'Repaint Walls', apiType: 'paint_renovate', tab: 'renovate' },
  // Cleanup
  { id: 'object-removal', icon: 'delete_sweep', label: 'Object Removal', apiType: 'object_removal', tab: 'cleanup' },
  { id: 'declutter', icon: 'cleaning_services', label: 'Declutter', apiType: 'declutter', tab: 'cleanup' },
  { id: 'curb-appeal', icon: 'yard', label: 'Curb Appeal', apiType: 'curb_appeal', tab: 'cleanup' },
  { id: 'facade-refresh', icon: 'home_repair_service', label: 'Facade Refresh', apiType: 'facade_refresh', tab: 'cleanup' },
];

const tabDefs: { id: StudioTab; label: string; icon: string }[] = [
  { id: 'enhance', label: 'Enhance', icon: 'auto_awesome' },
  { id: 'stage', label: 'Stage', icon: 'chair' },
  { id: 'renovate', label: 'Renovate', icon: 'construction' },
  { id: 'cleanup', label: 'Cleanup', icon: 'cleaning_services' },
];

const styleOptions = [
  { value: 'modern', label: 'Modern' },
  { value: 'scandinavian', label: 'Scandi' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'minimalist', label: 'Minimal' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'bohemian', label: 'Boho' },
  { value: 'midcentury', label: 'Mid-Century' },
  { value: 'farmhouse', label: 'Farmhouse' },
];

// ── Before/After Slider Component ──────────────────────────────────────────
function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => updatePosition(e.clientX);
    const onTouchMove = (e: TouchEvent) => updatePosition(e.touches[0].clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, updatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-xl cursor-col-resize select-none"
      onMouseDown={(e) => { e.stopPropagation(); setDragging(true); updatePosition(e.clientX); }}
      onTouchStart={(e) => { e.stopPropagation(); setDragging(true); updatePosition(e.touches[0].clientX); }}
    >
      {/* After (full) */}
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      {/* Before (clipped at full size) */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      </div>

      {/* Slider line */}
      <div className="absolute top-0 bottom-0" style={{ left: `${position}%` }}>
        <div className="absolute -translate-x-1/2 top-0 bottom-0 w-0.5 bg-white shadow-lg" />
        <div className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <span className="text-slate-600 text-sm font-bold">⟷</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md font-medium">Before</div>
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md font-medium">After</div>
    </div>
  );
}

// ── Main Studio Component ──────────────────────────────────────────────────
export function ImageStudio({ className = '' }: { className?: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>('enhance');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedModel, setSelectedModel] = useState<AIModel>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<Array<{ before: string; after: string; tool: string }>>([]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleGenerate = async () => {
    if (!image || !selectedTool) return;
    const tool = tools.find(t => t.id === selectedTool);
    if (!tool) return;

    setIsProcessing(true);
    setError(null);

    try {
      const endpoint = tool.tab === 'stage' ? '/api/staging' : '/api/enhance';
      const body: Record<string, unknown> = {
        image,
        model: selectedModel,
      };

      if (tool.tab === 'stage') {
        body.roomType = tool.apiType;
        body.furnitureStyle = selectedStyle;
      } else if (tool.tab === 'renovate') {
        body.enhancementType = 'renovate';
        body.customPrompt = getRenovatePrompt(tool.apiType, selectedStyle);
      } else {
        body.enhancementType = tool.apiType;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Processing failed');

      setResult(data.output);
      setHistory(prev => [{ before: image, after: data.output, tool: tool.label }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `zestio_${selectedTool || 'result'}.png`;
    a.click();
  };

  const resetAll = () => {
    setImage(null);
    setResult(null);
    setSelectedTool(null);
    setError(null);
  };

  const filteredTools = tools.filter(t => t.tab === activeTab);
  const showStylePicker = activeTab === 'stage' || activeTab === 'renovate';

  return (
    <div className={`flex h-full ${className}`}>
      {/* ── Left: Image Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Image Preview */}
        <div
          className={`flex-1 relative rounded-xl overflow-hidden ${
            dragOver ? 'ring-2 ring-indigo-500' : ''
          } ${!image ? 'bg-slate-100' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {result && image ? (
            <BeforeAfterSlider before={image} after={result} />
          ) : image ? (
            <img src={image} alt="Uploaded" className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-5xl text-slate-300">add_photo_alternate</span>
              <p className="text-slate-400 text-sm">Drop an image or click to upload</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Browse Files
              </button>
            </div>
          )}
          {!image && (
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          )}
        </div>

        {/* Bottom bar */}
        {(image || result) && (
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-2">
              {image && (
                <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  New Image
                </button>
              )}
              {history.length > 0 && (
                <button onClick={() => setShowHistory(!showHistory)} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  History ({history.length})
                </button>
              )}
            </div>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setResult(null); }}
                  className="px-3 py-1.5 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Edit Again
                </button>
                <button
                  onClick={downloadResult}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download
                </button>
              </div>
            )}
          </div>
        )}

        {/* History panel */}
        {showHistory && history.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Recent Edits</span>
              <button onClick={() => { setHistory([]); setShowHistory(false); }} className="text-xs text-slate-400 hover:text-red-500">Clear</button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {history.map((item, i) => (
                <button key={i} onClick={() => { setImage(item.before); setResult(item.after); }} className="flex-shrink-0 rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-colors">
                  <img src={item.after} alt={item.tool} className="w-20 h-14 object-cover" />
                  <div className="text-[10px] text-center py-0.5 text-slate-500 bg-slate-50">{item.tool}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Tools Panel ── */}
      <div className="w-80 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {tabDefs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedTool(null); }}
              className={`flex-1 py-3 text-xs font-semibold transition-colors flex flex-col items-center gap-1 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tools Grid */}
          <div className="grid grid-cols-2 gap-2">
            {filteredTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg transition-all ${
                  selectedTool === tool.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tool.icon}</span>
                <span className="text-[11px] font-medium leading-tight text-center">{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Style Picker */}
          {showStylePicker && (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-2 block">Style</label>
              <div className="flex flex-wrap gap-1.5">
                {styleOptions.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedStyle(s.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedStyle === s.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Model Selector */}
          {selectedTool && (
            <div className="bg-slate-50 rounded-lg p-3">
              <AIModelSelector category={activeTab === 'stage' ? 'staging' : 'enhance'} selected={selectedModel} onSelect={setSelectedModel} />
            </div>
          )}
        </div>

        {/* Generate Button (fixed bottom) */}
        <div className="p-4 border-t border-slate-200">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3 flex justify-between items-center">
              {error}
              <button onClick={() => setError(null)} className="font-bold">×</button>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={!image || !selectedTool || isProcessing}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getRenovatePrompt(type: string, style: string): string {
  const roomMap: Record<string, string> = {
    kitchen_renovate: 'fully renovated modern kitchen',
    bathroom_renovate: 'fully renovated modern bathroom',
    living_renovate: 'fully renovated modern living room',
    bedroom_renovate: 'fully renovated modern bedroom',
    exterior_renovate: 'fully renovated modern house exterior',
    flooring_renovate: 'room with brand new premium flooring',
    paint_renovate: 'room with freshly painted modern walls',
  };
  const room = roomMap[type] || 'fully renovated room';
  return `${room}, ${style} style, professional real estate photography, high quality, clean and bright, photorealistic`;
}
