// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'sans-serif'], // ตั้ง Kanit เป็นฟอนต์หลัก
      },
      colors: {
        'primary-dark': '#0a0a0a', // สีดำเกือบสนิท หรือ #000000
        'secondary-dark': '#121212', // สีดำรองลงมา
        'content-dark': '#1a1a1a',   // สำหรับ card หรือ section
        'accent-gold': '#FFD700',    // สีทองสำหรับ accent
        'accent-red': '#E53E3E',     // สีแดงสำหรับ accent
        'text-primary-darktheme': '#EAEAEA', // สีตัวอักษรหลักบนพื้นดำ
        'text-secondary-darktheme': '#A0A0A0', // สีตัวอักษรรอง
      },
      backgroundImage: { // ตัวอย่าง Gradient สำหรับปุ่มหรือพื้นหลัง
        'gradient-red-action': 'linear-gradient(to right, #EF4444, #DC2626)',
        'gradient-gold-header': 'linear-gradient(to right, #F59E0B, #FFD700)',
      }
    },
  },
  plugins: [
    // require('@tailwindcss/forms'), // ถ้าต้องการ plugin สำหรับ form styling เพิ่มเติม
  ],
};
export default config;