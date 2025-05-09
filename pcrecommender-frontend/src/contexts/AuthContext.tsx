// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import apiClient from '@/services/api'; // Axios client จาก src/services/api.ts
import { storeTokens, getAccessToken, clearTokens, getRefreshToken } from '@/services/tokenService'; // จาก src/services/tokenService.ts
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2'; // Import SweetAlert2
import 'sweetalert2/dist/sweetalert2.min.css'; // Import default SweetAlert2 theme
import type { User, AuthTokens } from '@/lib/types'; // สมมติว่า import User และ AuthTokens มาจาก src/lib/types.ts
import { FiLoader } from 'react-icons/fi'

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<User | null>; // ควร type credentials ให้ดีกว่านี้
  register: (userData: any) => Promise<User | null>; // ควร type userData ให้ดีกว่านี้
  logout: () => void; // เปลี่ยนเป็น void เพราะ Swal จะจัดการ async และ redirect
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null); // เพิ่ม state สำหรับ accessToken
  const [isLoading, setIsLoading] = useState(true); // Loading state สำหรับการตรวจสอบ auth เริ่มต้น
  const router = useRouter();

  // ฟังก์ชันสำหรับดึงข้อมูล user เมื่อมี token
  const fetchUserWithToken = useCallback(async (token: string) => {
    if (token) {
      try {
        const { data: userData } = await apiClient.get<User>('/auth/user/', {
          headers: { Authorization: `Bearer ${token}` }, // ส่ง token ไปกับ request
        });
        setUser(userData);
        setAccessToken(token); // เก็บ access token ไว้ใน state
        return userData;
      } catch (error: any) {
        console.error('AuthContext: Failed to fetch user with token', error.response?.data || error.message);
        if (error.response?.status === 401) { // ถ้า Token หมดอายุ หรือไม่ถูกต้อง
          clearTokens(); // Clear tokens จาก localStorage
          setUser(null);
          setAccessToken(null);
          // ไม่จำเป็นต้อง redirect ที่นี่ ปล่อยให้ component ที่เรียกจัดการ หรือ protected route จัดการ
        }
        return null;
      }
    }
    setUser(null); // ถ้าไม่มี token ก็ set user เป็น null
    setAccessToken(null);
    return null;
  }, []); // ไม่ต้องใส่ router ใน dependency array ถ้าไม่ใช้

  // ตรวจสอบสถานะ Authentication เมื่อ Component โหลดครั้งแรก
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const currentToken = getAccessToken();
      if (currentToken) {
        await fetchUserWithToken(currentToken);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchUserWithToken]);

  const login = async (credentials: { identifier: string; password: string }) => {
    try {
      let loginPayload: any = { password: credentials.password };
      if (credentials.identifier && typeof credentials.identifier === 'string') {
        if (credentials.identifier.includes('@') && credentials.identifier.includes('.')) {
          loginPayload.email = credentials.identifier;
        } else {
          loginPayload.username = credentials.identifier;
        }
      } else {
        throw { response: { data: { detail: "ชื่อผู้ใช้ หรือ อีเมล และรหัสผ่านเป็นสิ่งจำเป็น" }}};
      }

      const { data } = await apiClient.post<AuthTokens>('/auth/login/', loginPayload);
      storeTokens(data.access, data.refresh);
      setUser(data.user);
      setAccessToken(data.access);
      return data.user;
    } catch (error) {
      console.error('Login failed in AuthContext:', error);
      clearTokens();
      setUser(null);
      setAccessToken(null);
      throw error; // โยน error ต่อไปให้ Form จัดการแสดงผล
    }
  };

  const register = async (userData: any) => { // userData ควรมี type ที่ชัดเจน
    try {
      // สมมติว่า backend คืน access, refresh, user object เมื่อ register สำเร็จ
      const { data } = await apiClient.post<AuthTokens>('/auth/registration/', userData);
      if (data.access && data.refresh && data.user) {
        // อาจจะไม่ต้องการ auto-login หลัง register แต่ถ้าต้องการก็ทำได้:
        // storeTokens(data.access, data.refresh);
        // setUser(data.user);
        // setAccessToken(data.access);
        return data.user; // คืน user data เพื่อให้ frontend รู้ว่า register สำเร็จ
      }
      // ถ้า backend ไม่คืน token หรือ user ก็คืน null หรือ response data อื่นๆ
      return null;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    const refreshToken = getRefreshToken();

    const performClientLogoutAndPrompt = () => {
      clearTokens();
      setUser(null);
      setAccessToken(null);

      Swal.fire({
        title: 'ออกจากระบบสำเร็จ',
        text: "คุณต้องการไปที่หน้าใดต่อ?",
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'ไปลั่นต่อ!',
        cancelButtonText: 'ไปหน้าเข้าสู่ระบบ',
        confirmButtonColor: '#0ea5e9', // Tailwind sky-500
        cancelButtonColor: '#64748b',  // Tailwind slate-500
        background: '#1e293b', // Tailwind slate-800
        color: '#e2e8f0',     // Tailwind slate-200
        customClass: {
          popup: 'rounded-2xl shadow-xl border border-slate-700',
          title: 'text-sky-300 text-2xl md:text-3xl',
          htmlContainer: 'text-slate-300 text-lg md:text-xl',
          confirmButton: 'px-6 py-2.5 text-base md:text-lg font-semibold',
          cancelButton: 'px-6 py-2.5 text-base md:text-lg font-semibold',
        },
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/'); // ไปหน้าแรก
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          router.push('/login'); // ไปหน้า Login
        }
        // ถ้าผู้ใช้กด ESC หรือคลิกนอก modal, จะไม่ทำอะไร (หรือจะให้ default ไปหน้าแรกก็ได้)
        // else {
        //   router.push('/');
        // }
      });
    };

    if (refreshToken && accessToken) { // ตรวจสอบว่ามี token จริงๆ ก่อนเรียก API logout
      apiClient.post('/auth/logout/', { refresh: refreshToken })
        .then(() => {
          console.log("Refresh token successfully blacklisted on server.");
        })
        .catch(error => {
          console.warn('Logout: Failed to blacklist refresh token on server. Continuing client-side logout.', error.response?.data || error.message);
        })
        .finally(() => {
          performClientLogoutAndPrompt();
        });
    } else {
      // ถ้าไม่มี token (เช่น user อาจจะยังไม่ได้ login หรือ token ถูก clear ไปแล้ว) ก็ทำ client-side logout และแสดง prompt เลย
      performClientLogoutAndPrompt();
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isAuthenticated: !!accessToken && !!user, isLoading, login, register, logout }}>
      {/* แสดง children ต่อเมื่อ initial auth check เสร็จแล้ว (ถ้า isLoading เป็น false) */}
      {!isLoading && children}
      {/* แสดง Global Loading Spinner ขณะตรวจสอบ auth เริ่มต้น */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <FiLoader className="animate-spin text-sky-400" size={56}/>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};