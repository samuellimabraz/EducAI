#!/bin/bash
set -e

# Default values
PORT=${PORT:-8001}
MODEL_NAME=${MODEL_NAME:-"allenai/olmOCR-2-7B-1025-FP8"}
MAX_MODEL_LEN=${MAX_MODEL_LEN:-16384}
GPU_MEMORY_UTILIZATION=${GPU_MEMORY_UTILIZATION:-0.9}

echo "Starting OlmOCR vLLM server"
echo "Model: ${MODEL_NAME}"
echo "Port: ${PORT}"

# Run vLLM server with OlmOCR model
# Using the recommended settings from OlmOCR documentation
exec python -m vllm.entrypoints.openai.api_server \
    --model ${MODEL_NAME} \
    --served-model-name olmocr \
    --host 0.0.0.0 \
    --port ${PORT} \
    --max-model-len ${MAX_MODEL_LEN} \
    --gpu-memory-utilization ${GPU_MEMORY_UTILIZATION} \
    --trust-remote-code \
    --dtype auto \
    --quantization fp8
