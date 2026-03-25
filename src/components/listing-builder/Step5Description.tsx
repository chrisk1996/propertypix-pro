'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

interface Step5DescriptionProps {
  data: {
    title: string;
    description: string;
  };
  propertyType: string;
  transactionType: string;
  city: string;
  onChange: (data: Partial<{ title: string; description: string }>) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving?: boolean;
}

const TITLE_SUGGESTIONS = [
  'Wunderschöne Wohnung in zentraler Lage',
  'Moderne Wohnung mit Balkon und Ausblick',
  'Gemütliche Wohnung im Grünen',
  'Helle Wohnung in Top-Lage',
  'Stilvolle Wohnung mit Charme',
];

export function Step5Description({
  data,
  propertyType,
  transactionType,
  city,
  onChange,
  onNext,
  onBack,
  isSaving
}: Step5DescriptionProps) {
  const [localData, setLocalData] = useState(data);
  const [isGenerating, setIsGenerating] = useState(false);
  const [titleLength, setTitleLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  useEffect(() => {
    setTitleLength(localData.title.length);
    setDescriptionLength(localData.description.length);
  }, [localData.title, localData.description]);

  const handleInputChange = (field: 'title' | 'description', value: string) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onChange({ [field]: value });
  };

  const generateDescription = async () => {
    setIsGenerating(true);
    try {
      // In production, this would call an AI API (OpenAI, Claude, etc.)
      // For now, generate a simple template
      const propertyTypeLabel = propertyType === 'apartment' ? 'Wohnung' : 
                               propertyType === 'house' ? 'Haus' : 'Immobilie';
      const transactionLabel = transactionType === 'sale' ? 'zu verkaufen' : 'zu vermieten';
      
      const generatedTitle = `${propertyTypeLabel} ${transactionLabel} in ${city}`;
      const generatedDescription = `Entdecken Sie diese charmante ${propertyTypeLabel} in begehrter Lage von ${city}. 

Die Immobilie besticht durch ihre durchdachte Raumaufteilung und den guten Schnitt. Helle Räume sorgen für ein angenehmes Wohngefühl.

Besonders hervorzuheben sind die zentrale Lage mit sehr guter Anbindung an den öffentlichen Nahverkehr sowie die Nähe zu Einkaufsmöglichkeiten und Freizeiteinrichtungen.

Vereinbaren Sie noch heute einen Besichtigungstermin und überzeugen Sie sich selbst von den vielen Vorzügen dieser Immobilie!`;

      setLocalData({
        title: generatedTitle,
        description: generatedDescription,
      });
      onChange({
        title: generatedTitle,
        description: generatedDescription,
      });
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceed = localData.title.trim().length >= 10 && localData.description.trim().length >= 50;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Beschreibung</h2>
        <p className="text-gray-600">Verfassen Sie einen ansprechenden Titel und eine Beschreibung für Ihre Immobilie.</p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Titel <span className="text-red-500">*</span>
            </label>
            <span className={`text-sm ${titleLength < 10 ? 'text-red-500' : 'text-gray-500'}`}>
              {titleLength}/100 Zeichen (mind. 10)
            </span>
          </div>
          <input
            type="text"
            value={localData.title}
            onChange={e => handleInputChange('title', e.target.value)}
            placeholder="z.B. Wunderschöne Wohnung mit Balkon in Berlin-Mitte"
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          
          {/* Title suggestions */}
          <div className="mt-2 flex flex-wrap gap-2">
            {TITLE_SUGGESTIONS.slice(0, 3).map((suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleInputChange('title', suggestion)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Beschreibung <span className="text-red-500">*</span>
            </label>
            <span className={`text-sm ${descriptionLength < 50 ? 'text-red-500' : 'text-gray-500'}`}>
              {descriptionLength} Zeichen (mind. 50)
            </span>
          </div>
          
          {/* AI Generate button */}
          <div className="mb-2">
            <button
              type="button"
              onClick={generateDescription}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Mit KI generieren
                </>
              )}
            </button>
          </div>

          <textarea
            value={localData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Beschreiben Sie die Immobilie detailliert..."
            rows={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
          />
          
          {/* Writing tips */}
          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Tipps für eine gute Beschreibung:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Beginnen Sie mit den wichtigsten Merkmalen</li>
              <li>• Beschreiben Sie die Lage und Umgebung</li>
              <li>• Erwähnen Sie besondere Ausstattungsmerkmale</li>
              <li>• Nutzen Sie emotionale, aber ehrliche Sprache</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || isSaving}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium
            transition-all duration-200
            ${canProceed && !isSaving
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              Weiter
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
