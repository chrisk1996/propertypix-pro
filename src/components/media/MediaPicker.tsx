'use client';

import { useState, useEffect } from 'react';
import { Image, Sparkles, Sofa, Video, Loader2, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface LibraryItem {
  id: string;
  output_url: string | null;
  input_url: string;
  job_type: string;
  status: string;
  created_at: string;
}

interface MediaPickerProps {
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
  onClose: () => void;
}

export function MediaPicker({ onSelect, multiple = true, onClose }: MediaPickerProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'enhance' | 'staging'>('all');
  
  const supabase = createClient();

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('zestio_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .in('job_type', ['auto', 'sky', 'staging', 'object_removal'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (url: string) => {
    if (multiple) {
      setSelected(prev => 
        prev.includes(url) 
          ? prev.filter(u => u !== url)
          : [...prev, url]
      );
    } else {
      setSelected([url]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'enhance') return ['auto', 'sky', 'object_removal'].includes(item.job_type);
    if (filter === 'staging') return item.job_type === 'staging';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select from Library</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selected.length} image{selected.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'all', label: 'All' },
              { id: 'enhance', label: 'Enhanced', icon: <Sparkles className="w-3 h-3" /> },
              { id: 'staging', label: 'Staged', icon: <Sofa className="w-3 h-3" /> },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No images in your library yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Enhance or stage some photos first
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map(item => {
                const url = item.output_url || item.input_url;
                const isSelected = selected.includes(url);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSelect(url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-600/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Selection Check */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        item.job_type === 'staging'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.job_type === 'staging' ? (
                          <><Sofa className="w-3 h-3" /> Staged</>
                        ) : (
                          <><Sparkles className="w-3 h-3" /> Enhanced</>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add {selected.length} Image{selected.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
