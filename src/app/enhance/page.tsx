'use client';
import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import AIModelSelector, { type AIModel } from '@/components/AIModelSelector';

type EnhancementTool = 'auto-lighting' | 'denoise' | 'sky-replacement' | null;
type StagingRoom = 'living-room' | 'bedroom' | 'dining' | 'home-office' | null;

const enhancementTools = [
  { id: 'auto-lighting' as const, icon: 'light_mode', label: 'Auto-Lighting', description: 'Perfect exposure balance' },
  { id: 'denoise' as const, icon: 'grain', label: 'Denoise & Sharp', description: 'Crystal clear detail' },
  { id: 'sky-replacement' as const, icon: 'wb_twilight', label: 'Sky Replacement', description: 'Dramatic sky transforms' },
];

const stagingRooms = [
  { id: 'living-room' as const, icon: 'weekend', label: 'Living Room', value: 'living' },
  { id: 'bedroom' as const, icon: 'bed', label: 'Bedroom', value: 'bedroom' },
  { id: 'dining' as const, icon: 'table_restaurant', label: 'Dining', value: 'dining' },
  { id: 'home-office' as const, icon: 'desk', label: 'Home Office', value: 'office' },
];

const furnitureStyles = [
  { id: 'modern', label: 'Modern' },
  { id: 'scandinavian', label: 'Scandinavian' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'minimalist', label: 'Minimalist' },
];

const furnitureCatalog = [
  { id: '1', name: 'Modern Sectional Sofa', category: 'Seating', image: 'https://images.unsplash.com/photo-1555041469-a58646868261?w=400&q=80', price: '$2,499', style: 'Contemporary' },
  { id: '2', name: 'Velvet Accent Chair', category: 'Seating', image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&q=80', price: '$899', style: 'Modern' },
  { id: '3', name: 'Marble Coffee Table', category: 'Tables', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c07a3?w=400&q=80', price: '$1,299', style: 'Luxury' },
  { id: '4', name: 'Arc Floor Lamp', category: 'Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80', price: '$449', style: 'Modern' },
  { id: '5', name: 'Fiddle Leaf Fig', category: 'Plants', image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2e?w=400&q=80', price: '$149', style: 'Natural' },
  { id: '6', name: 'Mid-Century Bookshelf', category: 'Storage', image: 'https://images.unsplash.com/photo-1594620302200-9a2a3a79b4b3?w=400&q=80', price: '$799', style: 'Mid-Century' },
];

function ImageCompareSlider({ beforeSrc, afterSrc }: { beforeSrc: string; afterSrc: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none"
      onMouseDown={() => { isDragging.current = true; }} onMouseUp={() => { isDragging.current = false; }} onMouseLeave={() => { isDragging.current = false; }} onMouseMove={(e) => handleMove(e.clientX)}
      onTouchStart={() => { isDragging.current = true; }} onTouchEnd={() => { isDragging.current = false; }} onTouchMove={(e) => handleMove(e.touches[0].clientX)}>
      <img src={afterSrc} alt="Enhanced" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={beforeSrc} alt="Original" className="absolute inset-0 h-full object-cover" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} />
      </div>
      <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-600 text-xl">compare_arrows</span>
        </div>
      </div>
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-lg">Before</div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-lg">After</div>
    </div>
  );
}

export default function EnhancePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<EnhancementTool>(null);
  const [selectedRoom, setSelectedRoom] = useState<StagingRoom>(null);
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedEnhanceModel, setSelectedEnhanceModel] = useState<AIModel>('auto');
  const [selectedStagingModel, setSelectedStagingModel] = useState<AIModel>('decor8');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { setUploadedImage(event.target?.result as string); setEnhancedImage(null); setError(null); };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!uploadedImage || !selectedTool) return;
    setIsProcessing(true); setError(null);
    try {
      const response = await fetch('/api/enhance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: uploadedImage, enhancementType: selectedTool === 'sky-replacement' ? 'sky' : 'auto', model: selectedEnhanceModel }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Enhancement failed');
      setEnhancedImage(data.output);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to enhance image'); } finally { setIsProcessing(false); }
  };

  const handleStaging = async () => {
    if (!uploadedImage || !selectedRoom) return;
    setIsProcessing(true); setError(null);
    const room = stagingRooms.find(r => r.id === selectedRoom);
    try {
      const response = await fetch('/api/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: uploadedImage, roomType: room?.value, furnitureStyle: selectedStyle, model: selectedStagingModel }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Staging failed');
      setEnhancedImage(data.output);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to stage room'); } finally { setIsProcessing(false); }
  };

  const categories = Array.from(new Set(furnitureCatalog.map(item => item.category)));

  return (
    <AppLayout title="Image Enhancer">
      <div className="flex h-[calc(100vh-5rem)]">
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-1">AI Enhancement</h3>
            <p className="text-slate-500 text-xs mb-4">Studio-grade image processing</p>
            <div className="space-y-2">
              {enhancementTools.map(tool => (
                <button key={tool.id} onClick={() => setSelectedTool(tool.id)} disabled={!uploadedImage || isProcessing}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedTool === tool.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                  <span className="material-symbols-outlined">{tool.icon}</span>
                  <div className="text-left"><div className="font-semibold text-sm">{tool.label}</div><div className="text-xs opacity-75">{tool.description}</div></div>
                </button>
              ))}
            </div>
            {selectedTool && uploadedImage && (
              <button onClick={handleEnhance} disabled={isProcessing} className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {isProcessing ? 'Processing...' : 'Apply Enhancement'}
              </button>
            )}
            {/* AI Model Selector for Enhancement */}
            {selectedTool && uploadedImage && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                <AIModelSelector category="enhance" selected={selectedEnhanceModel} onSelect={setSelectedEnhanceModel} />
              </div>
            )}
          </div>
          <div className="p-6 border-t border-slate-200">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-1">Virtual Staging</h3>
            <p className="text-slate-500 text-xs mb-4">AI furniture placement</p>
            <div className="grid grid-cols-2 gap-2">
              {stagingRooms.map(room => (
                <button key={room.id} onClick={() => setSelectedRoom(room.id)} disabled={!uploadedImage}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${selectedRoom === room.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                  <span className="material-symbols-outlined">{room.icon}</span>
                  <span className="text-xs font-semibold">{room.label}</span>
                </button>
              ))}
            </div>
            {selectedRoom && (
              <div className="mt-4 space-y-2">
                <label className="text-xs font-semibold text-slate-600">Furniture Style</label>
                <div className="flex flex-wrap gap-2">
                  {furnitureStyles.map(style => (
                    <button key={style.id} onClick={() => setSelectedStyle(style.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedStyle === style.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {style.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleStaging} disabled={isProcessing} className="w-full mt-3 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50">
                  {isProcessing ? 'Staging...' : 'Apply Staging (2 credits)'}
                </button>
                {/* AI Model Selector for Staging */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <AIModelSelector category="staging" selected={selectedStagingModel} onSelect={setSelectedStagingModel} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-8">
          {!uploadedImage ? (
            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-2xl bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all py-12">
              <span className="material-symbols-outlined text-5xl text-slate-400">add_photo_alternate</span>
              <div className="text-center"><p className="font-semibold text-slate-700 text-lg">Drop your image here</p><p className="text-sm text-slate-500">or click to browse</p></div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          ) : enhancedImage ? (
            <div className="w-full max-w-4xl">
              <ImageCompareSlider beforeSrc={uploadedImage} afterSrc={enhancedImage} />
              <div className="flex justify-center gap-3 mt-4">
                <button onClick={() => setEnhancedImage(null)} className="px-4 py-2 bg-white rounded-lg text-sm font-semibold text-slate-700 shadow hover:bg-slate-50">Reset</button>
                <button onClick={() => window.open(enhancedImage, '_blank')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-blue-700">Download</button>
                <button onClick={() => { setUploadedImage(null); setEnhancedImage(null); }} className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-300">New Image</button>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-4xl">
              <img src={uploadedImage} alt="Uploaded" className="w-full rounded-2xl shadow-2xl" />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="bg-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-slate-700">Processing...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
                  {error}<button onClick={() => setError(null)} className="font-bold">×</button>
                </div>
              )}
              <button onClick={() => setUploadedImage(null)} className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white">
                <span className="material-symbols-outlined text-slate-600">close</span>
              </button>
            </div>
          )}
        </div>
        <div className={`${isRightPanelOpen ? 'w-96' : 'w-14'} shrink-0 border-l border-slate-200 bg-white transition-all duration-300 overflow-hidden relative`}>
          <button onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 shadow-sm">
            <span className="material-symbols-outlined text-slate-600">{isRightPanelOpen ? 'chevron_right' : 'chevron_left'}</span>
          </button>
          {isRightPanelOpen && (
            <div className="p-6 pt-16 overflow-y-auto h-full">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-lg mb-1">Furniture Catalog</h3>
              <div className="flex flex-wrap gap-2 mb-4 mt-4">
                <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{cat}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {furnitureCatalog.filter(item => !selectedCategory || item.category === selectedCategory).map(item => (
                  <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="aspect-square bg-slate-100"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                    <div className="p-3">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">{item.style}</span>
                        <span className="text-xs font-bold text-blue-600">{item.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
