"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink { href:string; label:string; match?: (path:string)=>boolean }

const links: NavLink[] = [
  { href: '/thepynkspice-chef', label: 'Dashboard', match: p => p === '/thepynkspice-chef' },
  { href: '/thepynkspice-chef/orders', label: 'Orders', match: p => p.startsWith('/thepynkspice-chef/orders') },
  { href: '/thepynkspice-chef/menu', label: 'Menu', match: p => p.startsWith('/thepynkspice-chef/menu') },
  { href: '/thepynkspice-chef/reviews', label: 'Reviews', match: p => p.startsWith('/thepynkspice-chef/reviews') },
  { href: '/menu', label: 'Public Menu', match: p => p === '/menu' },
];

export default function AdminNav() {
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw || '';
  const base = 'text-xs font-medium px-3 py-1.5 rounded-md transition border';
  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {links.map(l => {
        const active = l.match ? l.match(pathname) : pathname === l.href;
        const cls = active
          ? `${base} bg-pink-600 border-pink-600 text-white shadow hover:bg-pink-500`
          : `${base} bg-white border-gray-200 text-gray-700 hover:bg-pink-50 hover:text-pink-700`;
        return (
          <Link key={l.href} href={l.href} className={cls}>{l.label}</Link>
        );
      })}
    </nav>
  );
}
