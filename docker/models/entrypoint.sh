#!/bin/bash
set -e

# Default values
export VLLM_LOGGING_LEVEL=${VLLM_LOGGING_LEVEL:-DEBUG}
export VLLM_ALLOW_RUNTIME_LORA_UPDATING=${VLLM_ALLOW_RUNTIME_LORA_UPDATING:-True}

# Required parameters
PORT=${PORT:-8080}
HUGGINGFACE_MODEL=${HUGGINGFACE_MODEL:?"HUGGINGFACE_MODEL must be set"}

# Optional parameters with default values
QUANTIZATION=${QUANTIZATION:-None}
KV_CACHE_DTYPE=${KV_CACHE_DTYPE:-auto}
CHAT_TEMPLATE_CONTENT_FORMAT=${CHAT_TEMPLATE_CONTENT_FORMAT:-openai}
CPU_OFFLOAD_GB=${CPU_OFFLOAD_GB:-0}
GPU_MEMORY_UTILIZATION=${GPU_MEMORY_UTILIZATION:-0.9}
DTYPE=${DTYPE:-auto}
MAX_MODEL_LEN=${MAX_MODEL_LEN:-4096}
API_KEY=${API_KEY:-}
TRUST_REMOTE_CODE=${TRUST_REMOTE_CODE:-true}
LIMIT_MM_PER_PROMPT=${LIMIT_MM_PER_PROMPT:-"image=1"}
DISABLE_CUSTOM_ALL_REDUCE=${DISABLE_CUSTOM_ALL_REDUCE:-true}
ENFORCE_EAGER=${ENFORCE_EAGER:-false}

# Check if python3 is available
if ! command -v python3 > /dev/null 2>&1; then
    echo "Error: python3 not found in the container"
    exit 1
fi

# Collect environment variables
python3 collect_env.py

# Configure Hugging Face token as environment variable for authentication
if [ -n "$HUGGINGFACE_TOKEN" ]; then
    export HF_TOKEN="$HUGGINGFACE_TOKEN"
else
    echo "Warning: HUGGINGFACE_TOKEN not provided. Private models may not be accessible."
fi

echo "Starting vLLM server with model: ${HUGGINGFACE_MODEL}"
echo "Port: ${PORT}"

# Build the command dynamically based on environment variables
CMD="python3 -m vllm.entrypoints.openai.api_server --model ${HUGGINGFACE_MODEL} --port ${PORT} --host 0.0.0.0"

# Add value-based parameters only if they're set
if [[ -n "${QUANTIZATION}" && "${QUANTIZATION}" != "None" ]]; then CMD="${CMD} --quantization ${QUANTIZATION}"; fi
if [[ -n "${DTYPE}" && "${DTYPE}" != "auto" ]]; then CMD="${CMD} --dtype ${DTYPE}"; fi
if [[ -n "${GPU_MEMORY_UTILIZATION}" ]]; then CMD="${CMD} --gpu-memory-utilization ${GPU_MEMORY_UTILIZATION}"; fi
if [[ -n "${CPU_OFFLOAD_GB}" && "${CPU_OFFLOAD_GB}" != "0" ]]; then CMD="${CMD} --cpu-offload-gb ${CPU_OFFLOAD_GB}"; fi
if [[ -n "${KV_CACHE_DTYPE}" && "${KV_CACHE_DTYPE}" != "auto" ]]; then CMD="${CMD} --kv-cache-dtype ${KV_CACHE_DTYPE}"; fi
if [[ -n "${MAX_MODEL_LEN}" ]]; then CMD="${CMD} --max-model-len ${MAX_MODEL_LEN}"; fi
if [[ -n "${CHAT_TEMPLATE_CONTENT_FORMAT}" ]]; then CMD="${CMD} --chat-template-content-format ${CHAT_TEMPLATE_CONTENT_FORMAT}"; fi
if [[ -n "${API_KEY}" ]]; then CMD="${CMD} --api-key ${API_KEY}"; fi
if [[ -n "${LIMIT_MM_PER_PROMPT}" ]]; then CMD="${CMD} --limit-mm-per-prompt ${LIMIT_MM_PER_PROMPT}"; fi

# Add flag-based parameters (enable/disable features)
if [[ "${ASYNC_SCHEDULING}" == "true" ]]; then CMD="${CMD} --async-scheduling"; fi
if [[ "${TRUST_REMOTE_CODE}" == "true" ]]; then CMD="${CMD} --trust-remote-code"; fi
if [[ "${ENABLE_CHUNKED_PREFILL}" == "true" ]]; then CMD="${CMD} --enable-chunked-prefill"; fi
if [[ "${ENABLE_LORA}" == "true" ]]; then CMD="${CMD} --enable-lora"; fi
if [[ "${ENABLE_LORA_BIAS}" == "true" ]]; then CMD="${CMD} --enable-lora-bias"; fi
if [[ "${ENABLE_PROMPT_ADAPTER}" == "true" ]]; then CMD="${CMD} --enable-prompt-adapter"; fi
if [[ "${DISABLE_LOG_STATS}" == "true" ]]; then CMD="${CMD} --disable-log-stats"; fi
if [[ "${DISABLE_LOG_REQUESTS}" == "true" ]]; then CMD="${CMD} --disable-log-requests"; fi
if [[ "${DISABLE_FASTAPI_DOCS}" == "true" ]]; then CMD="${CMD} --disable-fastapi-docs"; fi
if [[ "${ENABLE_PROMPT_TOKENS_DETAILS}" == "true" ]]; then CMD="${CMD} --enable-prompt-tokens-details"; fi
if [[ "${ENABLE_SLEEP_MODE}" == "true" ]]; then CMD="${CMD} --enable-sleep-mode"; fi
if [[ "${CALCULATE_KV_SCALES}" == "true" ]]; then CMD="${CMD} --calculate-kv-scales"; fi
if [[ "${DISABLE_ASYNC_OUTPUT_PROC}" == "true" ]]; then CMD="${CMD} --disable-async-output-proc"; fi
if [[ "${DISABLE_MM_PREPROCESSOR_CACHE}" == "true" ]]; then CMD="${CMD} --disable-mm-preprocessor-cache"; fi

# Conditionally add --disable-custom-all-reduce and --enforce-eager flags
if [[ "${DISABLE_CUSTOM_ALL_REDUCE}" == "true" ]]; then CMD="${CMD} --disable-custom-all-reduce"; fi
if [[ "${ENFORCE_EAGER}" == "true" ]]; then CMD="${CMD} --enforce-eager"; fi

# Add tensor/pipeline parallel sizes if specified
if [[ -n "${TENSOR_PARALLEL_SIZE}" ]]; then CMD="${CMD} --tensor-parallel-size ${TENSOR_PARALLEL_SIZE}"; fi
if [[ -n "${PIPELINE_PARALLEL_SIZE}" ]]; then CMD="${CMD} --pipeline-parallel-size ${PIPELINE_PARALLEL_SIZE}"; fi

# Add batching parameters if specified
if [[ -n "${MAX_NUM_BATCHED_TOKENS}" ]]; then CMD="${CMD} --max-num-batched-tokens ${MAX_NUM_BATCHED_TOKENS}"; fi
if [[ -n "${MAX_NUM_SEQS}" ]]; then CMD="${CMD} --max-num-seqs ${MAX_NUM_SEQS}"; fi


# Log the final command
echo "Executing command: ${CMD}"

# Execute the command
exec ${CMD}