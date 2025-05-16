FROM python:3.9-slim-buster

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

EXPOSE 8000

# สำหรับ Development
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# สำหรับ Production
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "pcrecommender.wsgi:application"]