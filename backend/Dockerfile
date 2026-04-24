FROM python:3.11-slim

WORKDIR /app

# Cài system deps
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Cài Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Tạo thư mục uploads
RUN mkdir -p uploads generated_videos

# Expose port
EXPOSE 8000

# Chạy với Gunicorn + Uvicorn workers
CMD ["python", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
