// eslint.config.mjs (ตัวอย่างโครงสร้าง อาจจะไม่ตรงกับของคุณเป๊ะๆ)
import nextPlugin from '@next/eslint-plugin-next';
import typescriptEslintParser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
// ... other imports ...

export default [
  // ... other configurations ...
  {
    files: ['**/*.{ts,tsx}'], // Target TypeScript files
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      react: reactPlugin,
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // ... (rules อื่นๆ ที่มีอยู่แล้ว) ...

      // --- ตัวอย่างการ Disable Rules ---
      '@typescript-eslint/no-unused-vars': 'warn', // เปลี่ยนจาก error เป็น warning
      '@typescript-eslint/no-explicit-any': 'off',  // ปิด rule นี้ไปเลย
      'react/no-unescaped-entities': ['warn', { forbid: ['>', '"', '}'] }], // เปลี่ยนเป็น warning และ custom option
      'prefer-const': 'warn', // เปลี่ยนเป็น warning

      // คุณสามารถเพิ่ม rules อื่นๆ ที่ต้องการ disable หรือปรับระดับความรุนแรงได้ที่นี่
    },
  },
  // ... other configurations for Next.js (nextPlugin.configs.recommended, etc.)
];