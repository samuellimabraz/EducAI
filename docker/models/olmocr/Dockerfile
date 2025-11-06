# OlmOCR2 Server Dockerfile
FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.11 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Install Python packages
RUN pip install --no-cache-dir \
    torch \
    torchvision \
    transformers \
    accelerate \
    fastapi \
    uvicorn[standard] \
    pillow \
    numpy

# Install OlmOCR toolkit
RUN pip install --no-cache-dir git+https://github.com/AukeHaanstra/olmocr.git

# Copy server script
COPY server.py /app/server.py

WORKDIR /app

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run server
CMD ["python", "server.py"]
