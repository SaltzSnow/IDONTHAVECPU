// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; 
import { usePathname } from 'next/navigation'; 
import { useState, useEffect, useRef } from 'react';
import {
  FiLogIn, FiLogOut, FiUserPlus, FiCpu,
  FiHeart, FiUser, FiMenu, FiX, FiHome, FiChevronDown, FiShield,
  FiSettings 
} from 'react-icons/fi';
import type { User } from '@/lib/types'; 

export default function Navbar() {
  const { isAuthenticated, user, logout, isLoading: authIsLoading } = useAuth();
  const pathname = usePathname(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null); 

  const handleLogout = () => { 
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    logout(); 
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

  // ปิด User Dropdown เมื่อคลิกนอก Dropdown
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


  // Component ย่อยสำหรับ Navigation Link ใน Navbar หลัก (Desktop)
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

  // Component ย่อยสำหรับ Navigation Link ใน Mobile Menu
  const MobileNavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) => (
    <Link
      href={href}
      onClick={() => setIsMobileMenuOpen(false)} 
      className={`block px-4 py-3.5 rounded-lg text-lg font-medium transition-colors duration-150 ease-in-out flex items-center
        ${pathname === href
          ? 'bg-sky-600 text-white shadow-inner' 
          : 'text-slate-100 hover:bg-slate-700 hover:text-white'
        }`}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </Link>
  );

  // Component ย่อยสำหรับ Item ใน User Dropdown (Desktop)
  const DropdownItem = ({ href, children, icon, onClick, className }: { href?: string; children: React.ReactNode; icon?: React.ReactNode; onClick?: () => void; className?: string }) => {
    const baseClasses = "w-full text-left flex items-center px-4 py-3 text-base rounded-lg transition-colors duration-150 ease-in-out"; // เพิ่ม text-base
    const activeClasses = className || 'text-slate-100 hover:bg-slate-600 hover:text-white'; 

    const content = (
      <>
        {icon && <span className="mr-3 opacity-90">{icon}</span>} 
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
      <button type="button" onClick={() => { if (onClick) onClick(); setIsUserDropdownOpen(false); }} className={`${baseClasses} ${activeClasses}`}>
        {content}
      </button>
    );
  };

  // ตรวจสอบว่าเป็น Admin หรือไม่ (user object ต้องมี is_staff หรือ is_superuser)
  const isAdmin = user && (user.is_staff || user.is_superuser);

  return (
    <nav className="sticky top-0 z-[100] bg-slate-800/80 backdrop-blur-xl shadow-2xl border-b border-slate-700/60"> {/* เพิ่ม z-index ให้สูงมาก */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo / Brand Name */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 hover:opacity-80 transition-opacity flex items-center">
              <FiCpu className="mr-2.5 mb-1" /> I DON&apos;T HAVE CPU
            </Link>
          </div>

          {/* Auth Links / User Info (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {authIsLoading ? (
              <div className="text-slate-400 text-base animate-pulse">กำลังโหลด...</div>
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userDropdownRef}> {/* Parent ของ Dropdown */}
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center text-slate-100 hover:text-white transition-colors p-3 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                  aria-expanded={isUserDropdownOpen}
                  aria-controls="user-dropdown-panel"
                >
                  <FiUser className="mr-2.5 text-sky-400" size={26} /> {/* ไอคอนใหญ่ขึ้น */}
                  <span className="font-semibold text-lg lg:text-xl">{user.username}</span> {/* ชื่อ User ใหญ่ขึ้น */}
                  <FiChevronDown size={22} className={`ml-2 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Panel */}
                {isUserDropdownOpen && (
                  <div
                    id="user-dropdown-panel"
                    className="absolute right-0 mt-2.5 top-full w-64 bg-slate-700/95 backdrop-blur-lg rounded-xl shadow-2xl py-3 z-50 border border-slate-600/80 animate-fadeIn" // ปรับ styling
                  >
                    {isAdmin && ( // แสดง Link ไป Admin Dashboard ถ้าเป็น Admin
                      <>
                        <DropdownItem href="/admin" icon={<FiShield size={20} className="text-amber-400"/>} className="text-amber-300 hover:bg-slate-600 hover:text-amber-200 font-medium">
                          หน้า Admin Panel
                        </DropdownItem>
                        <div className="my-2 h-px bg-slate-600 mx-3"></div> {/* Divider */}
                      </>
                    )}
                    <DropdownItem href="/favorites" icon={<FiHeart size={20} className="text-pink-400"/>}>สเปคโปรดของฉัน</DropdownItem>
                    {/* <DropdownItem href="/profile" icon={<FiSettings size={20}/>}>ตั้งค่าโปรไฟล์</DropdownItem> */}
                    <div className="my-2 h-px bg-slate-600 mx-3"></div> {/* Divider */}
                    <DropdownItem onClick={handleLogout} icon={<FiLogOut size={20} className="text-rose-400"/>} className="text-rose-300 hover:bg-rose-500/50 hover:text-white font-medium">
                      ออกจากระบบ
                    </DropdownItem>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-slate-200 bg-slate-700/80 hover:bg-sky-500 hover:text-white px-6 py-3 rounded-xl text-base font-medium transition-colors flex items-center shadow-md hover:shadow-lg">
                  <FiLogIn className="mr-2" /> เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white px-6 py-3 rounded-xl text-base font-semibold transition-all shadow-md hover:shadow-lg flex items-center">
                  <FiUserPlus className="mr-2" /> สมัครสมาชิก
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMobileMenu} className="text-slate-200 hover:text-white focus:outline-none p-2.5 rounded-lg hover:bg-slate-700" aria-expanded={isMobileMenuOpen} aria-controls="mobile-menu-panel">
              <span className="sr-only">เปิดเมนูหลัก</span>
              {isMobileMenuOpen ? <FiX size={32} /> : <FiMenu size={32} />} {/* ไอคอนใหญ่ขึ้น */}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-800 shadow-2xl border-t border-slate-700 animate-slideDown" id="mobile-menu-panel">
          <div className="px-4 pt-4 pb-3 space-y-2.5">
            <MobileNavLink href="/" icon={<FiHome size={24}/>}>หน้าหลัก</MobileNavLink>
            {isAuthenticated && (
              <MobileNavLink href="/favorites" icon={<FiHeart size={24} className="text-pink-400"/>}>สเปคโปรดของฉัน</MobileNavLink>
            )}
            {isAuthenticated && isAdmin && ( // แสดง Link Admin ใน Mobile Menu ด้วย
                <MobileNavLink href="/admin" icon={<FiShield size={24} className="text-amber-400"/>}>หน้า Admin Panel</MobileNavLink>
            )}
            {/* {isAuthenticated && user && ( <MobileNavLink href="/profile" icon={<FiUser size={24}/>}>โปรไฟล์</MobileNavLink> )} */}
          </div>
          {/* Auth Section ใน Mobile Menu */}
          <div className="py-4 border-t border-slate-700">
            {authIsLoading ? ( <div className="px-4 text-slate-400">กำลังโหลด...</div> )
             : isAuthenticated && user ? (
              <div className="px-4 space-y-3">
                <div className="flex items-center space-x-3 mb-3 text-white">
                    <div className="bg-sky-500 p-3 rounded-full"><FiUser size={24}/></div>
                    <span className="text-lg font-semibold">{user.username}</span>
                </div>
                <button onClick={handleLogout} className="w-full text-left bg-red-600/90 hover:bg-red-700 text-white block px-4 py-3.5 rounded-lg text-base font-medium transition-colors flex items-center">
                  <FiLogOut className="mr-2.5"/> ออกจากระบบ
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