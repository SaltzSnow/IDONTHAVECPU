# pcrecommender/Dockerfile

# ใช้ Python base image
FROM python:3.9-slim-buster

# ตั้งค่า Environment Variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# ตั้งค่า Working Directory ใน container
WORKDIR /app

# Copy ไฟล์ requirements และติดตั้ง dependencies ก่อน
# เพื่อใช้ประโยชน์จาก Docker layer caching
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy โค้ดโปรเจกต์ทั้งหมดเข้าไปใน container
COPY . /app/

# (Optional) ถ้าคุณมี static files ที่ต้อง collect (สำหรับ Django Admin หรือ Django template อื่นๆ)
# RUN python manage.py collectstatic --noinput

# Expose port ที่ Django app จะรัน (ปกติคือ 8000)
# หมายเหตุ: Gunicorn หรือ Daphne จะรันบน port นี้ภายใน container
EXPOSE 8000

# คำสั่งที่จะรันเมื่อ container เริ่มทำงาน
# สำหรับ Development: ใช้ Django development server
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# สำหรับ Production: ควรใช้ Gunicorn (สำหรับ WSGI) หรือ Daphne (สำหรับ ASGI ถ้าใช้ Channels)
# ตัวอย่าง Gunicorn (ตรวจสอบให้แน่ใจว่าคุณมี gunicorn ใน requirements.txt)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "pcrecommender.wsgi:application"]
# หรือถ้าใช้ ASGI (เช่นกับ Django Channels หรือ FastAPI ภายใน Django):
# CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "pcrecommender.asgi:application"]

# **สำหรับตอนนี้ เราจะใช้ dev server ก่อนเพื่อให้ง่ายต่อการทดสอบ**
# **แต่สำหรับ Production จริงๆ ให้เปลี่ยนไปใช้ Gunicorn หรือ Daphne นะครับ**
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]s