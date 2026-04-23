import { Header } from '@/components/Header';
import Link from 'next/link';

export const metadata = {
  title: 'Help & Support - Zestio',
  description: 'Get help using Zestio AI-powered real estate tools',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">

        <h1 className="font-serif text-4xl text-[#1d2832] mb-2">Help & Support</h1>
        <p className="text-[#43474c] mb-10">Everything you need to get the most out of Zestio.</p>

        {/* Quick Start */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-6">Quick Start</h2>
          <div className="grid md:grid-cols-2 gap-4">

            <Link href="/studio" className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#006c4d]">auto_awesome</span>
                <h3 className="font-medium text-[#1d2832]">Image Studio</h3>
              </div>
              <p className="text-sm text-[#43474c]">
                Your all-in-one workspace. Enhance photos (sky replace, season change, HDR, etc.),
                virtually stage rooms with furniture, or clean up images — 13 AI tools in one place.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Enhance</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Stage</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Sky</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Season</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Cleanup</span>
              </div>
            </Link>

            <Link href="/video" className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#006c4d]">movie</span>
                <h3 className="font-medium text-[#1d2832]">Video Creator</h3>
              </div>
              <p className="text-sm text-[#43474c]">
                Turn property photos into cinematic videos. Upload 5+ images, pick a style,
                and the AI auto-sorts rooms, stages interiors, and animates each shot into a video.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Auto-Sort</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">AI Staging</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Animation</span>
              </div>
            </Link>

            <Link href="/listing/new" className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#006c4d]">description</span>
                <h3 className="font-medium text-[#1d2832]">Listing Builder</h3>
              </div>
              <p className="text-sm text-[#43474c]">
                Generate professional property descriptions in seconds. Enter property details,
                and AI creates SEO-optimized listing text for Zillow, ImmoScout24, and more.
                Available in English &amp; German.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">EN / DE</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">SEO</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Free</span>
              </div>
            </Link>

            <Link href="/social" className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#006c4d]">share</span>
                <h3 className="font-medium text-[#1d2832]">Smart Captions &amp; Social Kit</h3>
              </div>
              <p className="text-sm text-[#43474c]">
                Get AI-generated captions for Instagram, Facebook, and more. Resize images
                for any platform. Completely free — no credits needed.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Free</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Multi-Platform</span>
                <span className="px-1.5 py-0.5 bg-[#e3efff] text-[8px] font-manrope uppercase tracking-wider text-[#1d2832] rounded">Auto-Resize</span>
              </div>
            </Link>

          </div>
        </section>

        {/* How It Works */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-6">How It Works</h2>
          <div className="bg-white rounded-lg border border-[#c4c6cd]/20 p-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#006c4d] text-white flex items-center justify-center font-manrope text-xs font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-medium text-[#1d2832] mb-1">Upload your photo</h3>
                  <p className="text-sm text-[#43474c]">JPG, PNG, or WebP up to 10MB. Works best with well-lit property photos.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#006c4d] text-white flex items-center justify-center font-manrope text-xs font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-medium text-[#1d2832] mb-1">Choose your tool</h3>
                  <p className="text-sm text-[#43474c]">Pick from 13 enhancement types, 8 staging styles, video generation, or caption creation.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#006c4d] text-white flex items-center justify-center font-manrope text-xs font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-medium text-[#1d2832] mb-1">AI processes your image</h3>
                  <p className="text-sm text-[#43474c]">Most enhancements complete in 10-30 seconds. Videos take 2-5 minutes depending on image count.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#006c4d] text-white flex items-center justify-center font-manrope text-xs font-bold shrink-0">4</div>
                <div>
                  <h3 className="font-medium text-[#1d2832] mb-1">Download &amp; share</h3>
                  <p className="text-sm text-[#43474c]">Download your result or share directly to social media with auto-generated captions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credits */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-6">Credits &amp; Pricing</h2>
          <div className="bg-white rounded-lg border border-[#c4c6cd]/20 p-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-[#c4c6cd]/10">
                <div>
                  <h3 className="font-medium text-[#1d2832]">Image Enhancement</h3>
                  <p className="text-xs text-[#43474c]">Sky replace, seasons, HDR, cleanup, etc.</p>
                </div>
                <span className="font-manrope text-sm text-[#006c4d] font-medium">1 credit</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#c4c6cd]/10">
                <div>
                  <h3 className="font-medium text-[#1d2832]">Virtual Staging</h3>
                  <p className="text-xs text-[#43474c]">8 room types, 8 furniture styles</p>
                </div>
                <span className="font-manrope text-sm text-[#006c4d] font-medium">2 credits</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#c4c6cd]/10">
                <div>
                  <h3 className="font-medium text-[#1d2832]">Video Generation</h3>
                  <p className="text-xs text-[#43474c]">Full pipeline: sort → stage → animate → stitch</p>
                </div>
                <span className="font-manrope text-sm text-[#006c4d] font-medium">1 credit</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#c4c6cd]/10">
                <div>
                  <h3 className="font-medium text-[#1d2832]">AI Description Generator</h3>
                  <p className="text-xs text-[#43474c]">Listing descriptions in EN &amp; DE</p>
                </div>
                <span className="font-manrope text-sm text-[#006c4d] font-medium">Free</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <div>
                  <h3 className="font-medium text-[#1d2832]">Smart Captions &amp; Social Kit</h3>
                  <p className="text-xs text-[#43474c]">AI captions + image resizing for social</p>
                </div>
                <span className="font-manrope text-sm text-[#006c4d] font-medium">Free</span>
              </div>
            </div>
            <p className="text-xs text-[#43474c] mt-6 pt-4 border-t border-[#c4c6cd]/10">
              Free accounts start with 5 credits. Need more? Check our <Link href="/pricing" className="text-[#006c4d] underline">pricing plans</Link>.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                What image formats are supported?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">JPG, PNG, and WebP images up to 10MB. For best results, use high-resolution photos with good lighting.</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                How long does processing take?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">Enhancements: 10-30 seconds. Virtual staging: 20-60 seconds. Videos: 2-5 minutes depending on number of images (each image is processed individually).</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                Can I use the API in my own app?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">Yes! Generate API keys in <Link href="/settings" className="text-[#006c4d] underline">Settings</Link> and check our <Link href="/docs" className="text-[#006c4d] underline">API documentation</Link> for integration guides. Both enhance and staging endpoints support Bearer token authentication.</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                How many images do I need for a video?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">Minimum 5 images for best results. Upload interior and exterior shots — the AI auto-sorts them into a logical tour order (exterior → living → kitchen → bedrooms).</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                What&apos;s the difference between staging models?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="text-sm text-[#43474c] mt-3 space-y-2">
                <p><strong>Interior Design</strong> (default) — Best value, fast, good for most rooms.</p>
                <p><strong>FLUX Depth Pro</strong> — Higher quality, better at preserving room structure. Uses depth maps for more accurate furniture placement.</p>
                <p><strong>Decor8</strong> — Premium staging via dedicated API. Best for high-end listings.</p>
              </div>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                Do I need to keep the browser open during video processing?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">Yes — the video pipeline processes step-by-step via your browser. Keep the tab open until you see the final video. Closing the tab will pause processing.</p>
            </details>
          </div>
        </section>

        {/* API Quick Reference */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-6">API Quick Reference</h2>
          <div className="bg-white rounded-lg border border-[#c4c6cd]/20 p-8">
            <p className="text-sm text-[#43474c] mb-4">
              Use Zestio in your own apps. Generate an API key in <Link href="/settings" className="text-[#006c4d] underline">Settings</Link>.
            </p>
            <div className="bg-[#1d2832] rounded-lg p-4 text-sm font-mono text-[#86f8c8] overflow-x-auto">
              <p className="text-[#43474c]"># Enhance an image</p>
              <p>curl -X POST {process.env.NEXT_PUBLIC_URL || 'https://propertypix-pro.vercel.app'}/api/enhance \</p>
              <p className="pl-4">-H &quot;Authorization: Bearer zest_your_api_key&quot; \</p>
              <p className="pl-4">-H &quot;Content-Type: application/json&quot; \</p>
              <p className="pl-4">-d {`'{"image":"...","type":"sky"}'`}</p>
            </div>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 mt-4 text-sm text-[#006c4d] font-medium hover:underline"
            >
              View full API docs
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="bg-white rounded-lg border border-[#c4c6cd]/20 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl text-[#1d2832] mb-1">Still need help?</h2>
              <p className="text-sm text-[#43474c]">
                Reach us at{' '}
                <a href="mailto:support@zestio.pro" className="text-[#006c4d] underline">
                  support@zestio.pro
                </a>
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-[#006c4d] text-white px-6 py-3 rounded font-manrope uppercase tracking-widest text-xs hover:opacity-90 transition-all"
            >
              Back to Dashboard
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
