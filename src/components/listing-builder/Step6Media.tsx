'use client';

import { useCallback } from 'react';
import { Upload, GripVertical, Star, X, Image as ImageIcon } from 'lucide-react';

interface Step6MediaProps {
  data: {
    media_ids: string[];
    cover_image_id?: string;
  };
  onChange: (data: Partial<Step6MediaProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Mock media items - in real app, fetch from API
const mockMediaItems = [
  { id: '1', url: '/sample-property-1.jpg', type: 'image' },
  { id: '2', url: '/sample-property-2.jpg', type: 'image' },
  { id: '3', url: '/sample-property-3.jpg', type: 'image' },
];

export function Step6Media({ data, onChange, onNext, onBack }: Step6MediaProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Handle file drop
  }, []);

  const handleUpload = () => {
    // Open file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.click();
  };

  const handleSetCover = (mediaId: string) => {
    onChange({ cover_image_id: mediaId });
  };

  const handleRemove = (mediaId: string) => {
    const newMediaIds = data.media_ids.filter(id => id !== mediaId);
    onChange({ 
      media_ids: newMediaIds,
      cover_image_id: data.cover_image_id === mediaId ? undefined : data.cover_image_id
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Media</h2>
        <p className="text-gray-600 mb-6">
          Add photos and videos to showcase your property. The first image will be used as the cover photo.
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUpload}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
      >
        <input type="file" accept="image/*" multiple className="hidden" />
        <div className="w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Upload className="w-6 h-6 text-indigo-600" />
        </div>
        <p className="text-gray-700 font-medium mb-1">Drop images here or click to upload</p>
        <p className="text-sm text-gray-500">JPG, PNG, WebP up to 10MB each</p>
      </div>

      {/* Existing PropertyPix Assets */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Your PropertyPix Assets</h3>
        <p className="text-sm text-gray-500 mb-4">
          Click to add enhanced photos, videos, or 3D models from your PropertyPix library.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockMediaItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (!data.media_ids.includes(item.id)) {
                  onChange({ media_ids: [...data.media_ids, item.id] });
                }
              }}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                data.media_ids.includes(item.id)
                  ? 'border-indigo-500 opacity-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Media */}
      {data.media_ids.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Selected Media ({data.media_ids.length})</h3>
          <p className="text-sm text-gray-500 mb-4">
            Drag to reorder. Click the star to set cover photo.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.media_ids.map((mediaId, index) => (
              <div
                key={mediaId}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 ${
                  data.cover_image_id === mediaId || (!data.cover_image_id && index === 0)
                    ? 'border-indigo-500'
                    : 'border-gray-200'
                }`}
              >
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 p-1 bg-white/80 rounded cursor-grab">
                  <GripVertical className="w-4 h-4 text-gray-600" />
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetCover(mediaId);
                    }}
                    className={`p-1 rounded ${
                      data.cover_image_id === mediaId || (!data.cover_image_id && index === 0)
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-indigo-500 hover:text-white'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(mediaId);
                    }}
                    className="p-1 bg-white/80 rounded text-gray-600 hover:bg-red-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cover Badge */}
                {(data.cover_image_id === mediaId || (!data.cover_image_id && index === 0)) && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-indigo-500 text-white text-xs rounded">
                    Cover
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Next: Review & Publish
        </button>
      </div>
    </div>
  );
}
