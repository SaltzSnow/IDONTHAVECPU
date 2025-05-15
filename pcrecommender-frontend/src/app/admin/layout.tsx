// src/app/admin/layout.tsx
"use client";

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext'; 
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiUsers, FiHeart, FiGrid, FiLogOut, FiShield, FiLoader } from 'react-icons/fi'; 
import Swal from 'sweetalert2'; 
import 'sweetalert2/dist/sweetalert2.min.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authIsLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authIsLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin'); 
      } else if (user && !user.is_staff && !user.is_superuser) {
        Swal.fire({ title: 'ไม่ได้รับอนุญาต', text: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', icon: 'error' });
        router.replace('/'); 
      }
    }
  }, [isAuthenticated, user, authIsLoading, router]);

  if (authIsLoading || !isAuthenticated || (user && !user.is_staff && !user.is_superuser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <FiLoader className="animate-spin text-sky-500" size={64} />
        {(!authIsLoading && isAuthenticated && user && !user.is_staff && !user.is_superuser) && (
            <p className="ml-4 text-xl text-red-400">คุณไม่ได้รับอนุญาตให้เข้าถึงส่วนนี้</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 p-6 space-y-6 border-r border-slate-700 flex flex-col shadow-lg">
        <div className="text-center mb-4">
          <Link href="/admin" className="text-2xl font-bold text-sky-400 flex items-center justify-center">
            <FiShield className="mr-2" /> Admin Panel
          </Link>
        </div>
        <nav className="flex-grow space-y-3">
          <AdminNavLink href="/admin" icon={<FiGrid />}>ภาพรวม</AdminNavLink>
          <AdminNavLink href="/admin/users" icon={<FiUsers />}>จัดการผู้ใช้งาน</AdminNavLink>
          <AdminNavLink href="/admin/saved-specs" icon={<FiHeart />}>จัดการสเปคที่บันทึก</AdminNavLink>
          {/* <AdminNavLink href="/admin/settings" icon={<FiSettings />}>ตั้งค่าระบบ</AdminNavLink> */}
        </nav>
        <div className="mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center py-2.5 px-4 bg-red-600/80 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <FiLogOut className="mr-2" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}

const AdminNavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode; }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href)); 
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-150 ease-in-out
        ${isActive
          ? 'bg-sky-500 text-white shadow-md scale-105'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
    >
      {icon && <span className="flex-shrink-0 w-6 h-6">{icon}</span>}
      <span className="text-base font-medium">{children}</span>
    </Link>
  );
};