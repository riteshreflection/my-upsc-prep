import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { FiHome, FiClipboard, FiAward, FiSettings, FiBarChart2 } from "react-icons/fi";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UPSC Prep Portal - Complete Civil Services Preparation",
  description: "Comprehensive UPSC Civil Services preparation platform with daily tests, flash cards, analytics, and personalized study plans",
};

const navItems = [
  { href: '/', icon: FiHome, label: 'Dashboard' },
  { href: '/tasks', icon: FiClipboard, label: 'Tasks', highlight: true },
  { href: '/daily-test', icon: FiClipboard, label: 'Daily Test' },
  { href: '/flash-cards', icon: FiAward, label: 'Flash Cards', highlight: true },
  { href: '/analytics', icon: FiBarChart2, label: 'Analytics' },
  { href: '/settings', icon: FiSettings, label: 'Settings' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased text-white`}>
        {/* Fireflies Background */}
        <div className="fireflies">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="firefly"></div>
          ))}
        </div>
        
        <div className="flex min-h-screen relative z-10">
          {/* Sidebar */}
          <aside className="w-64 glass-dark border-r border-white/20 flex flex-col p-6 gap-3 animate-slide-in-left">
            <h1 className="text-2xl font-bold mb-8 gradient-text">
              UPSC Prep Portal
            </h1>
            <nav className="flex flex-col gap-3">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 hover:bg-white/10 rounded-xl px-4 py-3 font-semibold transition-all duration-300 hover:transform hover:scale-105 animate-fade-in ${
                    item.highlight 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30' 
                      : 'hover:shadow-lg hover:shadow-blue-500/20'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <item.icon className={`text-xl ${item.highlight ? 'text-green-400' : 'text-blue-400'}`} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-pink-900/20 pointer-events-none"></div>
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
