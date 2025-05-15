// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import apiClient from '@/services/api';
import type { User } from '@/lib/types'; 
import {
  FiUsers, FiLoader, FiAlertCircle, FiTrash2,
  FiSearch, FiChevronLeft, FiChevronRight, FiUserCheck, FiUserX,
} from 'react-icons/fi';
import Swal from 'sweetalert2';

interface AdminUser extends User {
  is_staff?: boolean;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string | null;
}

const USERS_PER_PAGE = 10; 

export default function ManageUsersPage() {
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return allUsers;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allUsers.filter(user =>
      user.username.toLowerCase().includes(lowerSearchTerm) ||
      (user.email && user.email.toLowerCase().includes(lowerSearchTerm))
    );
  }, [allUsers, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  }, [filteredUsers]);

  const fetchAllUsers = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const response = await apiClient.get<AdminUser[]>('/admin/users/');
      setAllUsers(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch users:", err.response?.data || err.message);
      setPageError("ไม่สามารถโหลดข้อมูลผู้ใช้งานได้ โปรดลองอีกครั้ง");
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers(); 
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); 
  };

  const handleToggleUserStatus = async (userId: number, username: string, field: 'is_active' | 'is_staff', currentStatus: boolean) => {
    const actionText = currentStatus
      ? (field === 'is_active' ? 'ปิดการใช้งาน (Deactivate)' : 'ยกเลิกสิทธิ์ Staff')
      : (field === 'is_active' ? 'เปิดการใช้งาน (Activate)' : 'ให้สิทธิ์ Staff');
    const fieldText = field === 'is_active' ? 'Active' : 'Staff';

    Swal.fire({
      title: `ยืนยันการเปลี่ยนสถานะ "${fieldText}"`,
      html: `คุณต้องการ <strong>${actionText}</strong> ผู้ใช้ "<strong>${username}</strong>" หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: currentStatus ? '#EF4444' : '#10B981', 
      cancelButtonColor: '#6B7280', 
      background: '#1f2937', 
      color: '#e5e7eb',     
      customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-xl md:text-2xl text-sky-300', htmlContainer: 'text-slate-300 text-base', confirmButton: 'px-5 py-2.5 text-base', cancelButton: 'px-5 py-2.5 text-base' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiClient.patch(`/admin/users/${userId}/`, { [field]: !currentStatus });
          setAllUsers(prevUsers =>
            prevUsers.map(u => ((u.id || u.pk) === userId ? { ...u, [field]: !currentStatus } : u))
          );
          Swal.fire({icon: 'success', title: 'สำเร็จ!', text: `สถานะ ${fieldText} ของผู้ใช้ "${username}" ถูกอัปเดตแล้ว`, confirmButtonColor: '#10B981', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-green-300', htmlContainer: 'text-slate-300'} });
        } catch (err: any) {
            const updateError = err.response?.data?.[field]?.[0] || err.response?.data?.detail || `ไม่สามารถอัปเดตสถานะ ${fieldText} ได้`;
            Swal.fire({icon: 'error', title: 'เกิดข้อผิดพลาด', text: updateError, confirmButtonColor: '#EF4444', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'} });
        }
      }
    });
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    Swal.fire({
      title: 'ยืนยันการลบผู้ใช้',
      html: `คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "<strong>${username}</strong>"?<br/>การกระทำนี้จะลบข้อมูลผู้ใช้และข้อมูลที่เกี่ยวข้องทั้งหมด และไม่สามารถย้อนกลับได้!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      background: '#1f2937', color: '#e5e7eb',
      customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300 text-xl md:text-2xl', htmlContainer: 'text-slate-300 text-base leading-relaxed', confirmButton: 'px-5 py-2.5 text-base font-semibold', cancelButton: 'px-5 py-2.5 text-base font-semibold' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        setPageError(null);
        try {
          await apiClient.delete(`/admin/users/${userId}/`);
          setAllUsers(prevUsers => prevUsers.filter(u => (u.id !== userId && u.pk !== userId)));
          if (paginatedUsers.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
          Swal.fire({ title: 'ลบสำเร็จ!', text: `ผู้ใช้ "${username}" ถูกลบออกจากระบบแล้ว`, icon: 'success', confirmButtonText: 'ตกลง', confirmButtonColor: '#10B981', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-green-300', htmlContainer: 'text-slate-300'} });
        } catch (err: any) {
          const deleteError = err.response?.data?.detail || 'ไม่สามารถลบผู้ใช้ได้ โปรดลองอีกครั้ง';
          Swal.fire({ title: 'เกิดข้อผิดพลาด', text: deleteError, icon: 'error', confirmButtonColor: '#EF4444', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'} });
        }
      }
    });
  };


  if (isLoading && allUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
        <FiLoader className="animate-spin text-sky-500" size={56} />
        <p className="mt-4 text-xl text-slate-300">กำลังโหลดข้อมูลผู้ใช้งาน...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-sky-300 mb-4 sm:mb-0">
          <FiUsers className="inline-block mr-4 mb-1 text-sky-400" />จัดการผู้ใช้งาน ({filteredUsers.length})
        </h1>
        {/* ปุ่ม "เพิ่มผู้ใช้ใหม่" สามารถเพิ่มได้ที่นี่ถ้าต้องการ */}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); /* Search is live via useEffect */ }} className="mb-8">
        <div className="relative flex-grow max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อผู้ใช้ หรือ อีเมล..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full p-3.5 pl-12 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-base"
            />
        </div>
      </form>

      {pageError && !isLoading && (
        <div role="alert" className="mb-6 p-5 bg-red-900/50 border border-red-700/70 text-red-300 rounded-xl flex items-start space-x-3 shadow-lg">
          <FiAlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
          <div><h3 className="font-semibold text-red-200 text-lg">เกิดข้อผิดพลาด</h3><p className="text-base">{pageError}</p></div>
        </div>
      )}

      <div className="bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-xl overflow-x-auto border border-slate-700/70">
        <table className="min-w-full table-auto">
          <thead className="bg-slate-700/60">
            <tr>
              <th className="px-6 py-4 text-left text-base font-semibold text-sky-300 uppercase tracking-wider w-20">ID</th>
              <th className="px-6 py-4 text-left text-base font-semibold text-sky-300 uppercase tracking-wider">ชื่อผู้ใช้</th>
              <th className="px-6 py-4 text-left text-base font-semibold text-sky-300 uppercase tracking-wider">อีเมล</th>
              <th className="px-6 py-4 text-center text-base font-semibold text-sky-300 uppercase tracking-wider">Staff</th>
              <th className="px-6 py-4 text-center text-base font-semibold text-sky-300 uppercase tracking-wider">Active</th>
              <th className="px-6 py-4 text-left text-base font-semibold text-sky-300 uppercase tracking-wider">วันที่เข้าร่วม</th>
              <th className="px-6 py-4 text-center text-base font-semibold text-sky-300 uppercase tracking-wider min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700/70">
            {paginatedUsers.map(user => (
              <tr key={user.id || user.pk} className="hover:bg-slate-700/40 transition-colors duration-150 text-base">
                <td className="px-6 py-4 whitespace-nowrap text-slate-300">{user.id || user.pk}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-300 truncate max-w-xs">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => handleToggleUserStatus((user.id || user.pk)!, user.username, 'is_staff', !!user.is_staff)}
                    className={`p-2 rounded-lg transition-all duration-150 ${user.is_staff ? 'bg-green-500/80 hover:bg-green-600 shadow-md' : 'bg-slate-600 hover:bg-slate-500'}`}
                    title={user.is_staff ? "คลิกเพื่อยกเลิกสิทธิ์ Staff" : "คลิกเพื่อให้สิทธิ์ Staff"}
                  >
                    {user.is_staff ? <FiUserCheck className="text-white" size={20}/> : <FiUserX className="text-slate-300" size={20}/>}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                   <button
                    onClick={() => handleToggleUserStatus((user.id || user.pk)!, user.username, 'is_active', !!user.is_active)}
                    className={`p-2 rounded-lg transition-all duration-150 ${user.is_active ? 'bg-green-500/80 hover:bg-green-600 shadow-md' : 'bg-red-500/80 hover:bg-red-600 shadow-md'}`}
                    title={user.is_active ? "คลิกเพื่อ Deactivate User" : "คลิกเพื่อ Activate User"}
                  >
                    {user.is_active ? <FiUserCheck className="text-white" size={20}/> : <FiUserX className="text-white" size={20}/>}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                  {user.date_joined ? new Date(user.date_joined).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit'}) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center font-medium space-x-3">
                  {/* <button title="แก้ไขผู้ใช้" className="text-sky-400 hover:text-sky-300 p-1.5 rounded-md hover:bg-sky-500/10"><FiEdit size={20}/></button> */}
                  <button onClick={() => handleDeleteUser((user.id || user.pk)!, user.username)} title="ลบผู้ใช้" className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/20 transition-colors"><FiTrash2 size={20}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedUsers.length === 0 && !isLoading && (
          <p className="text-center text-slate-400 py-16 text-xl"> {/* เพิ่ม padding และขนาด */}
            {searchTerm ? "ไม่พบผู้ใช้งานที่ตรงกับการค้นหาของคุณ" : "ไม่มีข้อมูลผู้ใช้งานในระบบ"}
          </p>
        )}
      </div>

      {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center space-x-4"> {/* เพิ่ม margin top และ space */}
            <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-5 py-3 bg-slate-700 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-200 rounded-lg transition-colors flex items-center text-base font-medium"
            >
                <FiChevronLeft className="mr-2" size={20}/> ก่อนหน้า
            </button>
            <span className="text-slate-300 text-lg">
                หน้า {currentPage} <span className="text-slate-500">จาก</span> {totalPages}
            </span>
            <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="px-5 py-3 bg-slate-700 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-200 rounded-lg transition-colors flex items-center text-base font-medium"
            >
                ถัดไป <FiChevronRight className="ml-2" size={20}/>
            </button>
          </div>
      )}
    </div>
  );
}