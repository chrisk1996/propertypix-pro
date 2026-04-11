'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Header />

      <main className="pt-32">
        {/* Hero Section */}
        <section className="px-12 mb-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-24">
            <div className="md:w-3/5">
              <span className="font-manrope text-xs uppercase tracking-[0.3em] text-[#006c4d] mb-4 block">
                The Digital Gallerist
              </span>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[0.9] text-[#1d2832] mb-6 tracking-tighter">
                Elevating Real Estate
                <br />
                to <span className="italic">Fine Art.</span>
              </h1>
              <p className="text-base text-[#43474c] leading-relaxed mb-8 max-w-xl">
                The visual standard for the world&apos;s most prestigious properties. PropertyPix transforms
                standard photography into cinematic narratives that captivate and convert.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-3 bg-[#006c4d] text-white px-8 py-4 rounded font-manrope uppercase tracking-widest text-xs hover:opacity-90 transition-all"
              >
                Start Your Editorial Journey
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
            <div className="md:w-2/5 h-[300px] md:h-[400px] relative overflow-hidden rounded-lg grayscale-[0.2] opacity-90">
              <img
                alt="Minimalist luxury interior"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
              />
            </div>
          </div>
        </section>

        {/* Service Catalogue */}
      <section id="products" className="px-12 py-20 bg-[#edf4ff]">
        
          <div className="max-w-7xl mx-auto">
            <div className="flex items-baseline justify-between mb-16 border-b border-[#c4c6cd]/30 pb-6">
              <h2 className="font-serif text-4xl text-[#1d2832]">Service Catalogue</h2>
              <span className="font-manrope text-xs uppercase tracking-widest text-[#43474c]">
                5 Modular Offerings
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* AI Image Enhancer */}
              <div className="bg-white rounded-lg overflow-hidden flex flex-col card-hover-effect border border-[#c4c6cd]/10">
                <div className="h-64 relative overflow-hidden">
                  <img
                    alt="Professional property photography"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-sm">
                    <span className="font-manrope text-[10px] uppercase tracking-widest text-[#1d2832]">
                      01 / Enhancement
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="font-serif text-3xl text-[#1d2832] mb-2">AI Image Enhancer</h3>
                  <p className="font-serif italic text-xl text-[#006c4d] mb-4">&apos;Perfect the Shot.&apos;</p>
                  <p className="text-sm text-[#43474c] leading-relaxed mb-8 flex-grow">
                    Beyond simple filters. Our AI reconstructs lighting, balances exposure, and enhances
                    clarity pixel by pixel.
                  </p>
                  <div className="flex flex-col gap-3 pt-6 border-t border-[#c4c6cd]/10">
                    <div className="flex items-center gap-3 text-[#1d2832] opacity-80">
                      <span className="material-symbols-outlined text-sm text-[#006c4d]">wb_sunny</span>
                      <span className="font-manrope text-[10px] uppercase tracking-widest">
                        Dynamic Range Optimization
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[#1d2832] opacity-80">
                      <span className="material-symbols-outlined text-sm text-[#006c4d]">shutter_speed</span>
                      <span className="font-manrope text-[10px] uppercase tracking-widest">
                        HDR Clarity Engine
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Virtual Staging */}
              <div className="bg-white rounded-lg overflow-hidden flex flex-col card-hover-effect border border-[#c4c6cd]/10">
                <div className="h-64 relative overflow-hidden">
                  <img
                    alt="Staged modern living room"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1600607687939-380e8a2a0c16?w=600&q=80"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-sm">
                    <span className="font-manrope text-[10px] uppercase tracking-widest text-[#1d2832]">
                      02 / Atmosphere
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="font-serif text-3xl text-[#1d2832] mb-2">Virtual Staging</h3>
                  <p className="font-serif italic text-xl text-[#006c4d] mb-4">&apos;Invite Them In.&apos;</p>
                  <p className="text-sm text-[#43474c] leading-relaxed mb-8 flex-grow">
                    Curate spaces with our proprietary digital library. Hyper-realistic furniture
                    and decor for empty rooms.
                  </p>
                  <div className="flex items-center gap-3 pt-6 border-t border-[#c4c6cd]/10">
                    <div className="flex items-center gap-3 text-[#1d2832] opacity-80">
                      <span className="material-symbols-outlined text-sm text-[#006c4d]">chair</span>
                      <span className="font-manrope text-[10px] uppercase tracking-widest">
                        Hyper-Realistic Decor
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Creator */}
              <div className="bg-white rounded-lg overflow-hidden flex flex-col card-hover-effect border border-[#c4c6cd]/10">
                <div className="h-64 relative overflow-hidden bg-[#333e48]">
                  <img
                    alt="Cinematic property video frame"
                    className="w-full h-full object-cover opacity-80"
                    src="https://images.unsplash.com/photo-1600566753190-17e0b6a5c6e3?w=600&q=80"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-sm">
                    <span className="font-manrope text-[10px] uppercase tracking-widest text-[#1d2832]">
                      03 / Motion
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center backdrop-blur-sm">
                      <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </div>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="font-serif text-3xl text-[#1d2832] mb-2">Video Creator</h3>
                  <p className="font-serif italic text-xl text-[#006c4d] mb-4">&apos;Tell the Story.&apos;</p>
                  <p className="text-sm text-[#43474c] leading-relaxed mb-8 flex-grow">
                    Generate cinematic walk-throughs from static images. Natural parallax and elegant transitions.
                  </p>
                  <div className="flex items-center gap-3 pt-6 border-t border-[#c4c6cd]/10">
                    <div className="flex items-center gap-3 text-[#1d2832] opacity-80">
                      <span className="material-symbols-outlined text-sm text-[#006c4d]">movie</span>
                      <span className="font-manrope text-[10px] uppercase tracking-widest">
                        3D Parallax Engine
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floor Plans */}
              <div className="bg-white rounded-lg overflow-hidden flex flex-col card-hover-effect border border-[#c4c6cd]/10">
                <div className="h-64 relative overflow-hidden bg-[#e3efff] flex items-center justify-center gap-8">
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border border-[#c4c6cd]/15">
                    <span className="material-symbols-outlined text-3xl text-[#1d2832]/30">architecture</span>
                  </div>
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border border-[#c4c6cd]/15">
                    <span className="material-symbols-outlined text-3xl text-[#1d2832]/30">view_in_ar</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-sm">
                    <span className="font-manrope text-[10px] uppercase tracking-widest text-[#1d2832]">
                      04 / Precision
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="font-serif text-3xl text-[#1d2832] mb-2">2D &amp; 3D Floor Plans</h3>
                  <p className="font-serif italic text-xl text-[#006c4d] mb-4">&apos;The Architectural Blueprint.&apos;</p>
                  <p className="text-sm text-[#43474c] leading-relaxed mb-8 flex-grow">
                    Precision 2D drafting and immersive 3D interior design. Millimeter-perfect accuracy.
                  </p>
                  <div className="flex gap-6 pt-6 border-t border-[#c4c6cd]/10">
                    <div className="text-[#1d2832] opacity-80">
                      <span className="block font-manrope text-[9px] uppercase tracking-tighter mb-0.5">Precision</span>
                      <span className="text-sm font-serif italic">Millimeter Perfect</span>
                    </div>
                    <div className="text-[#1d2832] opacity-80">
                      <span className="block font-manrope text-[9px] uppercase tracking-tighter mb-0.5">Immersion</span>
                      <span className="text-sm font-serif italic">360° Vision</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Listing Builder */}
              <div className="bg-white rounded-lg overflow-hidden flex flex-col card-hover-effect border border-[#c4c6cd]/10">
                <div className="h-64 relative overflow-hidden">
                  <img
                    alt="Luxury real estate"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1600585154526-31d2ee637d49?w=600&q=80"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-sm">
                    <span className="font-manrope text-[10px] uppercase tracking-widest text-[#1d2832]">
                      05 / Narrative
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="font-serif text-3xl text-[#1d2832] mb-2">AI Listing Builder</h3>
                  <p className="font-serif italic text-xl text-[#006c4d] mb-4">&apos;Sell Faster.&apos;</p>
                  <p className="text-sm text-[#43474c] leading-relaxed mb-8 flex-grow">
                    Convert data into desire. Descriptions optimized for Zillow, ImmobilienScout24, and more.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-6 border-t border-[#c4c6cd]/10">
                    <span className="px-2 py-1 bg-[#e3efff] rounded-sm font-manrope text-[8px] uppercase tracking-widest text-[#1d2832]">Zillow Ready</span>
                    <span className="px-2 py-1 bg-[#e3efff] rounded-sm font-manrope text-[8px] uppercase tracking-widest text-[#1d2832]">SEO Optimized</span>
                    <span className="px-2 py-1 bg-[#e3efff] rounded-sm font-manrope text-[8px] uppercase tracking-widest text-[#1d2832]">Multilingual</span>
                  </div>
                </div>
              </div>

              {/* CTA Card */}
              <div className="bg-[#1d2832] flex flex-col justify-center items-center p-8 rounded-lg text-center card-hover-effect">
                <h3 className="font-serif text-3xl text-white mb-6">Ready to Elevate?</h3>
                <p className="text-sm text-white/70 mb-8 max-w-[200px]">
                  Custom solutions for high-volume agencies.
                </p>
                <Link
                  href="/pricing"
                  className="bg-white text-[#1d2832] px-8 py-3 rounded font-manrope uppercase tracking-widest text-xs hover:bg-[#86f8c8] transition-all"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-12 py-32 text-center max-w-4xl mx-auto">
          <h2 className="font-serif text-5xl md:text-6xl text-[#1d2832] mb-6 leading-tight">
            The gallery is open.
            <br />
            Your portfolio awaits.
          </h2>
          <p className="text-lg text-[#43474c] mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Join the world&apos;s leading real estate agencies in redefining the digital property experience.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              href="/auth"
              className="w-full md:w-auto bg-[#1d2832] text-white px-10 py-4 rounded font-manrope uppercase tracking-widest text-xs hover:bg-[#333e48] transition-all"
            >
              Create Your Account
            </Link>
            <Link
              href="/pricing"
              className="w-full md:w-auto border border-[#1d2832]/20 text-[#1d2832] px-10 py-4 rounded font-manrope uppercase tracking-widest text-xs hover:bg-[#edf4ff] transition-all"
            >
              View Pricing
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#edf4ff] border-t border-[#c4c6cd]/15">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 px-8 md:px-20 py-16">
          <div className="space-y-6">
            <div className="text-xl font-serif italic text-[#1d2832]">PropertyPix</div>
            <p className="font-manrope text-xs uppercase tracking-widest text-[#1d2832]/60 leading-relaxed">
              The Digital Gallerist.
              <br />
              Redefining the visual architecture of real estate marketing.
            </p>
          </div>
          <div className="space-y-6">
            <h5 className="font-manrope text-xs uppercase tracking-[0.2em] font-bold text-[#1d2832]">Navigation</h5>
            <ul className="space-y-3">
              <li><Link href="/enhance" className="font-manrope text-xs uppercase tracking-widest text-[#1d2832]/60 hover:text-[#006c4d] transition-colors">Products</Link></li>
              <li><Link href="/pricing" className="font-manrope text-xs uppercase tracking-widest text-[#1d2832]/60 hover:text-[#006c4d] transition-colors">Pricing</Link></li>
              <li><Link href="/help" className="font-manrope text-xs uppercase tracking-widest text-[#1d2832]/60 hover:text-[#006c4d] transition-colors">Help</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h5 className="font-manrope text-xs uppercase tracking-[0.2em] font-bold text-[#1d2832]">Connect</h5>
            <ul className="space-y-3">
              <li><Link href="https://twitter.com/propertypix" target="_blank" className="font-manrope text-xs uppercase tracking-widest text-[#1d2832]/60 hover:text-[#006c4d] transition-colors">Twitter</Link></li>
              <li><Link href="https://linkedin.com/company/propertypix" target="_blank" className="font-manrope text-xs uppercase tracking-widest text-[#1d2832]/60 hover:text-[#006c4d] transition-colors">LinkedIn</Link></li>
              <li><Link href="mailto:hello@propertypix.pro" className="font-manrope text-xs uppercase tracking-widest text-[#1d2832]/60 hover:text-[#006c4d] transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h5 className="font-manrope text-xs uppercase tracking-[0.2em] font-bold text-[#1d2832]">Legal</h5>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="font-manrope text-xs uppercase tracking-widest text-[#1d2832]/60 hover:text-[#006c4d] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="font-manrope text-xs uppercase tracking-widest text-[#1d2832]/60 hover:text-[#006c4d] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="px-8 md:px-20 py-8 border-t border-[#c4c6cd]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-manrope text-[9px] uppercase tracking-[0.2em] text-[#1d2832]/40">
            © 2026 PropertyPix. The Digital Gallerist. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-[#006c4d] font-bold text-[9px] uppercase tracking-widest">Status: Excellence Optimized</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
