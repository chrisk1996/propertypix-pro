'use client';

import { useState } from 'react';
import { Check, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

interface Step7PublishProps {
  data: {
    transaction_type: string;
    property_type: string;
    title: string;
    city: string;
    price?: number;
    media_ids: string[];
  };
  onPublish: () => void;
  onBack: () => void;
}

const availablePortals = [
  { id: 'openimmo', name: 'Immowelt/Immonet', icon: '🏠', requiresOauth: false },
  { id: 'immoscout24', name: 'ImmoScout24', icon: '🔍', requiresOauth: true },
  { id: 'homegate', name: 'Homegate', icon: '🏡', requiresOauth: true },
  { id: 'willhaben', name: 'willhaben', icon: '📱', requiresOauth: true },
];

export function Step7Publish({ data, onPublish, onBack }: Step7PublishProps) {
  const [selectedPortals, setSelectedPortals] = useState<string[]>(['openimmo']);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const togglePortal = (portalId: string) => {
    setSelectedPortals(prev =>
      prev.includes(portalId)
        ? prev.filter(id => id !== portalId)
        : [...prev, portalId]
    );
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
    } finally {
      setIsPublishing(false);
      setShowConfirm(false);
    }
  };

  const formatPrice = (cents?: number) => {
    if (!cents) return 'Price on request';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Review & Publish</h2>
        <p className="text-gray-600 mb-6">
          Review your listing and select where to publish it.
        </p>
      </div>

      {/* Listing Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Listing Summary</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="ml-2 font-medium capitalize">
              {data.transaction_type === 'sale' ? 'For Sale' : 'For Rent'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Property:</span>
            <span className="ml-2 font-medium capitalize">{data.property_type}</span>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>
            <span className="ml-2 font-medium">{data.city}</span>
          </div>
          <div>
            <span className="text-gray-500">Price:</span>
            <span className="ml-2 font-medium">{formatPrice(data.price)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Title:</span>
            <span className="ml-2 font-medium">{data.title || 'Not set'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Media:</span>
            <span className="ml-2 font-medium">{data.media_ids.length} items</span>
          </div>
        </div>

        {data.media_ids.length === 0 && (
          <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>No media added. Consider adding photos for better visibility.</span>
          </div>
        )}
      </div>

      {/* Portal Selection */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Select Portals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availablePortals.map((portal) => (
            <button
              key={portal.id}
              onClick={() => togglePortal(portal.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selectedPortals.includes(portal.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <span className="text-2xl">{portal.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">{portal.name}</div>
                {portal.requiresOauth && (
                  <div className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Requires connection
                  </div>
                )}
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedPortals.includes(portal.id)
                    ? 'bg-indigo-500 text-white'
                    : 'border-2 border-gray-300'
                }`}
              >
                {selectedPortals.includes(portal.id) && <Check className="w-4 h-4" />}
              </div>
            </button>
          ))}
        </div>

        {selectedPortals.includes('openimmo') && (
          <p className="mt-4 text-sm text-gray-500">
            ✓ OpenImmo feed will publish to Immowelt, Immonet, and ImmoStreet automatically.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          disabled={isPublishing}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={selectedPortals.length === 0 || isPublishing}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Publishing...
            </>
          ) : (
            'Publish Listing'
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Publication
            </h3>
            <p className="text-gray-600 mb-6">
              You're about to publish this listing to{' '}
              <strong>{selectedPortals.length} portal(s)</strong>. This action will make
              your listing publicly visible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Confirm & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
