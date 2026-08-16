# 1. Use a lightweight Python base image
FROM python:3.11-slim

# 2. Set working directory
WORKDIR /app

# 3. Environment variables to optimize Python execution
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 4. Install system dependencies (for Postgres and build tools)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Copy requirements.txt and install Python packages
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy all project files into container
COPY . /app/

# 7. Expose default Django port
EXPOSE 8000

# 8. Default start command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]