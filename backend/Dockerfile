FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install perl and wget (needed to download hipify-perl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    perl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Download hipify-perl directly to keep deterministic translation without the 30GB ROCm toolkit
RUN wget -qO /usr/local/bin/hipify-perl https://raw.githubusercontent.com/ROCm/HIPIFY/amd-stg-open/bin/hipify-perl \
    && chmod +x /usr/local/bin/hipify-perl

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
