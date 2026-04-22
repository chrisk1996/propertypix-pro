'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/studio', icon: 'auto_awesome', label: 'Image Studio' },
  { href: '/social', icon: 'share', label: 'Social Media Kit' },
  { href: '/listing', icon: 'description', label: 'Listing Builder' },
  { href: '/video', icon: 'movie_filter', label: 'Video Creator' },
  { href: '/floorplan', icon: 'polyline', label: '3D Floor Plans' },
  { href: '/library', icon: 'folder_special', label: 'Library' },
];

export default function SideNavBar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col z-40 w-64 border-r border-slate-200 bg-white font-['Plus_Jakarta_Sans'] font-medium text-sm">
      <div className="p-6 flex flex-col h-full">
        {/* Logo */}
        <div className="mb-10 px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <span className="text-white font-extrabold text-sm leading-none">Z</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Zestio
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600 font-semibold'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto pt-6 border-t border-slate-200 space-y-1">
          <Link
            href="/billing"
            className={`flex items-center gap-3 px-4 py-2 transition-all ${
              pathname === '/billing' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span>Billing</span>
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-2 transition-all ${
              pathname === '/settings' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </Link>
          <Link href="/help" className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-900 transition-all">
            <span className="material-symbols-outlined">help_outline</span>
            <span>Support</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
