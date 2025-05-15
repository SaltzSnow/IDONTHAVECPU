// src/app/layout.tsx
import type { Metadata } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css'; 
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar'; 

const kanit = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="th">
      <body className={`${kanit.className} bg-slate-900 text-slate-200 min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-slate-800 text-center p-4 text-sm text-slate-400 border-t border-slate-700">
            © {new Date().getFullYear()} I DON&apos;T HAVE CPU. สงวนลิขสิทธิ์.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}