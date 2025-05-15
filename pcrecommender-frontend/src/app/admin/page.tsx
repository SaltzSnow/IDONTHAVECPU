// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from 'react';
import apiClient from '@/services/api'; 
import { useAuth } from '@/contexts/AuthContext'; 
import { FiUsers, FiHeart, FiActivity, FiBarChart2, FiLoader, FiAlertCircle, FiDatabase, FiGrid, FiSliders } from 'react-icons/fi';
import Link from 'next/link';

interface AdminStats {
  total_users?: number; 
  total_saved_specs?: number;
  recommendations_today?: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<AdminStats>('/admin/stats/'); 
        setStats(response.data);
      } catch (err: any) {
        console.error("Failed to fetch admin stats:", err.response?.data || err.message);
        setError("ไม่สามารถโหลดข้อมูลสถิติได้ โปรดลองอีกครั้ง");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCardClass = "bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700/80 hover:border-sky-500/70 transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer group";
  const statValueClass = "text-4xl md:text-5xl font-bold text-sky-300 mt-2 mb-1 group-hover:text-sky-200 transition-colors";
  const statLabelClass = "text-base text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors";
  const iconWrapperClass = "p-3 bg-slate-700/50 rounded-full inline-block mb-3 group-hover:bg-sky-500/20 transition-colors";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <FiLoader className="animate-spin text-sky-500" size={56} />
        <p className="mt-4 text-xl text-slate-300">กำลังโหลดข้อมูลภาพรวม...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/50 border border-red-700/70 text-red-300 rounded-xl flex items-center space-x-3 shadow-lg">
        <FiAlertCircle className="text-red-400" size={32} />
        <div>
          <h3 className="font-semibold text-red-200 text-lg">เกิดข้อผิดพลาด</h3>
          <p className="text-base">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-100 animate-fadeIn"> {/* เพิ่ม animation */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-sky-300 mb-10">
        ภาพรวมระบบ (Hello, {user?.username})
      </h1>

      {/* Section สถิติ */}
      <section className="mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <div className={statCardClass}>
            <div className={iconWrapperClass}><FiUsers size={32} className="text-purple-400 transition-colors group-hover:text-purple-300" /></div>
            <p className={statValueClass}>{stats?.total_users?.toLocaleString() ?? 'N/A'}</p>
            <p className={statLabelClass}>ผู้ใช้งานทั้งหมด</p>
          </div>
          <div className={statCardClass}>
            <div className={iconWrapperClass}><FiDatabase size={32} className="text-pink-400 transition-colors group-hover:text-pink-300" /></div>
            <p className={statValueClass}>{stats?.total_saved_specs?.toLocaleString() ?? 'N/A'}</p>
            <p className={statLabelClass}>สเปคที่ถูกบันทึก</p>
          </div>
          <div className={statCardClass}>
            <div className={iconWrapperClass}><FiActivity size={32} className="text-green-400 transition-colors group-hover:text-green-300" /></div>
            <p className={statValueClass}>{stats?.recommendations_today?.toLocaleString() ?? '0'}</p>
            <p className={statLabelClass}>คำขอแนะนำสเปค (วันนี้)</p>
          </div>
        </div>
      </section>

      {/* Section Quick Links / Management Areas */}
      <section>
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-8 flex items-center">
          <FiGrid className="mr-4 text-amber-400" />ส่วนการจัดการหลัก
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <Link href="/admin/users" className={`${statCardClass} flex flex-col items-center text-center p-8`}>
            <FiUsers size={48} className="text-purple-400 mb-4 group-hover:scale-110 transition-transform"/>
            <h3 className="text-xl font-semibold text-slate-100 group-hover:text-sky-300 transition-colors mb-1">จัดการผู้ใช้งาน</h3>
            <p className="text-sm text-slate-400">ดู, แก้ไข, หรือลบข้อมูลผู้ใช้งาน</p>
          </Link>
          <Link href="/admin/saved-specs" className={`${statCardClass} flex flex-col items-center text-center p-8`}>
            <FiDatabase size={48} className="text-pink-400 mb-4 group-hover:scale-110 transition-transform"/>
            <h3 className="text-xl font-semibold text-slate-100 group-hover:text-sky-300 transition-colors mb-1">จัดการสเปคที่บันทึก</h3>
            <p className="text-sm text-slate-400 mt-1">ตรวจสอบและจัดการสเปคที่ผู้ใช้บันทึกไว้</p>
          </Link>
        </div>
      </section>
    </div>
  );
}