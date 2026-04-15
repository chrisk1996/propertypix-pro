'use client';
import { useState } from 'react';
import { Check, Loader2, Building, Bed, Bath, Home, Calendar, FileText, Video, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ListingData } from '../ListingWizard';

interface ReviewStepProps {
  data: ListingData;
  updateData: (data: Partial<ListingData>) => void;
  onPrev: () => void;
}

const PORTALS = [
  { id: 'is24', name: 'ImmobilienScout24', logo: '🏠', enabled: false },
  { id: 'immowelt', name: 'ImmoWelt', logo: '🏘️', enabled: false },
  { id: 'immobilo', name: 'Immobilo', logo: '🏢', enabled: false },
];

type PortalSyncStatus = 'idle' | 'syncing' | 'synced' | 'failed' | 'not_configured';
interface PortalState { status: PortalSyncStatus; error?: string; externalId?: string; }

export function ReviewStep({ data, updateData, onPrev }: ReviewStepProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'draft' | 'published'>('idle');
  const [portalStates, setPortalStates] = useState<Record<string, PortalState>>({
    is24: { status: 'not_configured' },
    immowelt: { status: 'not_configured' },
    immobilo: { status: 'not_configured' },
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const formatPrice = () => {
    if (data.transaction_type === 'rent') {
      const warmRent = data.warm_rent || data.cold_rent || 0;
      return `€${warmRent.toLocaleString()}/month`;
    }
    return `€${data.price.toLocaleString()}`;
  };

  const handlePublish = async () => {
    const enabledPortals = PORTALS.filter(p => p.enabled);
    if (enabledPortals.length === 0) { handleSaveDraft(); return; }
    setIsPublishing(true);
    setPublishStatus('publishing');
    try {
      const response = await fetch('/api/listings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: data.id, portals: enabledPortals.map(p => p.id) }),
      });
      const result = await response.json();
      if (result.success) {
        result.results.forEach((r: any) => {
          setPortalStates(prev => ({ ...prev, [r.portal]: { status: r.success ? 'synced' : 'failed', error: r.error, externalId: r.externalId } }));
        });
        setPublishStatus('published');
      }
    } catch (error) {
      console.error('Publish error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsPublishing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setPublishStatus('draft');
    setIsPublishing(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Please allow popups to export PDF'); setIsExporting(false); return; }
    const features = Object.entries(data.features || {}).filter(([, v]) => v).map(([k]) => k.replace(/_/g, ' ')).map(f => f.charAt(0).toUpperCase() + f.slice(1));
    const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Expose - ${data.title || 'Immobilie'}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1d2832}.header{text-align:center;border-bottom:3px solid #006c4d;padding-bottom:30px;margin-bottom:40px}.logo{font-size:28px;font-weight:bold;font-style:italic;color:#006c4d}.title{font-size:32px;font-weight:300;margin:10px 0}.price{font-size:36px;font-weight:bold;color:#006c4d;margin:20px 0}.location{font-size:18px;color:#666}.section{margin-bottom:30px}.section-title{font-size:14px;text-transform:uppercase;letter-spacing:2px;color:#006c4d;margin-bottom:15px;border-bottom:1px solid #e0e0e0;padding-bottom:10px}.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.stat-box{background:#f7f9f7;padding:20px;border-radius:8px;text-align:center}.stat-value{font-size:28px;font-weight:bold;color:#1d2832}.stat-label{font-size:12px;color:#666;margin-top:5px}.features{display:flex;flex-wrap:wrap;gap:10px}.feature{background:#f0f7f4;padding:8px 16px;border-radius:20px;font-size:14px}.description{line-height:1.8;color:#43474c}.footer{margin-top:50px;padding-top:30px;border-top:1px solid #e0e0e0;text-align:center;color:#999;font-size:12px}@media print{body{padding:20px}.no-print{display:none}}</style></head><body><div class="header"><div class="logo">Zestio</div><h1 class="title">${data.title || 'Exposé'}</h1><div class="price">${formatPrice()}</div><div class="location">📍 ${data.street || ''} ${data.house_number || ''}, ${data.postal_code || ''} ${data.city || 'Draft'}</div></div><div class="section"><div class="section-title">Immobilien Details</div><div class="stats-grid"><div class="stat-box"><div class="stat-value">${data.rooms || '-'}</div><div class="stat-label">Zimmer</div></div><div class="stat-box"><div class="stat-value">${data.living_area || '-'} m²</div><div class="stat-label">Wohnfläche</div></div><div class="stat-box"><div class="stat-value">${data.bedrooms || '-'}</div><div class="stat-label">Schlafzimmer</div></div><div class="stat-box"><div class="stat-value">${data.bathrooms || '-'}</div><div class="stat-label">Badezimmer</div></div><div class="stat-box"><div class="stat-value">${data.construction_year || '-'}</div><div class="stat-label">Baujahr</div></div><div class="stat-box"><div class="stat-value">${data.energy_rating || '-'}</div><div class="stat-label">Energieklasse</div></div></div></div>${features.length > 0 ? `<div class="section"><div class="section-title">Ausstattung</div><div class="features">${features.map(f => `<span class="feature">${f}</span>`).join('')}</div></div>` : ''}${data.description ? `<div class="section"><div class="section-title">Beschreibung</div><p class="description">${data.description}</p></div>` : ''}<div class="footer"><p>Erstellt mit Zestio | ${new Date().toLocaleDateString('de-DE')}</p><button class="no-print" onclick="window.print()" style="margin-top:20px;padding:12px 24px;background:#006c4d;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">Als PDF speichern</button></div></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setIsExporting(false);
  };

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    sessionStorage.setItem('videoFromListing', JSON.stringify({ listingId: data.id, title: data.title, images: data.images || [], city: data.city, propertyType: data.property_type }));
    router.push('/video?from=listings');
    setIsGeneratingVideo(false);
  };

  const renderFeatures = () => Object.entries(data.features).filter(([, v]) => v).map(([k]) => k);
  const hasMinImages = data.images && data.images.length >= 3;

  const getPortalBadgeClass = (portal: typeof PORTALS[0]) => {
    const state = portalStates[portal.id];
    if (!portal.enabled) return 'bg-gray-100 text-gray-400 border border-gray-200';
    switch (state.status) {
      case 'synced': return 'bg-green-600 text-white';
      case 'syncing': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'failed': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-semibold text-gray-900">Review & Publish</h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Portal Sync</span>
        </div>
        <p className="text-gray-600">Preview your listing and sync to connected portals with one click.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{data.title || 'Untitled Listing'}</h3>
          <p className="text-gray-600">📍 {data.street} {data.house_number}, {data.postal_code} {data.city}</p>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <span className="text-2xl font-bold text-indigo-600">{formatPrice()}</span>
            {data.transaction_type === 'rent' && data.cold_rent && data.additional_costs && (
              <span className="ml-2 text-sm text-gray-500">(Kaltmiete: €{data.cold_rent.toLocaleString()})</span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-600"><Home className="w-4 h-4" /><span>{data.rooms} rooms</span></div>
            <div className="flex items-center gap-2 text-gray-600"><Bed className="w-4 h-4" /><span>{data.bedrooms || '-'} beds</span></div>
            <div className="flex items-center gap-2 text-gray-600"><Bath className="w-4 h-4" /><span>{data.bathrooms || '-'} baths</span></div>
            <div className="flex items-center gap-2 text-gray-600"><Building className="w-4 h-4" /><span>{data.living_area} m²</span></div>
            <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4" /><span>Built {data.construction_year || '-'}</span></div>
          </div>
          {renderFeatures().length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {renderFeatures().slice(0, 6).map((feature) => (
                <span key={feature} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm capitalize">{feature.replace('_', ' ')}</span>
              ))}
            </div>
          )}
          <div className="text-gray-600 text-sm line-clamp-3">{data.description || 'No description generated yet.'}</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Portal Sync</h3>
        <div className="flex flex-wrap gap-3">
          {PORTALS.map((portal) => {
            const state = portalStates[portal.id];
            const isConfigured = portal.enabled;
            return (
              <div key={portal.id} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${getPortalBadgeClass(portal)}`} title={!isConfigured ? 'API key not configured' : undefined}>
                {!isConfigured && <AlertCircle className="w-3.5 h-3.5" />}
                {state.status === 'synced' && <Check className="w-4 h-4" />}
                {state.status === 'syncing' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{portal.logo}</span>
                <span>{portal.name}</span>
                {!isConfigured && <span className="text-xs opacity-75">(config)</span>}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">⚡ Portal APIs not yet configured. Add API keys in settings to enable real sync.</p>
      </div>

      <div className="flex flex-col gap-3">
        {publishStatus === 'published' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-600 font-medium mb-1">🎉 Listing Published!</div>
            <p className="text-sm text-green-600">Synced to all configured portals.</p>
          </div>
        ) : (
          <>
            <button onClick={handlePublish} disabled={isPublishing} className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {isPublishing && publishStatus === 'publishing' ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Syncing to portals...</span> : 'Publish to All Portals'}
            </button>
            <button onClick={handleSaveDraft} disabled={isPublishing} className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors">
              {isPublishing && publishStatus === 'draft' ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Saving...</span> : 'Save as Draft'}
            </button>
          </>
        )}
        <button onClick={handleExportPDF} disabled={isExporting} className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {isExporting ? <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Generating Exposé...</span> : <><FileText className="w-5 h-5" />Export as Exposé (PDF)</>}
        </button>
        <button onClick={handleGenerateVideo} disabled={isGeneratingVideo || !hasMinImages} className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {isGeneratingVideo ? <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Opening Video Creator...</span> : <><Video className="w-5 h-5" />Generate Property Video{!hasMinImages && <span className="text-xs opacity-75">(need 3+ images)</span>}</>}
        </button>
      </div>

      <div className="flex justify-start pt-4 border-t border-gray-100">
        <button onClick={onPrev} disabled={publishStatus === 'published'} className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-50">← Back</button>
      </div>
    </div>
  );
}
