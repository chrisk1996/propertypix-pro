'use client';

import { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';

interface ExampleImage {
  id: string;
  name: string;
  url: string;
  type: 'interior' | 'exterior' | 'landscape';
}

const exampleImages: ExampleImage[] = [
  {
    id: '1',
    name: 'Living Room',
    url: '/examples/living-room.jpg',
    type: 'interior',
  },
  {
    id: '2',
    name: 'House Exterior',
    url: '/examples/house-exterior.jpg',
    type: 'exterior',
  },
  {
    id: '3',
    name: 'Backyard View',
    url: '/examples/backyard.jpg',
    type: 'landscape',
  },
];

interface TryExampleButtonProps {
  onSelectExample: (url: string) => void;
}

export function TryExampleButton({ onSelectExample }: TryExampleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectExample = (example: ExampleImage) => {
    // In production, this would load the actual example image
    // For now, we'll use a placeholder
    onSelectExample(example.url);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        <ImageIcon className="w-4 h-4" />
        Try with example image
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Try Example Image</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Select an example image to see how PropertyPix Pro enhances property photos.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {exampleImages.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => handleSelectExample(example)}
                    className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 group-hover:from-black/80 transition-colors">
                      <p className="text-white text-xs font-medium truncate">{example.name}</p>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Example images are placeholders. Upload your own photo for real results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
