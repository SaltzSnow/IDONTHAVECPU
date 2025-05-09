// src/app/page.tsx
"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import apiClient from "@/services/api"; // Axios client จาก src/services/api.ts
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from 'next/navigation';
import {
  FiSearch,
  FiSave,
  FiLoader,
  FiAlertCircle,
  FiInfo,
  FiHelpCircle,
  FiChevronUp,
  FiCpu
} from "react-icons/fi";
import { IoSparkles } from "react-icons/io5";
import Swal from 'sweetalert2'; // Import SweetAlert2
import 'sweetalert2/dist/sweetalert2.min.css'; // หรือ SCSS theme ของคุณ
import type {
  RecommendationBuild,
  RecommendationApiResponse,
  SourcePrompt,
  ComponentDetail,
} from "@/lib/types"; // Import types

interface FormData {
  budget: string;
  currency: string;
  desired_cpu: string;
  desired_gpu: string;
  desired_ram: string;
  storage_type: string;
  storage_size: string;
  motherboard_chipset: string;
  psu_wattage: string;
  preferred_games: string;
}

// Interface สำหรับ State ของ Explanation แต่ละ Build
interface ExplanationState {
  text: string | null;
  isLoading: boolean;
  error: string | null; // คาดหวัง string หรือ null
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    budget: "",
    currency: "THB",
    desired_cpu: "",
    desired_gpu: "",
    desired_ram: "",
    storage_type: "",
    storage_size: "",
    motherboard_chipset: "",
    psu_wattage: "",
    preferred_games: "",
  });
  const [recommendations, setRecommendations] = useState<RecommendationBuild[]>([]);
  const [sourcePromptForSaving, setSourcePromptForSaving] = useState<SourcePrompt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [buildExplanations, setBuildExplanations] = useState<Record<string, ExplanationState>>({});
  const [openExplanationKeys, setOpenExplanationKeys] = useState<Record<string, boolean>>({});

  const resultsSectionRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setRecommendations([]);
    setSourcePromptForSaving(null);
    setBuildExplanations({});
    setOpenExplanationKeys({});

    const payload: any = { // ใช้ any ชั่วคราว หรือสร้าง Interface ใหม่ที่รองรับ flat structure
      budget: parseFloat(formData.budget) || 0,
      currency: formData.currency,
      preferred_games: formData.preferred_games
        .split(",")
        .map((game) => game.trim())
        .filter((game) => game),
    };

    if (formData.desired_cpu) payload.desired_cpu = formData.desired_cpu;
    if (formData.desired_gpu) payload.desired_gpu = formData.desired_gpu;
    if (formData.desired_ram) payload.desired_ram = formData.desired_ram;
    if (formData.storage_type) payload.storage_type = formData.storage_type;
    if (formData.storage_size) payload.storage_size = formData.storage_size;
    if (formData.motherboard_chipset) payload.motherboard_chipset = formData.motherboard_chipset;
    if (formData.psu_wattage) payload.psu_wattage = formData.psu_wattage;

    try {
      const response = await apiClient.post<RecommendationApiResponse>("/recommend-specs/", payload);
      const responseData = response.data;
      if (responseData.error) {
        // setError(responseData.error); // ไม่ set error ของ page โดยตรงแล้ว
        Swal.fire({
          icon: 'error',
          title: 'AI เกิดข้อผิดพลาด',
          html: `ไม่สามารถสร้างคำแนะนำสเปคได้: <br/><strong>${responseData.error}</strong><br/>${responseData.raw_ai_output_on_error ? '<details class="mt-2 text-xs text-left"><summary>รายละเอียดทางเทคนิค</summary><pre class="bg-slate-700 p-2 rounded mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all">'+JSON.stringify(responseData.raw_ai_output_on_error, null, 2)+'</pre></details>' : ''}`,
          showDenyButton: true,
          confirmButtonText: 'ตกลง',
          denyButtonText: 'ลองอีกครั้ง',
          confirmButtonColor: '#64748b', // Slate-500
          denyButtonColor: '#0ea5e9',   // Sky-500
          background: '#1f2937', color: '#e5e7eb',
          customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'}
        }).then((result) => {
          if (result.isDenied) { // ถ้ากด "ลองอีกครั้ง"
            handleSubmit(); // เรียก handleSubmit ใหม่ด้วยข้อมูลเดิม
          }
        });
      } else if (responseData.recommendations) {
        setRecommendations(responseData.recommendations);
        setSourcePromptForSaving(responseData.source_prompt_for_saving || null);
        if (responseData.recommendations.length === 0) {
          // setError("AI ไม่พบสเปคที่เหมาะสม ลองปรับเงื่อนไขดูใหม่นะคะ"); // เปลี่ยนไปใช้ Swal
          Swal.fire({
            icon: 'info',
            title: 'ไม่พบสเปคที่ตรงเงื่อนไข',
            text: 'AI ไม่พบสเปคที่เหมาะสมกับเงื่อนไขที่คุณระบุ ลองปรับเปลี่ยนข้อมูลในฟอร์มแล้วลองใหม่อีกครั้งนะคะ',
            confirmButtonText: 'เข้าใจแล้ว',
            confirmButtonColor: '#0ea5e9', background: '#1f2937', color: '#e5e7eb',
            customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-sky-300', htmlContainer: 'text-slate-300'}
          });
        } else {
           setTimeout(() => {
            resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      } else {
        // setError("ไม่สามารถรับข้อมูลสเปคจากเซิร์ฟเวอร์ได้ โปรดลองอีกครั้ง"); // เปลี่ยนไปใช้ Swal
        Swal.fire({
          icon: 'error', title: 'การตอบกลับไม่ถูกต้อง', text: 'ไม่สามารถรับข้อมูลสเปคจากเซิร์ฟเวอร์ได้อย่างถูกต้อง โปรดลองอีกครั้ง',
          showDenyButton: true, confirmButtonText: 'ตกลง', denyButtonText: 'ลองอีกครั้ง',
          confirmButtonColor: '#64748b', denyButtonColor: '#0ea5e9', background: '#1f2937', color: '#e5e7eb',
          customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'}
        }).then((result) => { if (result.isDenied) { handleSubmit(); }});
      }
    } catch (err: any) {
      // setError(err.response?.data?.error || ...); // เปลี่ยนไปใช้ Swal
      const apiError = err.response?.data?.error || err.response?.data?.detail || err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์";
      console.error("API Call Error in handleSubmit:", err.response?.data || err);
      Swal.fire({
        icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'กรุณาลองอีกครั้ง',
        showDenyButton: true, confirmButtonText: 'ตกลง', denyButtonText: 'ลองอีกครั้ง',
        confirmButtonColor: '#64748b', denyButtonColor: '#0ea5e9', background: '#1f2937', color: '#e5e7eb',
        customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'}
      }).then((result) => { if (result.isDenied) { handleSubmit(); }});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFavorite = async (buildToSave: RecommendationBuild) => {
    if (!isAuthenticated) {
      Swal.fire({
        icon: 'warning', title: 'กรุณาเข้าสู่ระบบ', text: 'คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถบันทึกสเปคที่ชอบได้',
        confirmButtonText: 'ไปหน้าเข้าสู่ระบบ', cancelButtonText: 'ยกเลิก', showCancelButton: true,
        confirmButtonColor: '#0ea5e9', cancelButtonColor: '#64748b', background: '#1f2937', color: '#e5e7eb',
        customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-sky-300', htmlContainer: 'text-slate-300'}
      }).then((result) => { if (result.isConfirmed) { router.push('/login?redirect=' + window.location.pathname + window.location.search); }});
      return;
    }
    if (!sourcePromptForSaving) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถบันทึกได้ ข้อมูลคำขอเดิมสำหรับสร้างสเปคนี้หายไป', confirmButtonColor: '#EF4444', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'} });
      return;
    }
    setError(null); // Clear general page error

    try {
      await apiClient.post("/saved-specs/", {
        name: `${buildToSave.build_name || "สเปคที่ AI แนะนำ"}`,
        build_details: buildToSave,
        source_prompt_details: sourcePromptForSaving,
      });
      Swal.fire({
        icon: 'success', title: 'บันทึกสำเร็จ!', html: `สเปค "<strong>${buildToSave.build_name || "ที่เลือก"}</strong>" ถูกบันทึกในรายการโปรดของคุณแล้ว`,
        showDenyButton: true, confirmButtonText: 'ไปหน้ารายการสเปคโปรด', denyButtonText: 'ลั่นต่อ!',
        confirmButtonColor: '#8b5cf6', denyButtonColor: '#64748b', background: '#1f2937', color: '#e5e7eb',
        customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-green-300 text-2xl', htmlContainer: 'text-slate-300 text-lg', confirmButton: 'px-6 py-2.5 text-base font-semibold', denyButton: 'px-6 py-2.5 text-base font-semibold' }
      }).then((result) => { if (result.isConfirmed) { router.push('/favorites'); } });
    } catch (err: any) {
      const saveError = err.response?.data?.detail || err.response?.data?.name?.[0] || "ไม่สามารถบันทึกสเปคโปรดได้ โปรดลองอีกครั้ง";
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: saveError, confirmButtonColor: '#EF4444', background: '#1f2937', color: '#e5e7eb', customClass: { popup: 'rounded-2xl shadow-xl border border-slate-700', title: 'text-red-300', htmlContainer: 'text-slate-300'} });
    }
  };

  const handleExplainBuild = async (build: RecommendationBuild, buildKey: string) => {
    const isCurrentlyOpen = !!openExplanationKeys[buildKey];
    setOpenExplanationKeys(prev => ({ ...prev, [buildKey]: !isCurrentlyOpen }));

    if (!isCurrentlyOpen && (!buildExplanations[buildKey] || buildExplanations[buildKey]?.error || !buildExplanations[buildKey]?.text)) {
      if (!sourcePromptForSaving) {
        setBuildExplanations(prev => ({
          ...prev,
          [buildKey]: { text: null, isLoading: false, error: "Original request details missing." }
        }));
        return;
      }

      setBuildExplanations(prev => ({
        ...prev,
        [buildKey]: { text: prev[buildKey]?.text || null, isLoading: true, error: null }
      }));

      try {
        const payload = {
          selected_build: build,
          original_query: sourcePromptForSaving,
        };
        const { data: explanationData } = await apiClient.post<{ explanation?: string; error?: string }>("/explain-build/", payload);

        if (explanationData.error) {
          setBuildExplanations(prev => ({
            ...prev,
            [buildKey]: { 
              text: null, 
              isLoading: false, 
              error: explanationData.error || null // <--- แก้ไขตรงนี้: ถ้า error เป็น undefined ให้ใช้ null แทน
            }
          }));
        } else if (explanationData.explanation) {
          setBuildExplanations(prev => ({
            ...prev,
            [buildKey]: { text: explanationData.explanation || null, isLoading: false, error: null }
          }));
        } else {
          setBuildExplanations(prev => ({
            ...prev,
            [buildKey]: { text: null, isLoading: false, error: "No explanation provided by the AI." }
          }));
        }
      } catch (err: any) {
        const apiError = err.response?.data?.error || err.response?.data?.detail || err.message || "Failed to fetch explanation.";
        setBuildExplanations(prev => ({
          ...prev,
          [buildKey]: { text: null, isLoading: false, error: apiError }
        }));
        console.error("Explain Build Error:", err.response?.data || err);
      }
    }
  };

  const inputClass = "mt-2 block w-full bg-slate-700/60 border-slate-600 rounded-xl py-4 px-5 text-slate-100 text-base shadow-inner focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400/80 transition-all duration-200 ease-in-out focus:bg-slate-700";
  const labelClass = "block text-lg font-semibold text-sky-300 mb-2 tracking-wide";

  const getComponentName = (component: ComponentDetail | string | undefined): string => {
    if (!component) return "N/A";
    if (typeof component === "string") return component;
    return component.name || "N/A";
  };
  const getComponentPriceString = (component: ComponentDetail | string | undefined): string => {
    if (component && typeof component === 'object' && typeof component.price_thb === 'number') {
        return `(฿${component.price_thb.toLocaleString()})`;
    }
    return '';
  };

  return (
    <div className="space-y-12 md:space-y-16 pb-28"> {/* ลด space-y เล็กน้อย */}
      {/* --- Hero Section --- */}
      <section className="text-center pt-16 pb-8 md:pt-20 md:pb-10 relative"> {/* ลด padding */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          <FiCpu size={64} className="mx-auto text-sky-400 mb-6 drop-shadow-lg" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 py-2">
              I DON&apos;T HAVE CPU
            </span>
          </h1>
          <p className="mt-5 max-w-lg mx-auto text-lg text-slate-300 sm:text-xl md:mt-6 md:max-w-2xl leading-relaxed">
            ผู้ช่วยอัจฉริยะ เลือกส่วนประกอบที่ดีที่สุดเพื่อคุณ ตอบโจทย์ทุกความต้องการและงบประมาณ
          </p>
        </div>
      </section>

      {/* --- Recommender Form Section --- */}
      <section
        id="recommender-form"
        className="bg-slate-800/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-700/60 max-w-3xl mx-auto"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-sky-400 mb-10 text-center flex items-center justify-center">
          <FiSearch className="mr-3 text-sky-400" size={32}/>
          ระบุความต้องการของคุณ
        </h2>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label htmlFor="budget" className={labelClass}>งบประมาณทั้งหมด (บาท)*</label>
            <input type="number" name="budget" id="budget" value={formData.budget} onChange={handleChange} className={inputClass} placeholder="ระบุงบประมาณของคุณ เช่น 50000" required min="1000" step="10"/>
          </div>
          {/* ไม่ต้องมีช่อง Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div><label htmlFor="desired_cpu" className={labelClass}>CPU ที่เล็งไว้ <span className="text-sm text-slate-500">(ถ้ามี)</span></label><input type="text" name="desired_cpu" id="desired_cpu" value={formData.desired_cpu} onChange={handleChange} className={inputClass} placeholder="เช่น AMD Ryzen 7"/></div>
            <div><label htmlFor="desired_gpu" className={labelClass}>GPU ที่เล็งไว้ <span className="text-sm text-slate-500">(ถ้ามี)</span></label><input type="text" name="desired_gpu" id="desired_gpu" value={formData.desired_gpu} onChange={handleChange} className={inputClass} placeholder="เช่น RTX 4070"/></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
             <div><label htmlFor="desired_ram" className={labelClass}>RAM <span className="text-sm text-slate-500">(ถ้ามี)</span></label><input type="text" name="desired_ram" id="desired_ram" value={formData.desired_ram} onChange={handleChange} className={inputClass} placeholder="เช่น 32GB DDR5"/></div>
             <div><label htmlFor="storage_type" className={labelClass}>ประเภท Storage <span className="text-sm text-slate-500">(ถ้ามี)</span></label><input type="text" name="storage_type" id="storage_type" value={formData.storage_type} onChange={handleChange} className={inputClass} placeholder="เช่น NVMe SSD"/></div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
             <div><label htmlFor="storage_size" className={labelClass}>ขนาด Storage <span className="text-sm text-slate-500">(ถ้ามี)</span></label><input type="text" name="storage_size" id="storage_size" value={formData.storage_size} onChange={handleChange} className={inputClass} placeholder="เช่น 2TB"/></div>
             <div><label htmlFor="motherboard_chipset" className={labelClass}>Chipset เมนบอร์ด <span className="text-sm text-slate-500">(ถ้ามี)</span></label><input type="text" name="motherboard_chipset" id="motherboard_chipset" value={formData.motherboard_chipset} onChange={handleChange} className={inputClass} placeholder="เช่น B650, Z790"/></div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
             <div><label htmlFor="psu_wattage" className={labelClass}>กำลังไฟ PSU <span className="text-sm text-slate-500">(ถ้ามี)</span></label><input type="text" name="psu_wattage" id="psu_wattage" value={formData.psu_wattage} onChange={handleChange} className={inputClass} placeholder="เช่น 750W 80+ Gold"/></div>
             <div><label htmlFor="preferred_games" className={labelClass}>เกมโปรด / โปรแกรมที่ใช้ <span className="text-sm text-slate-500">(คั่นด้วยจุลภาค)</span></label><input type="text" name="preferred_games" id="preferred_games" value={formData.preferred_games} onChange={handleChange} className={inputClass} placeholder="เช่น Cyberpunk 2077, Adobe Premiere Pro" /></div>
          </div>
          
          <div className="pt-6">
            <button type="submit" disabled={isLoading} className="w-full text-lg flex items-center justify-center bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 hover:from-sky-600 hover:via-blue-700 hover:to-purple-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-xl hover:shadow-sky-500/30 focus:shadow-sky-500/30 transform transition-all duration-200 ease-in-out hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-sky-500/60 disabled:opacity-50 disabled:saturate-50 disabled:cursor-not-allowed">
              {isLoading ? (<><FiLoader className="animate-spin mr-3" size={24}/> กำลังประมวลผล...</>) : (<><IoSparkles className="mr-3 text-yellow-300" size={24}/> จัดสเปคเลย!</>)}
            </button>
          </div>
        </form>
      </section>

      {/* --- Messages Area (Error ทั่วไปของหน้า) --- */}
      <div className="max-w-3xl mx-auto space-y-5 mt-10 px-4">
        {error && !isLoading && (
            <div role="alert" className="p-6 bg-red-900/60 border border-red-700/80 text-red-300 rounded-2xl flex items-start space-x-4 shadow-xl">
                <FiAlertCircle className="text-red-400 flex-shrink-0 mt-1" size={28} />
                <div>
                    <h3 className="font-semibold text-red-200 text-lg">เกิดข้อผิดพลาด</h3>
                    <p className="text-base">{error}</p>
                </div>
            </div>
        )}
        {/* SweetAlert จะแสดง Success message สำหรับการ Save Favorite */}
      </div>

      {/* --- Results Section --- */}
      <section id="results" ref={resultsSectionRef} className="mt-20 scroll-mt-24">
          {recommendations.length > 0 && (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
                <span className="pb-3 border-b-2 border-sky-500/70 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
                  <FiCpu className="inline-block mr-3 mb-1 text-sky-400" size={36}/>สเปคคอมพิวเตอร์ที่ AI <span className="text-purple-400">แนะนำ</span>
                </span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 md:items-start">
                {recommendations.map((rec, index) => {
                  const buildKey = rec.build_name ? rec.build_name.replace(/\s+/g, '-').toLowerCase() + `-${index}` : `recommendation-${index}`;
                  const currentExplanationState = buildExplanations[buildKey];
                  const isExplanationSectionOpen = !!openExplanationKeys[buildKey];
                  return (
                    <div key={buildKey} className="bg-slate-800/70 backdrop-blur-xl p-7 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col hover:border-sky-500/70 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:-translate-y-1.5 hover:shadow-sky-500/20">
                      <div className="flex-grow">
                        <h3 className="text-xl lg:text-2xl font-bold text-sky-300 mb-2">{rec.build_name || `สเปคแนะนำชุดที่ ${index + 1}`}</h3>
                        {rec.total_price_estimate_thb && (<p className="text-2xl lg:text-3xl font-semibold text-green-400 mb-6">฿{rec.total_price_estimate_thb.toLocaleString()}</p>)}
                        <div className="space-y-3 text-base text-slate-200 mb-6 border-t border-b border-slate-600/70 py-5 px-1">
                          {(['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'cooler', 'case'] as const).map(partKey => {
                            const component = rec[partKey];
                            return component ? <p key={partKey} className="flex justify-between items-center"><span><strong className="text-slate-400 font-medium">{partKey.toUpperCase()}:</strong> {getComponentName(component)}</span> <span className="text-sky-300/90 text-sm font-medium">{getComponentPriceString(component)}</span></p> : null;
                          })}
                        </div>
                        {rec.notes && (<div className="bg-slate-700/60 p-4 rounded-xl mb-6"><p className="text-sm text-slate-300 flex items-start"><FiInfo className="flex-shrink-0 mr-3 mt-1 text-sky-400" size={20}/><span><strong className="text-slate-100">AI Notes:</strong> {rec.notes}</span></p></div>)}
                      </div>
                      <div className="mt-auto pt-5 space-y-4 border-t border-slate-700/60">
                        {isAuthenticated && (<button onClick={() => handleSaveFavorite(rec)} className="w-full text-base bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center transition-all duration-150 ease-in-out hover:scale-[1.03]"><FiSave className="mr-2" /> บันทึกสเปคนี้</button>)}
                        <button onClick={() => handleExplainBuild(rec, buildKey)} disabled={currentExplanationState?.isLoading} className="w-full text-base bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed">
                          {currentExplanationState?.isLoading ? <FiLoader className="animate-spin mr-2" /> : isExplanationSectionOpen && currentExplanationState?.text ? <FiChevronUp className="mr-2" /> : <FiHelpCircle className="mr-2" />}
                          {isExplanationSectionOpen && currentExplanationState?.text ? 'ซ่อนคำอธิบาย' : 'ทำไม AI แนะนำชุดนี้?'}
                        </button>
                      </div>
                      {isExplanationSectionOpen && (
                        <div className="mt-5 p-5 bg-slate-700/80 rounded-xl border border-slate-600 transition-all duration-300 ease-in-out">
                           {currentExplanationState?.isLoading && (<div className="p-3 text-center text-slate-300"><FiLoader className="animate-spin inline mr-2" /> กำลังโหลดคำอธิบาย...</div>)}
                           {currentExplanationState?.error && !currentExplanationState?.isLoading && (<div className="p-3 bg-red-900/50 border border-red-700/70 text-red-300 rounded-md text-sm"><p><strong>เกิดข้อผิดพลาด:</strong> {currentExplanationState.error}</p></div>)}
                           {currentExplanationState?.text && !currentExplanationState?.isLoading && (<div className="space-y-2"><h4 className="font-semibold text-sky-300 mb-2 text-lg">คำอธิบายจาก AI:</h4><p className="text-base text-slate-200 whitespace-pre-line leading-relaxed">{currentExplanationState.text}</p></div>)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
      </section>
    </div>
  );
}