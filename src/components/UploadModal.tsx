'use client';

import { useState, useCallback } from 'react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadImages, uploadFloorplan } from '@/lib/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
}

export function UploadModal({ isOpen, onClose, propertyId }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<'images' | 'floorplan'>('images');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadStatus('uploading');

    const formData = new FormData();
    
    try {
      if (activeTab === 'images') {
        files.forEach((file) => formData.append('images', file));
        formData.append('agentId', 'agent-001');
        formData.append('listingId', propertyId);
        formData.append('enhancementOptions', JSON.stringify({ optimize: true }));
        await uploadImages(formData);
      } else {
        const pdfFile = files.find(f => f.type === 'application/pdf') || files[0];
        formData.append('floorplan', pdfFile);
        formData.append('agentId', 'agent-001');
        formData.append('projectName', `Property-${propertyId}`);
        formData.append('scale', '1');
        formData.append('unit', 'm');
        await uploadFloorplan(formData);
      }
      setUploadStatus('success');
      setTimeout(() => {
        setFiles([]);
        setUploadStatus('idle');
        onClose();
      }, 1500);
    } catch {
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload to Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'images'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Property Images
          </button>
          <button
            onClick={() => setActiveTab('floorplan')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'floorplan'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Floor Plan
          </button>
        </div>

        <div className="p-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">
              Drag & drop {activeTab === 'images' ? 'images' : 'PDF files'} here
            </p>
            <p className="text-sm text-gray-400 mb-4">or</p>
            <label className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors">
              Browse Files
              <input
                type="file"
                multiple={activeTab === 'images'}
                accept={activeTab === 'images' ? 'image/*' : '.pdf'}
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Upload successful!
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Upload failed. Please try again.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
