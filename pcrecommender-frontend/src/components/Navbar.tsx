// src/components/core/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; // ตรวจสอบ path นี้ให้ถูกต้อง
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react'; // เพิ่ม useRef
import {
  FiLogIn, FiLogOut, FiUserPlus, FiCpu,
  FiHeart, FiUser, FiMenu, FiX, FiHome, FiChevronDown, FiSettings
} from 'react-icons/fi';

export default function Navbar() {
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null); // Ref สำหรับ User Dropdown (ครอบปุ่มและ panel)

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    await logout();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUserDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
        setIsUserDropdownOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode, icon?: React.ReactNode }) => (
    <Link
      href={href}
      onClick={() => { setIsMobileMenuOpen(false); setIsUserDropdownOpen(false); }}
      className={`flex items-center px-4 py-2.5 rounded-lg text-base font-semibold transition-all duration-150 ease-in-out group
        ${pathname === href
          ? 'bg-sky-500 text-white shadow-md scale-105'
          : 'text-slate-200 hover:bg-slate-700 hover:text-white'
        }`}
    >
      {icon && <span className="mr-2 group-hover:animate-pulse">{icon}</span>}
      {children}
    </Link>
  );

  const MobileNavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) => (
    <Link
      href={href}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors duration-150 ease-in-out flex items-center
        ${pathname === href
          ? 'bg-sky-600 text-white shadow-inner'
          : 'text-slate-100 hover:bg-slate-700 hover:text-white'
        }`}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </Link>
  );

  const DropdownItem = ({ href, children, icon, onClick, className }: { href?: string; children: React.ReactNode; icon?: React.ReactNode; onClick?: () => void; className?: string }) => {
    const baseClasses = "w-full text-left flex items-center px-4 py-2.5 text-sm rounded-md transition-colors duration-150 ease-in-out";
    const activeClasses = className || 'text-slate-200 hover:bg-slate-600 hover:text-white';
    const content = (
      <>
        {icon && <span className="mr-3 opacity-80">{icon}</span>}
        {children}
      </>
    );
    if (href) {
      return (
        <Link href={href} onClick={() => { setIsUserDropdownOpen(false); if (onClick) onClick(); }} className={`${baseClasses} ${activeClasses}`}>
          {content}
        </Link>
      );
    }
    return (
      <button onClick={() => { if (onClick) onClick(); setIsUserDropdownOpen(false); }} className={`${baseClasses} ${activeClasses}`}>
        {content}
      </button>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-800/80 backdrop-blur-xl shadow-2xl border-b border-slate-700/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          <div className="flex-shrink-0">
            <Link href="/" className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 hover:opacity-80 transition-opacity flex items-center">
              <FiCpu className="mr-2.5 mb-1" /> I DON&apos;T HAVE CPU
            </Link>
          </div>

          {/* Auth Links / User Info (Desktop) */}
          <div className="hidden md:flex items-center space-x-4"> {/* ลบ relative และ ref ออกจาก div นี้ */}
            {authLoading ? (
              <div className="text-slate-400 text-sm animate-pulse">กำลังโหลด...</div>
            ) : isAuthenticated && user ? (
              // --- โครงสร้างใหม่สำหรับ User Button และ Dropdown ---
              <div className="relative" ref={userDropdownRef}> {/* <--- Div ใหม่นี้จะมี relative และ ref */}
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center text-slate-200 hover:text-white transition-colors p-2.5 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                  aria-expanded={isUserDropdownOpen}
                  aria-controls="user-dropdown-panel"
                >
                  <FiUser className="mr-2 text-sky-400" size={24} />
                  <span className="font-semibold text-base lg:text-lg">{user.username}</span>
                  <FiChevronDown size={20} className={`ml-1.5 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserDropdownOpen && (
                  <div
                    id="user-dropdown-panel"
                    className="absolute right-0 mt-2 top-full w-60 bg-slate-700/90 backdrop-blur-md rounded-xl shadow-2xl py-2.5 z-50 border border-slate-600/70 animate-fadeIn"
                  >
                    {/* <DropdownItem href="/profile" icon={<FiSettings size={18}/>}>โปรไฟล์ของฉัน</DropdownItem> */}
                    <DropdownItem href="/favorites" icon={<FiHeart size={18} className="text-pink-400"/>}>สเปคโปรดของฉัน</DropdownItem>
                    <div className="my-1.5 h-px bg-slate-600 mx-2"></div>
                    <DropdownItem onClick={handleLogout} icon={<FiLogOut size={18} className="text-rose-400"/>} className="text-rose-300 hover:bg-rose-500/40 hover:text-white">
                      ออกจากระบบ
                    </DropdownItem>
                  </div>
                )}
              </div>
              // --- สิ้นสุดโครงสร้างใหม่ ---
            ) : (
              <>
                <Link href="/login" className="text-slate-300 bg-slate-700/80 hover:bg-sky-500 hover:text-white px-5 py-3 rounded-lg text-base font-medium transition-colors flex items-center shadow-sm hover:shadow-md">
                  <FiLogIn className="mr-2" /> เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white px-6 py-3 rounded-lg text-base font-semibold transition-all shadow-md hover:shadow-lg flex items-center">
                  <FiUserPlus className="mr-2" /> สมัครสมาชิก
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMobileMenu} className="text-slate-300 hover:text-white focus:outline-none p-2.5 rounded-lg" aria-expanded={isMobileMenuOpen} aria-controls="mobile-menu-panel">
              <span className="sr-only">เปิดเมนูหลัก</span>
              {isMobileMenuOpen ? <FiX size={30} /> : <FiMenu size={30} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel (Dropdown) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-800 shadow-2xl border-t border-slate-700 animate-slideDown" id="mobile-menu-panel">
          <div className="px-4 pt-4 pb-3 space-y-2">
            <MobileNavLink href="/" icon={<FiHome size={22}/>}>หน้าหลัก</MobileNavLink>
            {isAuthenticated && (
              <MobileNavLink href="/favorites" icon={<FiHeart size={22} className="text-pink-400"/>}>สเปคโปรดของฉัน</MobileNavLink>
            )}
          </div>
          <div className="pt-4 pb-4 border-t border-slate-700">
            {authLoading ? ( <div className="px-4 text-slate-400 text-sm">กำลังโหลด...</div> )
             : isAuthenticated && user ? (
              <div className="px-4 space-y-3">
                <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-sky-500 p-2.5 rounded-full"><FiUser className="text-white" size={22}/></div>
                    <span className="text-lg font-medium text-white">{user.username}</span>
                </div>
                <button onClick={handleLogout} className="w-full text-left bg-red-500/90 hover:bg-red-600 text-white block px-4 py-3.5 rounded-lg text-base font-medium transition-colors flex items-center">
                  <FiLogOut className="mr-2"/> ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block text-center text-slate-100 bg-sky-500 hover:bg-sky-600 px-4 py-3.5 rounded-lg text-base font-medium transition-colors">เข้าสู่ระบบ</Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block text-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-3.5 rounded-lg text-base font-medium transition-colors">สมัครสมาชิก</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}