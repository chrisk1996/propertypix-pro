'use client';

import { useState } from 'react';
import { Check, Loader2, Building, Bed, Bath, Home, Calendar, Download, FileText } from 'lucide-react';
import type { ListingData } from '../ListingWizard';

interface ReviewStepProps {
  data: ListingData;
  updateData: (data: Partial<ListingData>) => void;
  onPrev: () => void;
}

const PORTALS = [
  { id: 'is24', name: 'ImmobilienScout24', logo: '🏠' },
  { id: 'immowelt', name: 'ImmoWelt', logo: '🏘️' },
  { id: 'immobilo', name: 'Immobilo', logo: '🏢' },
];

export function ReviewStep({ data, updateData, onPrev }: ReviewStepProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'draft' | 'published'>('idle');
  const [portalsSynced, setPortalsSynced] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const formatPrice = () => {
    if (data.transaction_type === 'rent') {
      const warmRent = data.warm_rent || data.cold_rent || 0;
      return `€${warmRent.toLocaleString()}/month`;
    }
    return `€${data.price.toLocaleString()}`;
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStatus('publishing');

    // Simulate portal sync
    for (const portal of PORTALS) {
      await new Promise((r) => setTimeout(r, 500));
      setPortalsSynced((prev) => [...prev, portal.id]);
    }

    setPublishStatus('published');
    setIsPublishing(false);
  };

  const handleSaveDraft = async () => {
    setIsPublishing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setPublishStatus('draft');
    setIsPublishing(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      setIsExporting(false);
      return;
    }

    const features = Object.entries(data.features || {})
      .filter(([, v]) => v)
      .map(([k]) => k.replace(/_/g, ' '))
      .map(f => f.charAt(0).toUpperCase() + f.slice(1));

    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expose - ${data.title || 'Immobilie'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px;
      color: #1d2832;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #006c4d;
      padding-bottom: 30px;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      font-style: italic;
      color: #006c4d;
      margin-bottom: 10px;
    }
    .title {
      font-size: 32px;
      font-weight: 300;
      margin-bottom: 10px;
    }
    .price {
      font-size: 36px;
      font-weight: bold;
      color: #006c4d;
      margin: 20px 0;
    }
    .location {
      font-size: 18px;
      color: #666;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #006c4d;
      margin-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 10px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .stat-box {
      background: #f7f9f7;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #1d2832;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .feature {
      background: #f0f7f4;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
    }
    .description {
      line-height: 1.8;
      color: #43474c;
    }
    .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Property-Pix</div>
    <h1 class="title">${data.title || 'Exposé'}</h1>
    <div class="price">${formatPrice()}</div>
    <div class="location">📍 ${data.street || ''} ${data.house_number || ''}, ${data.postal_code || ''} ${data.city || 'Draft'}</div>
  </div>

  <div class="section">
    <div class="section-title">Immobilien Details</div>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${data.rooms || '-'}</div>
        <div class="stat-label">Zimmer</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.living_area || '-'} m²</div>
        <div class="stat-label">Wohnfläche</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.bedrooms || '-'}</div>
        <div class="stat-label">Schlafzimmer</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.bathrooms || '-'}</div>
        <div class="stat-label">Badezimmer</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.construction_year || '-'}</div>
        <div class="stat-label">Baujahr</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.energy_rating || '-'}</div>
        <div class="stat-label">Energieklasse</div>
      </div>
    </div>
  </div>

  ${features.length > 0 ? `
  <div class="section">
    <div class="section-title">Ausstattung</div>
    <div class="features">
      ${features.map(f => `<span class="feature">${f}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${data.description ? `
  <div class="section">
    <div class="section-title">Beschreibung</div>
    <p class="description">${data.description}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Erstellt mit Property-Pix Pro | ${new Date().toLocaleDateString('de-DE')}</p>
    <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 12px 24px; background: #006c4d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
      Als PDF speichern
    </button>
  </div>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    setIsExporting(false);
  };

  const renderFeatures = () => {
    const activeFeatures = Object.entries(data.features)
      .filter(([, v]) => v)
      .map(([k]) => k);
    return activeFeatures;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-semibold text-gray-900">Review & Publish</h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Portal Sync
          </span>
        </div>
        <p className="text-gray-600">
          Preview your listing and sync to connected portals with one click.
        </p>
      </div>

      {/* Listing Preview Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Preview Header */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {data.title || 'Untitled Listing'}
          </h3>
          <p className="text-gray-600">
            📍 {data.street} {data.house_number}, {data.postal_code} {data.city}
          </p>
        </div>

        {/* Preview Body */}
        <div className="p-6">
          {/* Price Badge */}
          <div className="mb-4">
            <span className="text-2xl font-bold text-indigo-600">{formatPrice()}</span>
            {data.transaction_type === 'rent' && data.cold_rent && data.additional_costs && (
              <span className="ml-2 text-sm text-gray-500">
                (Kaltmiete: €{data.cold_rent.toLocaleString()})
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Home className="w-4 h-4" />
              <span>{data.rooms} rooms</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Bed className="w-4 h-4" />
              <span>{data.bedrooms || '-'} beds</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Bath className="w-4 h-4" />
              <span>{data.bathrooms || '-'} baths</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Building className="w-4 h-4" />
              <span>{data.living_area} m²</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Built {data.construction_year || '-'}</span>
            </div>
          </div>

          {/* Features */}
          {renderFeatures().length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {renderFeatures().slice(0, 6).map((feature) => (
                <span
                  key={feature}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm capitalize"
                >
                  {feature.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Description Preview */}
          <div className="text-gray-600 text-sm line-clamp-3">
            {data.description || 'No description generated yet.'}
          </div>
        </div>
      </div>

      {/* Portal Sync Status */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Portal Sync</h3>
        <div className="flex flex-wrap gap-3">
          {PORTALS.map((portal) => (
            <div
              key={portal.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
                portalsSynced.includes(portal.id)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {portalsSynced.includes(portal.id) ? (
                <Check className="w-4 h-4" />
              ) : (
                <span>{portal.logo}</span>
              )}
              {portal.name}
            </div>
          ))}
          {publishStatus === 'draft' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-gray-300 text-gray-600">
              ○ Saved as Draft
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {publishStatus === 'published' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-600 font-medium mb-1">🎉 Listing Published!</div>
            <p className="text-sm text-green-600">Synced to all connected portals.</p>
          </div>
        ) : (
          <>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isPublishing && publishStatus === 'publishing' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Syncing to portals...
                </span>
              ) : (
                'Publish to All Portals'
              )}
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={isPublishing}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {isPublishing && publishStatus === 'draft' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save as Draft'
              )}
            </button>
          </>
        )}

        {/* Export Expose Button */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Exposé...
            </span>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Export as Exposé (PDF)
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-start pt-4 border-t border-gray-100">
        <button
          onClick={onPrev}
          disabled={publishStatus === 'published'}
          className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
