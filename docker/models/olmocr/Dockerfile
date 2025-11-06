# OlmOCR Server using vLLM
FROM vllm/vllm-openai:latest

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV MODEL_NAME=allenai/olmOCR-2-7B-1025-FP8

# Install additional system dependencies for PDF processing
USER root
RUN apt-get update && apt-get install -y \
    poppler-utils \
    ttf-mscorefonts-installer \
    fonts-crosextra-caladea \
    fonts-crosextra-carlito \
    gsfonts \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install OlmOCR package
RUN pip install --no-cache-dir olmocr[gpu] --extra-index-url https://download.pytorch.org/whl/cu121

# Create entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

WORKDIR /app

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run vLLM server
ENTRYPOINT ["/app/entrypoint.sh"]