#!/bin/bash
set -e

# Default values for educational math model
PORT=${PORT:-8002}
MODEL_NAME=${MODEL_NAME:-"Qwen/Qwen2.5-Math-7B-Instruct"}
QUANTIZATION=${QUANTIZATION:-"awq"}
MAX_MODEL_LEN=${MAX_MODEL_LEN:-8192}
GPU_MEMORY_UTILIZATION=${GPU_MEMORY_UTILIZATION:-0.9}

echo "Starting vLLM server for EduMath AI"
echo "Model: ${MODEL_NAME}"
echo "Port: ${PORT}"

# Build command
CMD="python -m vllm.entrypoints.openai.api_server \
    --model ${MODEL_NAME} \
    --host 0.0.0.0 \
    --port ${PORT} \
    --max-model-len ${MAX_MODEL_LEN} \
    --gpu-memory-utilization ${GPU_MEMORY_UTILIZATION} \
    --trust-remote-code"

# Add quantization if specified
if [[ "${QUANTIZATION}" != "none" ]]; then
    CMD="${CMD} --quantization ${QUANTIZATION}"
fi

# Add chat template for better instruction following
CMD="${CMD} --chat-template /app/chat_template.jinja"

# Execute command
echo "Executing: ${CMD}"
exec ${CMD}
