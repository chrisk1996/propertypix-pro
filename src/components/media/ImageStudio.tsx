'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import AIModelSelector, { type AIModel } from '@/components/AIModelSelector';
import { useTranslations } from 'next-intl';

// ── Types ──────────────────────────────────────────────────────────────────
type StudioTab = 'enhance' | 'stage' | 'renovate' | 'cleanup';

interface ToolDef {
  id: string;
  icon: string;
  labelKey: string;
  apiType: string;
  tab: StudioTab;
}

// ── Tool definitions (keys resolved in render via t()) ─────────────────────
const tools: ToolDef[] = [
  { id: 'auto-lighting', icon: 'light_mode', labelKey: 'toolAutoLighting', apiType: 'auto', tab: 'enhance' },
  { id: 'denoise', icon: 'grain', labelKey: 'toolDenoise', apiType: 'denoise', tab: 'enhance' },
  { id: 'upscale-4k', icon: 'hd', labelKey: 'toolUpscale4k', apiType: 'upscale', tab: 'enhance' },
  { id: 'sky-blue', icon: 'wb_sunny', labelKey: 'toolBlueSky', apiType: 'sky', tab: 'enhance' },
  { id: 'sky-sunset', icon: 'wb_twilight', labelKey: 'toolGoldenSunset', apiType: 'sky_sunset', tab: 'enhance' },
  { id: 'sky-dramatic', icon: 'cloud', labelKey: 'toolDramaticClouds', apiType: 'sky_dramatic', tab: 'enhance' },
  { id: 'twilight', icon: 'dark_mode', labelKey: 'toolVirtualTwilight', apiType: 'twilight', tab: 'enhance' },
  { id: 'season-summer', icon: 'local_florist', labelKey: 'toolSummer', apiType: 'season_summer', tab: 'enhance' },
  { id: 'season-autumn', icon: 'eco', labelKey: 'toolAutumn', apiType: 'season_autumn', tab: 'enhance' },
  { id: 'season-winter', icon: 'ac_unit', labelKey: 'toolWinter', apiType: 'season_winter', tab: 'enhance' },
  { id: 'stage-living', icon: 'weekend', labelKey: 'toolLivingRoom', apiType: 'living', tab: 'stage' },
  { id: 'stage-bedroom', icon: 'bed', labelKey: 'toolBedroom', apiType: 'bedroom', tab: 'stage' },
  { id: 'stage-kitchen', icon: 'countertops', labelKey: 'toolKitchen', apiType: 'kitchen', tab: 'stage' },
  { id: 'stage-dining', icon: 'table_restaurant', labelKey: 'toolDiningRoom', apiType: 'dining', tab: 'stage' },
  { id: 'stage-bathroom', icon: 'bathtub', labelKey: 'toolBathroom', apiType: 'bathroom', tab: 'stage' },
  { id: 'stage-office', icon: 'desk', labelKey: 'toolOffice', apiType: 'office', tab: 'stage' },
  { id: 'stage-basement', icon: 'foundation', labelKey: 'toolBasement', apiType: 'basement', tab: 'stage' },
  { id: 'stage-patio', icon: 'deck', labelKey: 'toolPatio', apiType: 'patio', tab: 'stage' },
  { id: 'reno-kitchen', icon: 'kitchen', labelKey: 'toolKitchenRemodel', apiType: 'kitchen_renovate', tab: 'renovate' },
  { id: 'reno-bathroom', icon: 'shower', labelKey: 'toolBathroomRemodel', apiType: 'bathroom_renovate', tab: 'renovate' },
  { id: 'reno-living', icon: 'chair', labelKey: 'toolLivingRoomReno', apiType: 'living_renovate', tab: 'renovate' },
  { id: 'reno-bedroom', icon: 'king_bed', labelKey: 'toolBedroomRefresh', apiType: 'bedroom_renovate', tab: 'renovate' },
  { id: 'reno-exterior', icon: 'home', labelKey: 'toolExteriorFacelift', apiType: 'exterior_renovate', tab: 'renovate' },
  { id: 'reno-flooring', icon: 'grid_on', labelKey: 'toolNewFlooring', apiType: 'flooring_renovate', tab: 'renovate' },
  { id: 'reno-paint', icon: 'format_paint', labelKey: 'toolRepaintWalls', apiType: 'paint_renovate', tab: 'renovate' },
  { id: 'object-removal', icon: 'delete_sweep', labelKey: 'toolObjectRemoval', apiType: 'object_removal', tab: 'cleanup' },
  { id: 'declutter', icon: 'cleaning_services', labelKey: 'toolDeclutter', apiType: 'declutter', tab: 'cleanup' },
  { id: 'curb-appeal', icon: 'yard', labelKey: 'toolCurbAppeal', apiType: 'curb_appeal', tab: 'cleanup' },
  { id: 'facade-refresh', icon: 'home_repair_service', labelKey: 'toolFacadeRefresh', apiType: 'facade_refresh', tab: 'cleanup' },
];

const tabDefs: { id: StudioTab; labelKey: string; icon: string }[] = [
  { id: 'enhance', labelKey: 'tabEnhance', icon: 'auto_awesome' },
  { id: 'stage', labelKey: 'tabStage', icon: 'chair' },
  { id: 'renovate', labelKey: 'tabRenovate', icon: 'construction' },
  { id: 'cleanup', labelKey: 'tabCleanup', icon: 'cleaning_services' },
];

const styleOptions = [
  { value: 'modern', labelKey: 'styleModern' },
  { value: 'scandinavian', labelKey: 'styleScandi' },
  { value: 'luxury', labelKey: 'styleLuxury' },
  { value: 'minimalist', labelKey: 'styleMinimal' },
  { value: 'industrial', labelKey: 'styleIndustrial' },
  { value: 'bohemian', labelKey: 'styleBoho' },
  { value: 'midcentury', labelKey: 'styleMidCentury' },
  { value: 'farmhouse', labelKey: 'styleFarmhouse' },
];

// ── Batch item ────────────────────────────────────────────────────────────
interface BatchItem {
  id: string;
  input: string;
  output: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// ── Before/After Slider Component ──────────────────────────────────────────
function BeforeAfterSlider({ before, after, beforeLabel, afterLabel }: { before: string; after: string; beforeLabel: string; afterLabel: string }) {
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
      <img src={after} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={before} alt={beforeLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      </div>
      <div className="absolute top-0 bottom-0" style={{ left: `${position}%` }}>
        <div className="absolute -translate-x-1/2 top-0 bottom-0 w-0.5 bg-white shadow-lg" />
        <div className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <span className="text-slate-600 text-sm font-bold">⟷</span>
        </div>
      </div>
      <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md font-medium">{beforeLabel}</div>
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md font-medium">{afterLabel}</div>
    </div>
  );
}

// ── Main Studio Component ──────────────────────────────────────────────────
export function ImageStudio({ className = '' }: { className?: string }) {
  const ts = useTranslations('studio');
  const tc = useTranslations('common');

  // Single image mode
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Batch mode
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchMode, setBatchMode] = useState(false);

  // Shared state
  const [activeTab, setActiveTab] = useState<StudioTab>('enhance');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedModel, setSelectedModel] = useState<AIModel>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedBatchItem, setSelectedBatchItem] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<Array<{ before: string; after: string; tool: string }>>([]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (batchMode) {
        setBatchItems(prev => [...prev, {
          id: Math.random().toString(36).slice(2),
          input: reader.result as string,
          output: null,
          status: 'pending',
        }]);
      } else {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleFiles = (files: FileList) => {
    Array.from(files).forEach(f => {
      if (f.type.startsWith('image/')) handleFile(f);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (batchMode && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(e.dataTransfer.files);
    } else if (e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    const tool = tools.find(t => t.id === selectedTool);
    if (!tool) return;

    if (batchMode) {
      await handleBatchGenerate(tool);
    } else if (image) {
      await handleSingleGenerate(image, tool);
    }
  };

  const handleSingleGenerate = async (inputImage: string, tool: ToolDef) => {
    setIsProcessing(true);
    setError(null);

    try {
      const endpoint = tool.apiType === 'upscale'
        ? '/api/upscale'
        : tool.tab === 'stage' ? '/api/staging' : '/api/enhance';
      const body: Record<string, unknown> = { image: inputImage, model: selectedModel };

      if (tool.apiType === 'upscale') {
        body.scale = 4;
        delete body.model;
      } else if (tool.tab === 'stage') {
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
      if (!res.ok) throw new Error(data.error || ts('processingFailed'));

      setResult(data.output);
      setHistory(prev => [{ before: inputImage, after: data.output, tool: ts(tool.labelKey) }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : ts('processImageFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchGenerate = async (tool: ToolDef) => {
    const pending = batchItems.filter(i => i.status === 'pending');
    if (pending.length === 0) return;

    setIsProcessing(true);
    setError(null);

    setBatchItems(prev => prev.map(i =>
      i.status === 'pending' ? { ...i, status: 'processing' as const } : i
    ));

    const endpoint = tool.apiType === 'upscale'
      ? '/api/upscale'
      : tool.tab === 'stage' ? '/api/staging' : '/api/enhance';
    let failedCount = 0;

    for (const item of pending) {
      try {
        const body: Record<string, unknown> = { image: item.input, model: selectedModel };

        if (tool.apiType === 'upscale') {
          body.scale = 4;
          delete body.model;
        } else if (tool.tab === 'stage') {
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

        if (!res.ok) {
          if (res.status === 402) {
            setBatchItems(prev => prev.map(i =>
              i.id === item.id ? { ...i, status: 'failed' as const, error: ts('insufficientCredits') } : i
            ));
            const remainingIds = pending.filter(p => p.id !== item.id && batchItems.find(b => b.id === p.id)?.status === 'processing').map(p => p.id);
            if (remainingIds.length > 0) {
              setBatchItems(prev => prev.map(i =>
                remainingIds.includes(i.id) ? { ...i, status: 'pending' as const } : i
              ));
            }
            setError(ts('outOfCredits', { failedCount }));
            break;
          }
          throw new Error(data.error || ts('processingFailed'));
        }

        setBatchItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, output: data.output, status: 'completed' as const } : i
        ));
      } catch (err) {
        failedCount++;
        setBatchItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'failed' as const, error: err instanceof Error ? err.message : ts('failed') } : i
        ));
      }
    }

    if (failedCount > 0 && !error) {
      setError(ts('batchSomeFailed', { failedCount, total: pending.length }));
    }
    setIsProcessing(false);
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `zestio_${selectedTool || 'result'}.png`;
    a.click();
  };

  const downloadBatchResults = async () => {
    const completed = batchItems.filter(i => i.status === 'completed' && i.output);
    for (const item of completed) {
      try {
        const response = await fetch(item.output!);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zestio_batch_${item.id}.png`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch {
        window.open(item.output!, '_blank');
      }
    }
  };

  const resetAll = () => {
    if (batchMode) {
      setBatchItems([]);
    } else {
      setImage(null);
      setResult(null);
    }
    setSelectedTool(null);
    setError(null);
    setSelectedBatchItem(null);
  };

  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setBatchItems([]);
    setImage(null);
    setResult(null);
    setError(null);
    setSelectedBatchItem(null);
  };

  const filteredTools = tools.filter(t => t.tab === activeTab);
  const showStylePicker = activeTab === 'stage' || activeTab === 'renovate';

  // Batch stats
  const batchCompleted = batchItems.filter(i => i.status === 'completed').length;
  const batchFailed = batchItems.filter(i => i.status === 'failed').length;
  const batchTotal = batchItems.length;
  const batchPending = batchTotal - batchCompleted - batchFailed;
  const allBatchDone = batchTotal > 0 && batchPending === 0;

  const activeBatchItem = selectedBatchItem
    ? batchItems.find(i => i.id === selectedBatchItem)
    : batchItems[0];

  return (
    <div className={`flex h-full ${className}`}>
      {/* ── Left: Image Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mode toggle */}
        <div className="flex items-center gap-2 pb-3">
          <button
            onClick={() => !batchMode || toggleBatchMode()}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !batchMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {ts('singleImage')}
          </button>
          <button
            onClick={() => batchMode || toggleBatchMode()}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              batchMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {ts('batch')} ({batchTotal})
          </button>
          {!batchMode && history.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)} className="ml-auto px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              {ts('history')} ({history.length})
            </button>
          )}
        </div>

        {/* Image Preview */}
        <div
          className={`flex-1 relative rounded-xl overflow-hidden ${
            dragOver ? 'ring-2 ring-indigo-500' : ''
          } ${!batchMode && !image ? 'bg-slate-100' : batchMode && batchItems.length === 0 ? 'bg-slate-100' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {batchMode ? (
            batchItems.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-5xl text-slate-300">collections</span>
                <p className="text-slate-400 text-sm">{ts('dropMultiple')}</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  {ts('browseFiles')}
                </button>
              </div>
            ) : activeBatchItem?.output && activeBatchItem.input ? (
              <BeforeAfterSlider before={activeBatchItem.input} after={activeBatchItem.output} beforeLabel={ts('before')} afterLabel={ts('after')} />
            ) : activeBatchItem?.input ? (
              <div className="relative w-full h-full">
                <img src={activeBatchItem.input} alt="Preview" className="w-full h-full object-contain" />
                {activeBatchItem.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                {activeBatchItem.status === 'failed' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium">{ts('failed')}</span>
                  </div>
                )}
              </div>
            ) : null
          ) : (
            result && image ? (
              <BeforeAfterSlider before={image} after={result} beforeLabel={ts('before')} afterLabel={ts('after')} />
            ) : image ? (
              <img src={image} alt="Uploaded" className="w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-5xl text-slate-300">add_photo_alternate</span>
                <p className="text-slate-400 text-sm">{ts('dropImage')}</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  {ts('browseFiles')}
                </button>
              </div>
            )
          )}
          {(!batchMode && !image) && (
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple={batchMode}
              onChange={e => e.target.files && (batchMode ? handleMultipleFiles(e.target.files) : e.target.files[0] && handleFile(e.target.files[0]))}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          )}
        </div>

        {/* Batch thumbnails strip */}
        {batchMode && batchItems.length > 0 && (
          <div className="flex gap-2 py-3 overflow-x-auto">
            {batchItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedBatchItem(item.id)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedBatchItem === item.id ? 'border-indigo-500 shadow-md' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <img src={item.output || item.input} alt="" className="w-full h-full object-cover" />
                {item.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                {item.status === 'completed' && (
                  <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white" />
                )}
                {item.status === 'failed' && (
                  <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border border-white" />
                )}
              </button>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-indigo-400 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-400 text-xl">add</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={e => e.target.files && handleMultipleFiles(e.target.files)}
              className="hidden"
            />
          </div>
        )}

        {/* Bottom bar — single mode */}
        {!batchMode && (image || result) && (
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-2">
              {image && (
                <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  {ts('newImage')}
                </button>
              )}
            </div>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setResult(null); }}
                  className="px-3 py-1.5 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {ts('editAgain')}
                </button>
                <button
                  onClick={downloadResult}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  {ts('download')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Batch progress bar */}
        {batchMode && batchTotal > 0 && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(batchCompleted / batchTotal) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              {ts('batchDone', { completed: batchCompleted, total: batchTotal })}
              {batchFailed > 0 && ts('batchFailed', { failed: batchFailed })}
            </span>
            {allBatchDone && batchCompleted > 0 && (
              <button
                onClick={downloadBatchResults}
                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">download</span>
                {ts('downloadAll')}
              </button>
            )}
          </div>
        )}

        {/* History panel — single mode */}
        {!batchMode && showHistory && history.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{ts('recentEdits')}</span>
              <button onClick={() => { setHistory([]); setShowHistory(false); }} className="text-xs text-slate-400 hover:text-red-500">{ts('clear')}</button>
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
              {ts(tab.labelKey)}
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
                <span className="text-[11px] font-medium leading-tight text-center">{ts(tool.labelKey)}</span>
              </button>
            ))}
          </div>

          {/* Style Picker */}
          {showStylePicker && (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-2 block">{ts('style')}</label>
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
                    {ts(s.labelKey)}
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

        {/* Generate Button */}
        <div className="p-4 border-t border-slate-200">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3 flex justify-between items-center">
              {error}
              <button onClick={() => setError(null)} className="font-bold">×</button>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={
              (!batchMode && (!image || !selectedTool)) ||
              (batchMode && (batchItems.length === 0 || !selectedTool)) ||
              isProcessing ||
              (!batchMode ? false : batchItems.filter(i => i.status === 'pending').length === 0)
            }
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {batchMode
                  ? ts('processingBatch', { current: batchCompleted + 1, total: batchTotal })
                  : ts('processing')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                {batchMode
                  ? ts('processImages', { count: batchItems.filter(i => i.status === 'pending').length })
                  : ts('generate')}
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
