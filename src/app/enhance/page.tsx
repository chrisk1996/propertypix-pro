'use client';
import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout';

type EnhancementTool = 'auto-lighting' | 'denoise' | 'sky-replacement' | null;
type StagingRoom = 'living-room' | 'bedroom' | 'dining' | 'home-office' | null;

const enhancementTools = [
  { id: 'auto-lighting' as const, icon: 'light_mode', label: 'Auto-Lighting', description: 'Perfect exposure balance' },
  { id: 'denoise' as const, icon: 'grain', label: 'Denoise & Sharp', description: 'Crystal clear detail' },
  { id: 'sky-replacement' as const, icon: 'wb_twilight', label: 'Sky Replacement', description: 'Dramatic sky transforms' },
];

const stagingRooms = [
  { id: 'living-room' as const, icon: 'weekend', label: 'Living Room' },
  { id: 'bedroom' as const, icon: 'bed', label: 'Bedroom' },
  { id: 'dining' as const, icon: 'table_restaurant', label: 'Dining' },
  { id: 'home-office' as const, icon: 'desk', label: 'Home Office' },
];

// Real furniture catalog with images
const furnitureCatalog = [
  {
    id: '1',
    name: 'Modern Sectional Sofa',
    category: 'Seating',
    image: 'https://images.unsplash.com/photo-1555041469-a58646868261?w=400&q=80',
    price: '$2,499',
    style: 'Contemporary'
  },
  {
    id: '2',
    name: 'Velvet Accent Chair',
    category: 'Seating',
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&q=80',
    price: '$899',
    style: 'Modern'
  },
  {
    id: '3',
    name: 'Marble Coffee Table',
    category: 'Tables',
    image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c07a3?w=400&q=80',
    price: '$1,299',
    style: 'Luxury'
  },
  {
    id: '4',
    name: 'Arc Floor Lamp',
    category: 'Lighting',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
    price: '$449',
    style: 'Modern'
  },
  {
    id: '5',
    name: 'Fiddle Leaf Fig',
    category: 'Plants',
    image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2e?w=400&q=80',
    price: '$149',
    style: 'Natural'
  },
  {
    id: '6',
    name: 'Mid-Century Bookshelf',
    category: 'Storage',
    image: 'https://images.unsplash.com/photo-1594620302200-9a2a3a79b4b3?w=400&q=80',
    price: '$799',
    style: 'Mid-Century'
  },
  {
    id: '7',
    name: 'Minimalist Bed Frame',
    category: 'Bedroom',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80',
    price: '$1,899',
    style: 'Minimalist'
  },
  {
    id: '8',
    name: 'Dining Table Set',
    category: 'Dining',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247160?w=400&q=80',
    price: '$2,199',
    style: 'Modern'
  },
  {
    id: '9',
    name: 'Executive Desk',
    category: 'Office',
    image: 'https://images.unsplash.com/photo-1518455029359-142d6c4e2892?w=400&q=80',
    price: '$1,499',
    style: 'Professional'
  },
  {
    id: '10',
    name: 'Abstract Wall Art',
    category: 'Decor',
    image: 'https://images.unsplash.com/photo-1541961017774-ee5879e76c3b?w=400&q=80',
    price: '$349',
    style: 'Contemporary'
  },
  {
    id: '11',
    name: 'Area Rug - Geometric',
    category: 'Textiles',
    image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&q=80',
    price: '$599',
    style: 'Bohemian'
  },
  {
    id: '12',
    name: 'Pendant Light Trio',
    category: 'Lighting',
    image: 'https://images.unsplash.com/photo-1524484485831-a92cd025f1d8?w=400&q=80',
    price: '$699',
    style: 'Industrial'
  },
];

export default function EnhancePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<EnhancementTool>(null);
  const [selectedRoom, setSelectedRoom] = useState<StagingRoom>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = () => {
    if (!uploadedImage || !selectedTool) return;
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  const filteredFurniture = furnitureCatalog.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(furnitureCatalog.map(item => item.category))];

  return (
    <AppLayout title="Image Enhancer">
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Left Sidebar - AI Enhancement Tools */}
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-1">AI Enhancement</h3>
            <p className="text-slate-500 text-xs mb-4">Studio-grade image processing</p>
            <div className="space-y-2">
              {enhancementTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  disabled={!uploadedImage || isProcessing}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    selectedTool === tool.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="material-symbols-outlined">{tool.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{tool.label}</div>
                    <div className="text-xs opacity-75">{tool.description}</div>
                  </div>
                </button>
              ))}
            </div>
            {selectedTool && uploadedImage && (
              <button
                onClick={handleEnhance}
                disabled={isProcessing}
                className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Apply Enhancement'}
              </button>
            )}
          </div>

          {/* Virtual Staging Section */}
          <div className="p-6 border-t border-slate-200">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-1">Virtual Staging</h3>
            <p className="text-slate-500 text-xs mb-4">AI furniture placement</p>
            <div className="grid grid-cols-2 gap-2">
              {stagingRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  disabled={!uploadedImage}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    selectedRoom === room.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="material-symbols-outlined">{room.icon}</span>
                  <span className="text-xs font-semibold">{room.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Photo Canvas */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-8">
          {!uploadedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-3xl aspect-[4/3] bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
            >
              <span className="material-symbols-outlined text-6xl text-slate-400">add_photo_alternate</span>
              <div className="text-center">
                <p className="font-semibold text-slate-700 text-lg">Drop your image here</p>
                <p className="text-sm text-slate-500">or click to browse</p>
              </div>
              <p className="text-xs text-slate-400 mt-2">Supports JPG, PNG, WebP up to 20MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative w-full max-w-4xl">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="w-full rounded-2xl shadow-2xl"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="bg-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-slate-700">Processing...</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-slate-600">close</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Furniture Catalog */}
        <div className="w-96 shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-lg mb-1">Furniture Catalog</h3>
            <p className="text-slate-500 text-xs mb-4">Click to add to your scene</p>
            
            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !selectedCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Furniture Grid - Larger cards with images */}
            <div className="grid grid-cols-2 gap-4">
              {filteredFurniture.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
                >
                  {/* Furniture Image */}
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                  {/* Item Info */}
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

          {/* Scene Layers */}
          <div className="p-6 border-t border-slate-200">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-4">Scene Objects</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="material-symbols-outlined text-sm text-blue-600">visibility</span>
                <span className="text-sm font-medium flex-1">Original Photo</span>
                <span className="material-symbols-outlined text-sm text-slate-400">lock</span>
              </div>
              {uploadedImage && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="material-symbols-outlined text-sm text-blue-600">visibility</span>
                  <span className="text-sm font-medium flex-1">Enhancement Layer</span>
                  <span className="material-symbols-outlined text-sm text-slate-400 cursor-pointer hover:text-slate-600">more_vert</span>
                </div>
              )}
            </div>
          </div>

          {/* Smart Layout Generator */}
          <div className="p-6 border-t border-slate-200">
            <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">auto_awesome_motion</span>
              Smart Layout Generator
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">AI suggests optimal furniture arrangements</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
