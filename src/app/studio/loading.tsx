export default function StudioLoading() {
  return (
    <div className="min-h-screen bg-[#f7f9ff] animate-pulse">
      <div className="h-16 bg-white border-b border-[#c4c6cd]/10" />
      <div className="max-w-6xl mx-auto px-4 pt-24">
        <div className="h-8 bg-[#edf4ff] rounded w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px] bg-[#edf4ff] rounded-xl" />
          <div className="h-[500px] bg-[#edf4ff] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
