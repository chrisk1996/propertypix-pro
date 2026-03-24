'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { History, Image, Download, Trash2, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface EnhancementJob {
  id: string;
  user_id: string;
  original_image: string;
  enhanced_image: string | null;
  enhancement_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState<EnhancementJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view your history');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('propertypix_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load enhancement history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (job: EnhancementJob) => {
    if (!job.enhanced_image) return;
    
    try {
      const response = await fetch(job.enhanced_image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enhanced-${job.enhancement_type}-${job.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(job.enhanced_image, '_blank');
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this enhancement?')) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('propertypix_jobs')
        .delete()
        .eq('id', jobId);
      
      if (deleteError) throw deleteError;
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete enhancement');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      auto: 'Auto Enhance',
      sky: 'Sky Replace',
      staging: 'Virtual Staging',
      object_removal: 'Object Removal',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <History className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enhancement History</h1>
              <p className="text-gray-600">View and manage your past enhancements</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No enhancements yet</h3>
            <p className="text-gray-500 mb-6">Start by enhancing your first property photo</p>
            <Link
              href="/enhance"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Enhance Photo
            </Link>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Image Preview */}
                <div className="relative aspect-video bg-gray-100">
                  {job.enhanced_image ? (
                    <img
                      src={job.enhanced_image}
                      alt="Enhanced"
                      className="w-full h-full object-cover"
                    />
                  ) : job.original_image ? (
                    <img
                      src={job.original_image}
                      alt="Original"
                      className="w-full h-full object-cover opacity-50"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{getTypeLabel(job.enhancement_type)}</h3>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(job.created_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  {job.status === 'completed' && job.enhanced_image && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDownload(job)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {job.status === 'failed' && (
                    <p className="text-sm text-red-600 mt-2">Processing failed. Please try again.</p>
                  )}

                  {job.status === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
