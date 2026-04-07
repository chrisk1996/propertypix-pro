'use client';

import { useCallback, useEffect, useState } from 'react';
import { Upload, GripVertical, Star, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  thumbnail_url?: string;
  original_url?: string;
  type: 'image' | 'video' | '3d';
  subtype?: string;
  filename?: string;
  created_at: string;
  completed_at?: string;
}

interface Step6MediaProps {
  data: {
    media_ids: string[];
    cover_image_id?: string;
  };
  onChange: (data: Partial<Step6MediaProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step6Media({ data, onChange, onNext, onBack }: Step6MediaProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load user's PropertyPix assets on mount
  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/media');
      if (!response.ok) {
        throw new Error('Failed to load media');
      }

      const data = await response.json();
      setMediaItems(data.media || []);
    } catch (err) {
      console.error('Error loading media:', err);
      setError('Failed to load your PropertyPix assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Handle file drop - could integrate with upload flow
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileUpload = async (files: FileList | File[]) => {
    // This would integrate with the existing upload flow
    // For now, show an alert that upload needs to be done through enhance page
    // In a full implementation, this would upload to Supabase storage and create a job
    
    setUploading(true);
    try {
      // In production, this would:
      // 1. Upload files to Supabase storage
      // 2. Create enhancement jobs
      // 3. Poll for completion
      // For now, redirect to enhance page
      alert('Please use the Enhance page to upload and enhance photos first, then they will appear in your PropertyPix assets.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFileUpload(files);
      }
    };
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

  const handleToggleSelect = (mediaId: string) => {
    if (data.media_ids.includes(mediaId)) {
      // Already selected, remove it
      handleRemove(mediaId);
    } else {
      // Add to selection
      onChange({ media_ids: [...data.media_ids, mediaId] });
    }
  };

  // Get the actual media item data for selected IDs
  const selectedMediaItems = data.media_ids
    .map(id => mediaItems.find(m => m.id === id))
    .filter(Boolean) as MediaItem[];

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
        onClick={!uploading ? handleUpload : undefined}
        className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-all ${
          uploading
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50'
        }`}
      >
        <input type="file" accept="image/*" multiple className="hidden" />
        <div className="w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-indigo-600" />
          )}
        </div>
        <p className="text-gray-700 font-medium mb-1">
          {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
        </p>
        <p className="text-sm text-gray-500">JPG, PNG, WebP up to 10MB each</p>
      </div>

      {/* Existing PropertyPix Assets */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Your PropertyPix Assets</h3>
        <p className="text-sm text-gray-500 mb-4">
          Click to add enhanced photos, videos, or 3D models from your PropertyPix library.
        </p>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
            <button
              onClick={loadMedia}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && mediaItems.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No PropertyPix assets yet</p>
            <p className="text-sm text-gray-500">
              Enhance some photos first, then they'll appear here for selection.
            </p>
          </div>
        )}

        {/* Media Grid */}
        {!loading && !error && mediaItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mediaItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleToggleSelect(item.id)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                  data.media_ids.includes(item.id)
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                {item.url ? (
                  <img
                    src={item.url}
                    alt={item.filename || 'Enhanced photo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                {/* Subtype Badge */}
                {item.subtype && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                    {item.subtype === 'auto' ? 'Enhanced' :
                     item.subtype === 'sky' ? 'Sky' :
                     item.subtype === 'staging' ? 'Staged' :
                     item.subtype === 'object_removal' ? 'Cleaned' : item.subtype}
                  </span>
                )}

                {/* Selected Checkmark */}
                {data.media_ids.includes(item.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Media */}
      {data.media_ids.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">
            Selected Media ({data.media_ids.length})
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Drag to reorder. Click the star to set cover photo.
          </p>

          {/* Warning if selected media not found */}
          {selectedMediaItems.length < data.media_ids.length && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-700">
              Some selected media could not be loaded. They may have been deleted.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedMediaItems.map((item, index) => (
              <div
                key={item.id}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 ${
                  data.cover_image_id === item.id || (!data.cover_image_id && index === 0)
                    ? 'border-indigo-500'
                    : 'border-gray-200'
                }`}
              >
                {item.url ? (
                  <img
                    src={item.url}
                    alt={item.filename || 'Selected photo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                {/* Drag Handle */}
                <div className="absolute top-2 left-2 p-1 bg-white/80 rounded cursor-grab">
                  <GripVertical className="w-4 h-4 text-gray-600" />
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetCover(item.id);
                    }}
                    className={`p-1 rounded ${
                      data.cover_image_id === item.id || (!data.cover_image_id && index === 0)
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-indigo-500 hover:text-white'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="p-1 bg-white/80 rounded text-gray-600 hover:bg-red-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cover Badge */}
                {(data.cover_image_id === item.id || (!data.cover_image_id && index === 0)) && (
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
