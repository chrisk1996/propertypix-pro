'use client';

import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { Upload, FileImage, Box, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function FloorPlanPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      processFile(file);
    } else {
      setError('Please upload an image or PDF file');
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    setError(null);
    setUploadedFile(file);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF placeholder
      setPreview(null);
    }
  };

  const handleGenerate3D = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      // In production, this would call /api/floorplan/process
      alert('3D generation coming soon! This is a preview.');
    } catch {
      setError('Failed to generate 3D model');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
            <Box className="w-4 h-4" />
            Floor Plan to 3D
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Convert Floor Plans to 3D Models
          </h1>
          <p className="text-gray-600">
            Upload a 2D floor plan and we'll generate an interactive 3D model
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {!uploadedFile ? (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop your floor plan here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports PNG, JPG, PDF (max 20MB)
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Browse files
                </button>
              </>
            ) : (
              <div className="space-y-4">
                {preview ? (
                  <img
                    src={preview}
                    alt="Floor plan preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                ) : (
                  <div className="flex items-center justify-center gap-3 p-8 bg-gray-100 rounded-lg">
                    <FileImage className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600">{uploadedFile.name}</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setPreview(null);
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Upload different file
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {uploadedFile && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleGenerate3D}
              disabled={isProcessing}
              className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Box className="w-5 h-5" />
                  Generate 3D Model
                </>
              )}
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-purple-50 rounded-xl p-6">
          <h3 className="font-semibold text-purple-900 mb-3">How it works:</h3>
          <ol className="space-y-2 text-purple-800">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-medium">1</span>
              Upload your 2D floor plan (image or PDF)
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-medium">2</span>
              AI analyzes the layout and identifies walls, rooms, and features
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-medium">3</span>
              Get an interactive 3D model you can explore and edit
            </li>
          </ol>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
