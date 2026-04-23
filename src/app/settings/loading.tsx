export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="max-w-2xl mx-auto px-4 pt-24">
        <div className="h-8 bg-gray-100 rounded w-40 mb-6" />
        {[1,2,3,4].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl mb-4" />)}
      </div>
    </div>
  );
}
