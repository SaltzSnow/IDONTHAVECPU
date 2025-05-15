// src/app/admin/saved-specs/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import apiClient from '@/services/api';
import type { SavedSpec, ComponentDetail, RecommendationBuild } from '@/lib/types';
import {
  FiDatabase, FiLoader, FiAlertCircle, FiTrash2, FiSearch,
  FiChevronLeft, FiChevronRight, FiXCircle, FiCalendar, FiTag, FiEye, FiEyeOff
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const getComponentName = (component: ComponentDetail | string | undefined): string => {
  if (!component) return 'N/A';
  if (typeof component === 'string') return component;
  return component.name || 'N/A';
};

const getComponentPriceString = (component: ComponentDetail | string | undefined): string => {
    if (component && typeof component === 'object' && typeof component.price_thb === 'number') {
        return `(฿${component.price_thb.toLocaleString()})`;
    }
    return '';
};

const SPECS_PER_PAGE = 10;

export default function ManageSavedSpecsPage() {
  const [allSavedSpecs, setAllSavedSpecs] = useState<SavedSpec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({}); 

  const filteredSpecs = useMemo(() => {
    if (!searchTerm.trim()) {
      return allSavedSpecs;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allSavedSpecs.filter(spec =>
      (spec.name && spec.name.toLowerCase().includes(lowerSearchTerm)) ||
      (spec.user && typeof spec.user === 'object' && spec.user.username && spec.user.username.toLowerCase().includes(lowerSearchTerm)) || 
      (spec.user && typeof spec.user === 'string' && spec.user.toLowerCase().includes(lowerSearchTerm)) || 
      (spec.build_details.build_name && spec.build_details.build_name.toLowerCase().includes(lowerSearchTerm))
    );
  }, [allSavedSpecs, searchTerm]);

  const paginatedSpecs = useMemo(() => {
    const startIndex = (currentPage - 1) * SPECS_PER_PAGE;
    return filteredSpecs.slice(startIndex, startIndex + SPECS_PER_PAGE);
  }, [filteredSpecs, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredSpecs.length / SPECS_PER_PAGE));
  }, [filteredSpecs]);

  useEffect(() => {
    const fetchSavedSpecs = async () => {
      setIsLoading(true);
      setPageError(null);
      try {
        const response = await apiClient.get<SavedSpec[]>('/admin/saved-specs/');
        console.log(response.data)
        setAllSavedSpecs(response.data || []);
      } catch (err: any) {
        console.error("Failed to fetch saved specs:", err.response?.data || err.message);
        setPageError("ไม่สามารถโหลดข้อมูลสเปคที่บันทึกไว้ได้ โปรดลองอีกครั้ง");
        setAllSavedSpecs([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSavedSpecs();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteSpec = async (specId: number, specName?: string | null) => {
    Swal.fire({
      title: 'ยืนยันการลบสเปค',
      html: `คุณแน่ใจหรือไม่ว่าต้องการลบสเปค "<strong>${specName || `ID: ${specId}`}</strong>"?<br/>การกระทำนี้ไม่สามารถย้อนกลับได้!`,
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
          await apiClient.delete(`/admin/saved-specs/${specId}/`);
          setAllSavedSpecs(prevSpecs => prevSpecs.filter(spec => spec.id !== specId));
          if (paginatedSpecs.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
          Swal.fire({ title: 'ลบสำเร็จ!', text: `สเปค "${specName || `ID: ${specId}`}" ถูกลบแล้ว`, icon: 'success', confirmButtonColor: '#10B981', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-green-300', htmlContainer: 'text-slate-300'} });
        } catch (err: any) {
          const deleteError = err.response?.data?.detail || 'ไม่สามารถลบสเปคที่บันทึกไว้ได้';
          Swal.fire({ title: 'เกิดข้อผิดพลาด', text: deleteError, icon: 'error', confirmButtonColor: '#EF4444', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'} });
        }
      }
    });
  };

  const toggleDetails = (specId: number) => {
    setExpandedDetails(prev => ({ ...prev, [specId]: !prev[specId] }));
  };

  if (isLoading && allSavedSpecs.length === 0) {
    return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]"> <FiLoader className="animate-spin text-sky-500" size={56} /> <p className="mt-4 text-xl text-slate-300">กำลังโหลดข้อมูลสเปคที่บันทึกไว้...</p> </div> );
  }


  return (
    <div className="animate-fadeIn text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-sky-300 mb-4 sm:mb-0">
          <FiDatabase className="inline-block mr-4 mb-1 text-sky-400" />จัดการสเปคที่บันทึก ({filteredSpecs.length})
        </h1>
        {/* Optional: Add New Spec button if admin can create them (unlikely for this app) */}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="mb-8">
        <div className="relative flex-grow max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"> <FiSearch className="text-slate-400" /> </div>
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อสเปค, ชื่อผู้ใช้, หรือชื่อ Build..."
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-sky-300 uppercase tracking-wider w-16">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-sky-300 uppercase tracking-wider">ชื่อสเปค (ผู้ใช้ตั้ง)</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-sky-300 uppercase tracking-wider">ชื่อ Build (AI)</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-sky-300 uppercase tracking-wider">ผู้ใช้</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-sky-300 uppercase tracking-wider">วันที่บันทึก</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-sky-300 uppercase tracking-wider min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700/70">
            {paginatedSpecs.map(spec => (
              <tr key={spec.id} className="hover:bg-slate-700/40 transition-colors duration-150 text-base">
                <td className="px-6 py-4 whitespace-nowrap text-slate-300">{spec.id}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-white truncate max-w-xs" title={spec.name || undefined}>{spec.name || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-300 truncate max-w-xs" title={spec.build_details.build_name || undefined}>{spec.build_details.build_name || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-400">
                  {typeof spec.user === 'object' ? spec.user?.username : spec.user || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {new Date(spec.saved_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center font-medium space-x-3">
                  <button onClick={() => toggleDetails(spec.id)} title="ดูรายละเอียด" className="text-blue-400 hover:text-blue-300 p-1.5 rounded-md hover:bg-blue-500/10">
                    {expandedDetails[spec.id] ? <FiEyeOff size={20}/> : <FiEye size={20}/>}
                  </button>
                  <button onClick={() => handleDeleteSpec(spec.id, spec.name || spec.build_details.build_name)} title="ลบสเปค" className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/10"><FiTrash2 size={20}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedSpecs.length === 0 && !isLoading && (
          <p className="text-center text-slate-400 py-16 text-xl">
            {searchTerm ? "ไม่พบสเปคที่ตรงกับการค้นหาของคุณ" : "ไม่มีสเปคที่ถูกบันทึกไว้ในระบบ"}
          </p>
        )}
      </div>

      {/* Client-side Pagination Controls */}
      {totalPages > 1 && (
          <div className="mt-10 flex justify-center items-center space-x-4">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} className="px-5 py-3 bg-slate-700 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-200 rounded-lg transition-colors flex items-center text-base font-medium">
                <FiChevronLeft className="mr-2" size={20}/> ก่อนหน้า
            </button>
            <span className="text-slate-300 text-lg">
                หน้า {currentPage} <span className="text-slate-500">จาก</span> {totalPages}
            </span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isLoading} className="px-5 py-3 bg-slate-700 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-200 rounded-lg transition-colors flex items-center text-base font-medium">
                ถัดไป <FiChevronRight className="ml-2" size={20}/>
            </button>
          </div>
      )}

      {/* Modal or Section for Displaying Full Build Details when expanded (Optional) */}
      {Object.keys(expandedDetails).filter(key => expandedDetails[parseInt(key)]).map(key => {
          const specId = parseInt(key);
          const spec = allSavedSpecs.find(s => s.id === specId);
          if (!spec) return null;
          return (
            <div key={`details-${spec.id}`} className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn" onClick={() => toggleDetails(spec.id)}>
                <div className="bg-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-sky-300">{spec.name || spec.build_details.build_name || `รายละเอียดสเปค ID: ${spec.id}`}</h3>
                        <button onClick={() => toggleDetails(spec.id)} className="text-slate-400 hover:text-white"><FiXCircle size={28}/></button>
                    </div>
                    <div className="space-y-3 text-base text-slate-200">
                        {(['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'cooler', 'case'] as const).map(partKey => {
                            const component = spec.build_details[partKey];
                            return component ? <p key={partKey}><strong className="text-slate-400">{partKey.toUpperCase()}:</strong> {getComponentName(component)} <span className="text-sky-400/90 text-sm">{getComponentPriceString(component)}</span></p> : null;
                        })}
                        {spec.build_details.total_price_estimate_thb && <p className="font-semibold mt-3 pt-2 border-t border-slate-600 text-lg text-green-400">ราคารวมประมาณ: ฿{spec.build_details.total_price_estimate_thb.toLocaleString()}</p>}
                        {spec.build_details.notes && <p className="mt-2 text-sm italic text-slate-300"><strong>AI Notes:</strong> {spec.build_details.notes}</p>}
                    </div>
                     {spec.source_prompt_details && (
                        <div className="mt-6 pt-4 border-t border-slate-700 text-sm">
                            <h4 className="font-semibold text-slate-400 mb-1">คำขอเดิม:</h4>
                            <pre className="bg-slate-700/50 p-3 rounded-md text-xs text-slate-300 whitespace-pre-wrap">
                                {JSON.stringify(spec.source_prompt_details, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
          )
      })}

    </div>
  );
}