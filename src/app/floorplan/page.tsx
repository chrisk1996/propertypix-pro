import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PropertyPix | Floor Plan Projects',
  description: 'Create stunning 3D floor plans for your real estate listings',
};

export default function FloorplanPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-primary-foreground font-bold text-sm">PP</span>
            </div>
            <span className="font-semibold">PropertyPix Pro</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/floorplan-v2" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Create New
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Floor Plan Projects</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create professional 3D floor plans for your real estate listings. Draw walls, add furniture, and export stunning visualizations.
          </p>
        </div>

        {/* Create New Button */}
        <div className="flex justify-center mb-16">
          <Link
            href="/floorplan-v2"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Create New Floor Plan
          </Link>
        </div>

        {/* Recent Projects (placeholder) */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Recent Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder cards */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-surface-container p-4 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="aspect-video bg-surface-container-high rounded-md mb-4 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-muted-foreground">floor_plan</span>
                </div>
                <h3 className="font-medium mb-1">Untitled Project {i}</h3>
                <p className="text-sm text-muted-foreground">Last edited: Today</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-primary-foreground mb-4">
              <span className="material-symbols-outlined">architecture</span>
            </div>
            <h3 className="font-medium mb-2">Easy Drawing</h3>
            <p className="text-sm text-muted-foreground">
              Draw walls, doors, and windows with simple click and drag tools.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-primary-foreground mb-4">
              <span className="material-symbols-outlined">view_in_ar</span>
            </div>
            <h3 className="font-medium mb-2">3D Visualization</h3>
            <p className="text-sm text-muted-foreground">
              See your floor plan come to life with real-time 3D rendering.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-primary-foreground mb-4">
              <span className="material-symbols-outlined">download</span>
            </div>
            <h3 className="font-medium mb-2">Export Options</h3>
            <p className="text-sm text-muted-foreground">
              Export as GLB, STL, or OBJ for use in any 3D software.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 PropertyPix Pro</span>
          <div className="flex gap-4">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
