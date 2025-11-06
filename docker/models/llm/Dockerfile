# LLM Server Dockerfile using vLLM
FROM vllm/vllm-openai:latest

# Environment variables
ENV VLLM_LOGGING_LEVEL=INFO

# Install additional dependencies if needed
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard]

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Run entrypoint
ENTRYPOINT ["/entrypoint.sh"]
