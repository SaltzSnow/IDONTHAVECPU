# pcrecommender-frontend/Dockerfile

# ---- Build Stage ----
    FROM node:18-alpine AS builder
    # หรือ node:20-alpine ถ้าคุณใช้ Node.js เวอร์ชันใหม่กว่า
    
    WORKDIR /app
    
    # Copy package.json และ package-lock.json (หรือ yarn.lock)
    COPY package*.json ./
    # COPY yarn.lock ./ # ถ้าใช้ yarn
    
    # ติดตั้ง dependencies
    RUN npm install
    # RUN yarn install # ถ้าใช้ yarn
    
    # Copy โค้ดโปรเจกต์ทั้งหมด
    COPY . .
    
    # (สำคัญ) ตั้งค่า Environment Variable สำหรับ Build Time (ถ้ามี)
    # NEXT_PUBLIC_API_BASE_URL จะถูกใช้ตอน build ถ้ามันถูก hardcode ในโค้ด
    # แต่ถ้ามันถูกเรียกใช้เฉพาะตอน runtime (client-side) ก็ไม่จำเป็นต้องตั้งที่นี่
    # ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api # <<--- ระวัง: ค่านี้อาจจะไม่ถูกต้องเมื่อรันใน Docker network
    
    # Build a production-ready application
    RUN npm run build
    # RUN yarn build # ถ้าใช้ yarn
    
    # ---- Production Stage ----
    FROM node:18-alpine AS runner
    # หรือ node:20-alpine
    
    WORKDIR /app
    
    # Copy built app จาก builder stage
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package.json ./package.json
    COPY --from=builder /app/public ./public
    # COPY --from=builder /app/next.config.js ./next.config.js # ถ้ามี next.config.js ที่จำเป็นสำหรับ production
    # COPY --from=builder /app/next.config.mjs ./next.config.mjs # ถ้ามี next.config.mjs
    
    # Expose port ที่ Next.js app จะรัน (ปกติคือ 3000)
    EXPOSE 3000
    
    # (สำคัญ) Environment Variable สำหรับ Runtime
    # ค่านี้จะถูก override โดย docker-compose.yml
    ENV NODE_ENV=production
    ENV NEXT_PUBLIC_API_BASE_URL=http://backend:8000/api 
    
    # คำสั่งที่จะรัน Next.js production server
    CMD ["npm", "start"]
    # CMD ["yarn", "start"] # ถ้าใช้ yarn