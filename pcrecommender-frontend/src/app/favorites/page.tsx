// src/app/favorites/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiHeart, FiTrash2, FiInfo, FiLoader, FiAlertCircle,
  FiEdit3, FiPlusCircle, FiChevronDown, FiChevronUp, FiSave, FiXCircle, FiCheckCircle
} from 'react-icons/fi'; 
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css'; 
import type { SavedSpec, ComponentDetail } from '@/lib/types';

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

export default function FavoritesPage() {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<SavedSpec[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null); 

  // State for editing notes
  const [editingNotesSpecId, setEditingNotesSpecId] = useState<number | null>(null);
  const [currentNotes, setCurrentNotes] = useState<string>('');

  // State for editing spec name
  const [editingSpecNameId, setEditingSpecNameId] = useState<number | null>(null);
  const [currentSpecName, setCurrentSpecName] = useState<string>('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // State for expanding build details
  const [expandedBuildDetails, setExpandedBuildDetails] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authIsLoading && !isAuthenticated) {
      router.replace('/login?redirect=/favorites');
    }
  }, [isAuthenticated, authIsLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchFavorites = async () => {
        setIsLoadingData(true);
        setPageError(null);
        try {
          const { data } = await apiClient.get<SavedSpec[]>('/saved-specs/');
          setFavorites(data);
        } catch (err: any) {
          setPageError(err.response?.data?.detail || 'ไม่สามารถโหลดรายการสเปคโปรดได้');
          console.error("Fetch Favorites Error:", err.response || err);
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchFavorites();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (editingSpecNameId !== null && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingSpecNameId]);


  const handleDelete = async (id: number, buildName?: string | null) => {
    Swal.fire({
      title: 'ยืนยันการลบ',
      html: `คุณแน่ใจหรือไม่ว่าต้องการลบสเปค "<strong>${buildName || 'ที่บันทึกไว้'}</strong>"?<br/>การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#EF4444', 
      cancelButtonColor: '#6B7280',  
      background: '#1f2937', 
      color: '#e5e7eb', 
      customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300 text-xl md:text-2xl', htmlContainer: 'text-slate-300 text-base', confirmButton: 'px-5 py-2.5 text-base', cancelButton: 'px-5 py-2.5 text-base'}
    }).then(async (result) => {
      if (result.isConfirmed) {
        setPageError(null);
        try {
          await apiClient.delete(`/saved-specs/${id}/`);
          setFavorites(prev => prev.filter(fav => fav.id !== id));
          Swal.fire({ title: 'ลบสำเร็จ!', text: `สเปค "${buildName || 'ที่เลือก'}" ถูกลบแล้ว`, icon: 'success', confirmButtonText: 'ตกลง', confirmButtonColor: '#10B981', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-green-300', htmlContainer: 'text-slate-300'} });
        } catch (err: any) {
          const deleteError = err.response?.data?.detail || 'ไม่สามารถลบสเปคโปรดได้';
          Swal.fire({ title: 'เกิดข้อผิดพลาด', text: deleteError, icon: 'error', confirmButtonColor: '#EF4444', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'} });
        }
      }
    });
  };

  const handleStartEditNotes = (spec: SavedSpec) => {
    setEditingNotesSpecId(spec.id);
    setCurrentNotes(spec.user_notes || '');
    setEditingSpecNameId(null); 
  };

  const handleSaveNotes = async (specId: number) => {
    setPageError(null);
    try {
      const { data: updatedSpec } = await apiClient.patch<SavedSpec>(`/saved-specs/${specId}/`, {
        user_notes: currentNotes,
      });
      setFavorites(prev => prev.map(fav => fav.id === specId ? updatedSpec : fav));
      setEditingNotesSpecId(null);
      Swal.fire({ icon: 'success', title: 'บันทึกโน้ตสำเร็จ', showConfirmButton: false, timer: 1500, background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-green-300'} });
    } catch (err:any) {
      const saveNotesError = err.response?.data?.detail || err.response?.data?.user_notes?.[0] || 'ไม่สามารถอัปเดตโน้ตได้';
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: saveNotesError, icon: 'error', confirmButtonColor: '#EF4444', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'} });
    }
  };

  const handleStartEditSpecName = (spec: SavedSpec) => {
    setEditingSpecNameId(spec.id);
    setCurrentSpecName(spec.name || `สเปค ${new Date(spec.saved_at).toLocaleDateString('th-TH', { day:'2-digit', month:'short' })}`);
    setEditingNotesSpecId(null); 
  };

  const handleSaveSpecName = async (specId: number) => {
    if (!currentSpecName.trim()) {
      Swal.fire({ icon: 'error', title: 'ชื่อสเปคห้ามว่าง', text: 'กรุณาใส่ชื่อสำหรับสเปคนี้', confirmButtonColor: '#EF4444', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'} });
      return;
    }
    setPageError(null);
    try {
      const { data: updatedSpec } = await apiClient.patch<SavedSpec>(`/saved-specs/${specId}/`, {
        name: currentSpecName.trim(),
      });
      setFavorites(prev => prev.map(fav => fav.id === specId ? { ...fav, name: updatedSpec.name } : fav));
      setEditingSpecNameId(null);
    } catch (err: any) {
      const saveNameError = err.response?.data?.detail || err.response?.data?.name?.[0] || 'ไม่สามารถอัปเดตชื่อสเปคได้';
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: saveNameError, icon: 'error', confirmButtonColor: '#EF4444', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'} });
    }
  };

  const toggleBuildDetails = (id: number) => {
    setExpandedBuildDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (authIsLoading) { return ( <div className="min-h-screen flex items-center justify-center bg-slate-900"> <FiLoader className="animate-spin text-sky-500" size={64}/> </div> ); }
  if (!isAuthenticated && !authIsLoading) { return <div className="min-h-screen flex items-center justify-center bg-slate-900"><p className="text-slate-400 text-xl">กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p></div>; }
  if (isLoadingData) { return ( <div className="container mx-auto py-10 text-center text-slate-300 text-xl"> <FiLoader className="animate-spin inline mr-3" size={32}/>กำลังโหลดสเปคที่คุณบันทึกไว้...</div> );}

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-14 md:mb-20">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 py-2 mb-6 sm:mb-0">
          <FiHeart className="inline-block mr-4 mb-1.5 text-pink-400" size={52}/> สเปคคอมพิวเตอร์โปรด
        </h1>
        <Link href="/" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-sky-400/30 transition-all duration-150 ease-in-out flex items-center text-lg md:text-xl">
            <FiPlusCircle className="mr-2.5" /> สร้างสเปคใหม่
        </Link>
      </div>

      {pageError && ( <div role="alert" className="mb-8 p-6 bg-red-900/50 border border-red-700/70 text-red-300 rounded-2xl flex items-start space-x-4 shadow-xl"><FiAlertCircle className="text-red-400 flex-shrink-0 mt-1" size={28} /><div><h3 className="font-semibold text-red-200 text-lg">เกิดข้อผิดพลาด</h3><p className="text-base">{pageError}</p></div></div>)}

      {favorites.length === 0 && !isLoadingData ? (
         <div className="text-center py-24 min-h-[50vh] flex flex-col justify-center items-center">
            <FiHeart size={96} className="mx-auto text-slate-600 mb-8" />
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-300 mb-4">ยังไม่มีสเปคโปรด</h2>
            <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-md">
              ดูเหมือนคุณยังไม่ได้บันทึกสเปคคอมพิวเตอร์ที่ชอบไว้เลย <br/> กลับไปหน้าแรกเพื่อรับคำแนะนำจาก AI ได้เลย!
            </p>
            <Link href="/" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white font-bold py-4 px-10 rounded-xl shadow-xl transition-transform hover:scale-105 text-xl">
                ค้นหาสเปคคอม
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-12">
          {favorites.map(fav => (
            <div key={fav.id} className="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col">
              <div className="p-7 sm:p-8 flex-grow">
                <div className="flex justify-between items-start mb-5">
                  {editingSpecNameId === fav.id ? (
                    <div className="flex-grow flex items-center space-x-2 mr-2">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={currentSpecName}
                        onChange={(e) => setCurrentSpecName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSpecName(fav.id); if (e.key === 'Escape') setEditingSpecNameId(null); }}
                        className="flex-grow bg-slate-700 text-sky-300 text-2xl lg:text-3xl font-bold p-2 rounded-lg border border-sky-500 focus:ring-2 focus:ring-sky-400 outline-none"
                      />
                      <button onClick={() => handleSaveSpecName(fav.id)} className="p-2 text-green-400 hover:text-green-300"><FiCheckCircle size={24}/></button>
                      <button onClick={() => setEditingSpecNameId(null)} className="p-2 text-slate-400 hover:text-slate-200"><FiXCircle size={24}/></button>
                    </div>
                  ) : (
                    <h3 className="text-2xl lg:text-3xl font-bold text-sky-300 hover:text-sky-200 transition-colors cursor-pointer group flex items-center" onClick={() => handleStartEditSpecName(fav)}>
                      {fav.name || `สเปคที่บันทึก ${new Date(fav.saved_at).toLocaleDateString('th-TH', {day:'2-digit', month:'short'})}`}
                      <FiEdit3 size={20} className="ml-3 text-slate-500 group-hover:text-sky-400 transition-colors opacity-70 group-hover:opacity-100"/>
                    </h3>
                  )}
                  <button
                    onClick={() => handleDelete(fav.id, fav.name)}
                    title="ลบสเปคนี้"
                    className="text-slate-500 hover:text-red-500 transition-colors p-2 -mr-1 -mt-1 rounded-full hover:bg-red-500/10 flex-shrink-0"
                  >
                    <FiTrash2 size={24} />
                  </button>
                </div>

                <button onClick={() => toggleBuildDetails(fav.id)} className="w-full text-left text-slate-300 hover:text-sky-300 py-3 px-1 mb-4 flex justify-between items-center text-base md:text-lg rounded-md hover:bg-slate-700/50 transition-colors">
                    <span>{expandedBuildDetails[fav.id] ? 'ซ่อนรายละเอียดสเปค' : 'แสดงรายละเอียดสเปค'}</span>
                    {expandedBuildDetails[fav.id] ? <FiChevronUp size={22} /> : <FiChevronDown size={22} />}
                </button>

                {expandedBuildDetails[fav.id] && (
                    <div className="mb-6 space-y-3 max-h-72 overflow-y-auto bg-slate-700/40 p-5 rounded-xl text-base scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/40 animate-fadeIn">
                        <h4 className="text-base md:text-lg font-semibold text-slate-300 uppercase mb-3">รายละเอียดสเปค:</h4>
                        {(['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'cooler', 'case'] as const).map(partKey => {
                            const component = fav.build_details[partKey];
                            return component ? <p key={partKey} className="text-slate-100 flex justify-between items-center text-base md:text-lg"><span><strong className="text-slate-400 font-medium">{partKey.toUpperCase()}:</strong> {getComponentName(component)}</span> <span className="text-sky-300/90 text-sm font-medium">{getComponentPriceString(component)}</span></p> : null;
                        })}
                        {fav.build_details.total_price_estimate_thb && <p className="text-green-300 font-semibold mt-4 pt-3 border-t border-slate-600 text-lg md:text-xl">ราคารวมประมาณ: ~฿{fav.build_details.total_price_estimate_thb.toLocaleString()}</p>}
                        {fav.build_details.notes && <p className="text-slate-300 mt-3 text-sm italic">AI Notes: {fav.build_details.notes}</p>}
                    </div>
                )}

                {fav.source_prompt_details && (
                  <div className="mb-6 bg-slate-700/20 p-4 rounded-xl text-sm">
                    <h4 className="text-sm md:text-base font-semibold text-slate-400 uppercase mb-2 flex items-center"><FiInfo size={16} className="mr-2"/>คำขอเดิม:</h4>
                    <p className="text-slate-300 text-base">งบประมาณ: {fav.source_prompt_details.budget?.toLocaleString()} {fav.source_prompt_details.currency}</p>
                    {fav.source_prompt_details.preferred_games && fav.source_prompt_details.preferred_games.length > 0 && (
                        <p className="text-slate-300 text-base">เกม: {fav.source_prompt_details.preferred_games.join(', ')}</p>
                    )}
                  </div>
                )}

                <div className="mt-auto">
                  {editingNotesSpecId === fav.id ? (
                    <div className="mt-4 space-y-2">
                      <textarea
                        value={currentNotes}
                        onChange={(e) => setCurrentNotes(e.target.value)}
                        placeholder="เพิ่มบันทึกส่วนตัวของคุณที่นี่..."
                        rows={4}
                        className="w-full p-3 bg-slate-700 border-slate-600 rounded-lg text-slate-100 text-base focus:ring-sky-500 focus:border-sky-500"
                      />
                      <div className="flex justify-end space-x-3 mt-2">
                        <button onClick={() => setEditingNotesSpecId(null)} className="text-sm text-slate-400 hover:text-white px-4 py-2 rounded-md hover:bg-slate-600 transition-colors">ยกเลิก</button>
                        <button onClick={() => handleSaveNotes(fav.id)} className="text-sm bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 rounded-md transition-colors">บันทึกโน้ต</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {fav.user_notes && (
                        <div className="my-4">
                            <h4 className="text-base font-semibold text-slate-400 mb-1.5">บันทึกของคุณ:</h4>
                            <p className="text-base text-slate-300 bg-slate-700/50 p-4 rounded-lg">{fav.user_notes}</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleStartEditNotes(fav)}
                        className="w-full text-base text-sky-400 hover:text-sky-300 flex items-center justify-center py-3 px-3 rounded-lg hover:bg-sky-500/10 transition-colors mt-2 border border-sky-500/30 hover:border-sky-500"
                      >
                        <FiEdit3 className="mr-2" /> {fav.user_notes ? 'แก้ไขบันทึก' : 'เพิ่มบันทึก'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-slate-700/40 px-6 py-3.5 text-right border-t border-slate-700">
                <p className="text-sm text-slate-200">
                  บันทึกเมื่อ: {new Date(fav.saved_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short', hour12: false })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}