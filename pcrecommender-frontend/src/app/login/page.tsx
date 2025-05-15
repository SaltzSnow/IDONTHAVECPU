// src/app/login/page.tsx
"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; 
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiLogIn, FiAlertCircle, FiLoader, FiUser, FiLock, FiEye, FiEyeOff, FiCpu } from 'react-icons/fi';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      const redirectUrl = searchParams.get('redirect') || '/';
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, authIsLoading, router, searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); 
    setIsLoading(true);
    try {
      await login({ identifier: identifier, password: password });
    } catch (err: any) {
      console.error("Login Page handleSubmit Error:", err);
      let thaiErrorMessage = "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง"; 

      const errorData = err.response?.data;
      if (errorData) {
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors) && errorData.non_field_errors.length > 0) {
          const specificError = errorData.non_field_errors[0].toLowerCase();
          if (specificError.includes("unable to log in with provided credentials")) {
            thaiErrorMessage = "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง";
          } else if (specificError.includes("e-mail address is not verified")) {
            thaiErrorMessage = "บัญชีนี้ยังไม่ได้ยืนยันอีเมล กรุณาตรวจสอบอีเมลของคุณ";
          } else {
            thaiErrorMessage = errorData.non_field_errors[0];
          }
        } else if (errorData.detail) {
           if (typeof errorData.detail === 'string' && errorData.detail.toLowerCase().includes("no active account found with the given credentials")) {
             thaiErrorMessage = "ไม่พบบัญชีผู้ใช้นี้ หรือรหัสผ่านไม่ถูกต้อง";
           } else {
             thaiErrorMessage = errorData.detail;
           }
        } else if (typeof errorData === 'object' && !Array.isArray(errorData)) {
          const fieldErrorKeys = Object.keys(errorData);
          if (fieldErrorKeys.length > 0) {
            const firstKey = fieldErrorKeys[0];
            if (Array.isArray(errorData[firstKey]) && errorData[firstKey].length > 0) {
              thaiErrorMessage = `${firstKey}: ${errorData[firstKey][0]}`;
            }
          }
        } else if (typeof errorData === 'string') { 
            thaiErrorMessage = errorData;
        }
      } else if (err.message && err.message.toLowerCase().includes('network error')) {
        thaiErrorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ โปรดตรวจสอบอินเทอร์เน็ตของคุณ";
      }
      setError(thaiErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (authIsLoading || (!authIsLoading && isAuthenticated)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <FiLoader className="animate-spin text-sky-500" size={64}/>
        </div>
      );
  }

  const inputContainerClass = "relative";
  const inputClass = "w-full pl-12 pr-4 py-4 bg-slate-800/70 border border-slate-700/80 text-slate-100 rounded-xl shadow-inner focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500 transition-colors duration-150 ease-in-out text-base md:text-lg";
  const labelClass = "block text-base font-semibold text-sky-300 mb-2.5"; 
  const iconInputClass = "absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none";


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 p-8 sm:p-12 bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/60">
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <FiCpu size={72} className="mx-auto text-sky-400 hover:text-sky-300 transition-colors drop-shadow-lg" />
          </Link>
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-purple-500 py-1">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            ยินดีต้อนรับกลับ! กรอกข้อมูลเพื่อใช้งานต่อ
          </p>
        </div>

        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="identifier" className={labelClass}>
              ชื่อผู้ใช้ หรือ อีเมล
            </label>
            <div className={inputContainerClass}>
              <FiUser className={iconInputClass} size={22} />
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username email"
                required
                className={inputClass}
                placeholder="ชื่อผู้ใช้ของคุณ หรือ email@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              รหัสผ่าน
            </label>
            <div className={inputContainerClass}>
              <FiLock className={iconInputClass} size={22} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className={inputClass + " pr-12"} 
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-sky-300 focus:outline-none p-1 rounded-full"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <FiEyeOff size={22} /> : <FiEye size={22} />}
              </button>
            </div>
          </div>

          {/* --- ส่วนแสดง Error Message ที่เป็น Text ธรรมดา --- */}
          {error && (
            <div role="alert" className="flex items-start p-4 bg-red-900/50 border border-red-700/70 text-red-300 rounded-xl text-base shadow-md">
              <FiAlertCircle className="mr-3 mt-1 text-red-400 flex-shrink-0 " size={24}/>
              <span className='translate-y-1'>{error}</span> 
            </div>
          )}
          {/* --- สิ้นสุดส่วนแสดง Error Message --- */}


          <div className="pt-2"> {/* ลด pt เล็กน้อย */}
            <button
              type="submit"
              disabled={isLoading || authIsLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-xl font-semibold rounded-2xl text-white bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-60 disabled:saturate-50 transition-all duration-150 ease-in-out"
            >
              {isLoading || authIsLoading ? (
                <FiLoader className="animate-spin mr-2.5 translate-y-1" />
              ) : (
                <FiLogIn className="mr-2.5 transform transition-transform group-hover:translate-x-1 relative top-[1px] translate-y-1" />
              )}
              เข้าสู่ระบบ
            </button>
          </div>
        </form>

        <p className="mt-12 text-center text-base text-slate-400">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
            สมัครสมาชิกที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}