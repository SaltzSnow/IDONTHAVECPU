# I DON'T HAVE CPU 

โปรเจกต์สำหรับแนะนำสเปคคอมพิวเตอร์โดยใช้ Gemini API สำหรับ Backend (Django) และ Next.js สำหรับ Frontend พร้อมการจัดการด้วย Docker

## ส่วนประกอบหลัก

* **Backend:** Django, Django REST Framework, PostgreSQL
* **Frontend:** Next.js, TypeScript, Tailwind CSS, Axios
* **AI:** Google Gemini API
* **Containerization:** Docker, Docker Compose

## การติดตั้งและเริ่มใช้งาน (Development)

1.  **Prerequisites:**
    * Docker Desktop (หรือ Docker Engine + Docker Compose)
    * Git
    * สร้างไฟล์ `.env` ที่ root ของโปรเจกต์ (ดู `.env.example` ถ้ามี) และใส่ `GEMINI_API_KEY` ของคุณ

2.  **Clone Repository (ถ้ายังไม่ได้ทำ):**
    ```bash
    git clone https://github.com/SaltzSnow/IDONTHAVECPU/
    cd IDONTHAVECPU
    ```

3.  **สร้างไฟล์ `.env` ที่ Root:**
    คัดลอกเนื้อหาจาก `.env.example` (ถ้าคุณสร้างไว้) หรือสร้างใหม่แล้วใส่:
    ```env
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```

4.  **รันด้วย Docker Compose:**
    ```bash
    docker compose up --build
    ```

5.  **เข้าถึง Services:**
    * Frontend (Next.js): `http://localhost:3000`
    * Backend API (Django): `http://localhost:8000/api/`

## โครงสร้างโฟลเดอร์

* `pcrecommender/`: Django backend application.
* `pcrecommender-frontend/`: Next.js frontend application.
* `docker-compose.yml`: Configuration for Docker services.
* `Dockerfile`: (อยู่ในแต่ละ sub-project) สำหรับ build Docker images.

