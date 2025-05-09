// src/app/register/page.tsx
"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // ตรวจสอบ path ให้ถูกต้อง
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUserPlus, FiLoader, FiUser, FiMail, FiLock, FiEye, FiEyeOff} from 'react-icons/fi';
import Swal from 'sweetalert2'; // Import SweetAlert2
import 'sweetalert2/dist/sweetalert2.min.css';

// คุณสามารถ custom theme ของ SweetAlert2 ได้โดยการสร้างไฟล์ CSS/SCSS แยกต่างหาก
// แล้ว import เข้ามา หรือใช้ customClass property ตอนเรียก Swal.fire

interface FormData {
  username: string;
  email: string;
  password_1: string; // เปลี่ยนเป็น password_1 ให้ตรงกับที่ dj-rest-auth อาจจะคาดหวัง หรือ password
  password_2: string; // เปลี่ยนเป็น password_2
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password_1: '', // หรือ password
    password_2: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      router.replace('/'); // Redirect ไปหน้า Home ถ้า login แล้ว
    }
  }, [isAuthenticated, authIsLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password_1 !== formData.password_2) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3B82F6', // sky-500
        background: '#1f2937', // slate-800
        color: '#e5e7eb',     // slate-200
        customClass: {
          popup: 'rounded-2xl shadow-xl border border-slate-700',
          title: 'text-sky-300',
          htmlContainer: 'text-slate-300',
        }
      });
      setIsLoading(false);
      return;
    }

    // เตรียม payload ให้ตรงกับที่ dj-rest-auth/allauth คาดหวัง
    // dj-rest-auth มักจะใช้ 'password' และ 'password2' หรือ 'password1' และ 'password2' สำหรับ registration
    // จาก error ก่อนหน้า, backend คุณอาจจะคาดหวัง 'password1' และ 'password2'
    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password_1, // ส่งเป็น 'password' ถ้า backend คาดหวัง (dj-rest-auth/allauth default)
      password2: formData.password_2, // หรือ 'password1' และ 'password2' ตามที่ backend ต้องการ
    };
    // *** สำคัญ: ให้ตรวจสอบ API documentation หรือ error response จาก backend อีกครั้ง
    // ว่า registration endpoint ของคุณคาดหวัง field password ชื่ออะไรกันแน่ (password/password2 หรือ password1/password2)
    // ผมจะใช้ password และ password2 ตามที่ dj-rest-auth มักจะใช้เป็น default

    try {
      // const response = await register({ username: formData.username, email: formData.email, password: formData.password_1, password2: formData.password_2 });
      // แก้ไขการส่งข้อมูลให้ register function ใน AuthContext ถ้ามันคาดหวัง structure ที่แตกต่าง
      await register({
          username: formData.username,
          email: formData.email,
          password1: formData.password_1, // หรือ password1 ถ้า AuthContext.register ต้องการแบบนั้น
          password2: formData.password_2
      });


      Swal.fire({
        icon: 'success',
        title: 'ลงทะเบียนสำเร็จ!',
        text: 'ยินดีต้อนรับ! คุณพร้อมลั่นแล้ว!',
        confirmButtonText: 'พร้อมลั่น!',
        confirmButtonColor: '#10B981', // green-500
        background: '#1f2937',
        color: '#e5e7eb',
        customClass: {
          popup: 'rounded-2xl shadow-xl border border-slate-700',
          title: 'text-green-300',
          htmlContainer: 'text-slate-300',
        }
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/login');
        }
      });

    } catch (err: any) {
      console.error("Register Page Error:", err.response?.data || err.message || err);
      let errorMessage = 'การลงทะเบียนล้มเหลว โปรดลองอีกครั้ง หรือตรวจสอบข้อมูลที่กรอก';
      const errorData = err.response?.data;

      if (errorData) {
        // พยายามดึง Error Message ที่เฉพาะเจาะจงจาก Backend
        const fieldErrors: string[] = [];
        if (errorData.username && Array.isArray(errorData.username)) fieldErrors.push(`ชื่อผู้ใช้: ${errorData.username.join(', ')}`);
        if (errorData.email && Array.isArray(errorData.email)) fieldErrors.push(`อีเมล: ${errorData.email.join(', ')}`);
        if (errorData.password && Array.isArray(errorData.password)) fieldErrors.push(`รหัสผ่าน: ${errorData.password.join(', ')}`);
        if (errorData.password1 && Array.isArray(errorData.password1)) fieldErrors.push(`รหัสผ่าน: ${errorData.password1.join(', ')}`);
        if (errorData.password2 && Array.isArray(errorData.password2)) fieldErrors.push(`ยืนยันรหัสผ่าน: ${errorData.password2.join(', ')}`);
        
        if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('\n');
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors.join(', ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
            errorMessage = errorData;
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการลงทะเบียน',
        html: `<pre class="text-left text-sm whitespace-pre-wrap">${errorMessage}</pre>`, // ใช้ html property เพื่อแสดงผลหลายบรรทัด
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#EF4444', // red-500
        background: '#1f2937',
        color: '#e5e7eb',
        customClass: {
          popup: 'rounded-2xl shadow-xl border border-slate-700',
          title: 'text-red-300',
          htmlContainer: 'text-slate-300',
        }
      });
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
  const inputClass = "w-full pl-12 pr-4 py-4 bg-slate-800/70 border border-slate-700/80 text-slate-100 rounded-xl shadow-inner focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-slate-500 transition-colors duration-150 ease-in-out text-base md:text-lg"; // เพิ่ม padding
  const labelClass = "block text-base font-semibold text-purple-300 mb-2.5"; // เพิ่ม margin-bottom
  const iconInputClass = "absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none";


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 p-8 sm:p-12 bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/60">
        <div className="text-center">
          <FiUserPlus size={72} className="mx-auto text-purple-400 mb-6 drop-shadow-lg" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 py-1">
            สร้างบัญชีใหม่
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            เข้าร่วมกับเราเพื่อรับคำแนะนำสเปคคอมที่ดีที่สุด!
          </p>
        </div>

        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className={labelClass}>ชื่อผู้ใช้ (Username)</label>
            <div className={inputContainerClass}>
              <FiUser className={iconInputClass} size={22} />
              <input id="username" name="username" type="text"autoComplete="username" required className={inputClass} placeholder="ตั้งชื่อผู้ใช้ของคุณ" value={formData.username} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>อีเมล</label>
            <div className={inputContainerClass}>
              <FiMail className={iconInputClass} size={22} />
              <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} placeholder="you@example.com" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label htmlFor="password_1" className={labelClass}>รหัสผ่าน</label> {/* เปลี่ยน htmlFor และ name เป็น password_1 */}
            <div className={inputContainerClass}>
              <FiLock className={iconInputClass} size={22} />
              <input id="password_1" name="password_1" type={showPassword ? "text" : "password"} autoComplete="new-password" required className={inputClass + " pr-12"} placeholder="อย่างน้อย 8 ตัวอักษร" value={formData.password_1} onChange={handleChange} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-purple-300 focus:outline-none p-1" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
                {showPassword ? <FiEyeOff size={22} /> : <FiEye size={22} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="password_2" className={labelClass}>ยืนยันรหัสผ่าน</label> {/* เปลี่ยน htmlFor และ name เป็น password_2 */}
            <div className={inputContainerClass}>
              <FiLock className={iconInputClass} size={22} />
              <input id="password_2" name="password_2" type={showPassword2 ? "text" : "password"} autoComplete="new-password" required className={inputClass + " pr-12"} placeholder="กรอกรหัสผ่านอีกครั้ง" value={formData.password_2} onChange={handleChange} />
              <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-purple-300 focus:outline-none p-1" aria-label={showPassword2 ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
                {showPassword2 ? <FiEyeOff size={22} /> : <FiEye size={22} />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || authIsLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-xl font-semibold rounded-2xl text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 disabled:opacity-60 disabled:saturate-50 transition-all duration-150 ease-in-out"
            >
              {isLoading || authIsLoading ? (
                <FiLoader className="animate-spin mr-3 translate-y-1" />
              ) : (
                <FiUserPlus className="mr-3 transform transition-transform group-hover:scale-110 translate-y-1" />
              )}
              สมัครสมาชิก
            </button>
          </div>
        </form>

        <p className="mt-12 text-center text-base text-slate-400">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300 hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}