export default function BillingLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="h-16 bg-white border-b border-slate-100" />
      <div className="max-w-3xl mx-auto px-4 pt-24">
        <div className="h-8 bg-slate-100 rounded w-48 mb-6" />
        <div className="h-64 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl mb-6" />
        <div className="h-48 bg-slate-100 rounded-xl mb-4" />
        <div className="h-32 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}
