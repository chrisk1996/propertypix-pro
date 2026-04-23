export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="h-16 bg-white border-b border-slate-100" />
      <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto">
        <div className="h-12 bg-slate-100 rounded w-72 mb-3" />
        <div className="h-5 bg-slate-100 rounded w-96 mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}
