export default function VideoLoading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="h-16 bg-white border-b border-slate-100" />
      <div className="max-w-4xl mx-auto px-4 pt-24">
        <div className="h-8 bg-slate-100 rounded w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[400px] bg-slate-100 rounded-xl" />
          <div className="h-[400px] bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
