#!/usr/bin/env python3
"""
Test script for EduMath AI services (OCR, LLM, and Backend)
Supports both local vLLM and Hugging Face endpoints
"""

import os
import sys
import time
import base64
import httpx
import asyncio
import json
from pathlib import Path
from typing import Optional
from PIL import Image
import io

# Configuration from environment
USE_HF_ENDPOINTS = os.getenv("USE_HF_ENDPOINTS", "false").lower() == "true"

if USE_HF_ENDPOINTS:
    OLMOCR_URL = os.getenv(
        "OLMOCR_URL",
        "https://pcg78xduxy8hu0z6.us-east-1.aws.endpoints.huggingface.cloud/v1",
    )
    OLMOCR_MODEL = os.getenv("OLMOCR_MODEL", "allenai/olmOCR-2-7B-1025-FP8")
    OLMOCR_API_KEY = os.getenv("OLMOCR_API_KEY", os.getenv("HF_TOKEN"))

    LLM_URL = os.getenv(
        "LLM_URL",
        "https://n1ust9zxh8yl25uj.us-east-1.aws.endpoints.huggingface.cloud/v1",
    )
    LLM_MODEL = os.getenv("LLM_MODEL", "Qwen/Qwen3-4B-Instruct-2507-FP8")
    LLM_API_KEY = os.getenv("LLM_API_KEY", os.getenv("HF_TOKEN"))
else:
    OLMOCR_URL = "http://localhost:8001/v1"
    OLMOCR_MODEL = "olmocr"
    OLMOCR_API_KEY = None

    LLM_URL = "http://localhost:8002/v1"
    LLM_MODEL = "Qwen/Qwen2.5-Math-7B-Instruct"
    LLM_API_KEY = None

BACKEND_URL = "http://localhost:8000"
ASSETS_PATH = Path("assets/questions")


class ServiceTester:
    def __init__(self):
        self.olmocr_headers = {"Content-Type": "application/json"}
        self.llm_headers = {"Content-Type": "application/json"}

        if OLMOCR_API_KEY:
            self.olmocr_headers["Authorization"] = f"Bearer {OLMOCR_API_KEY}"
        if LLM_API_KEY:
            self.llm_headers["Authorization"] = f"Bearer {LLM_API_KEY}"

    def print_header(self, title: str):
        """Print formatted header"""
        print("\n" + "=" * 60)
        print(f"  {title}")
        print("=" * 60)

    def print_status(self, message: str, success: bool = True):
        """Print status message with emoji"""
        emoji = "✅" if success else "❌"
        print(f"{emoji} {message}")

    def encode_image(self, image_path: Path) -> str:
        """Encode image to base64"""
        with Image.open(image_path) as img:
            if img.mode != "RGB":
                img = img.convert("RGB")
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            return base64.b64encode(buffered.getvalue()).decode()

    async def test_olmocr(self, image_path: Path) -> Optional[str]:
        """Test OlmOCR service"""
        print(f"\n📸 Testing OlmOCR with: {image_path.name}")

        try:
            image_base64 = self.encode_image(image_path)

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{OLMOCR_URL}/chat/completions",
                    headers=self.olmocr_headers,
                    json={
                        "model": OLMOCR_MODEL,
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/png;base64,{image_base64}"
                                        },
                                    },
                                    {
                                        "type": "text",
                                        "text": "Extract all text and math formulas from this image. Return in markdown format.",
                                    },
                                ],
                            }
                        ],
                        "temperature": 0.1,
                        "max_tokens": 1000,
                    },
                )

                if response.status_code == 200:
                    result = response.json()
                    extracted_text = result["choices"][0]["message"]["content"]
                    self.print_status(f"OCR extracted {len(extracted_text)} characters")
                    print(f"   Preview: {extracted_text}")
                    return extracted_text
                else:
                    self.print_status(f"OCR failed: {response.status_code}", False)
                    print(f"   Error: {response.text[:200]}")
                    return None

        except Exception as e:
            self.print_status(f"OCR error: {str(e)}", False)
            return None

    async def test_llm(self, prompt: str) -> Optional[str]:
        """Test LLM service"""
        print(f"\n🤖 Testing LLM with prompt: {prompt[:100]}...")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{LLM_URL}/chat/completions",
                    headers=self.llm_headers,
                    json={
                        "model": LLM_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a helpful math tutor for elementary students.",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2000,
                    },
                )

                if response.status_code == 200:
                    result = response.json()
                    llm_response = (
                        result.get("choices", [{}])[0].get("message", {}).get("content")
                    )
                    if llm_response:
                        self.print_status(
                            f"LLM responded with {len(llm_response)} characters"
                        )
                        print(f"   Response: {llm_response}")
                    else:
                        self.print_status(f"LLM returned empty response", False)
                        print(f"   Result: {result}")
                    return llm_response
                else:
                    self.print_status(f"LLM failed: {response.status_code}", False)
                    print(f"   Error: {response.text[:200]}")
                    return None

        except Exception as e:
            self.print_status(f"LLM error: {str(e)}", False)
            return None

    async def test_backend_ocr(self, image_path: Path) -> Optional[dict]:
        """Test backend OCR endpoint"""
        print(f"\n🔧 Testing Backend OCR with: {image_path.name}")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                with open(image_path, "rb") as f:
                    files = {"image": (image_path.name, f, "image/png")}
                    response = await client.post(f"{BACKEND_URL}/api/ocr", files=files)

                if response.status_code == 200:
                    result = response.json()
                    self.print_status("Backend OCR successful")
                    print(f"   Has math: {result.get('has_math', False)}")
                    print(f"   Has tables: {result.get('has_tables', False)}")
                    if result.get("formulas"):
                        print(f"   Found {len(result['formulas'])} formulas")
                    return result
                else:
                    self.print_status(
                        f"Backend OCR failed: {response.status_code}", False
                    )
                    print(f"   Error: {response.text[:200]}")
                    return None

        except Exception as e:
            self.print_status(f"Backend OCR error: {str(e)}", False)
            return None

    async def test_backend_chat(
        self, message: str, image_path: Optional[Path] = None
    ) -> Optional[dict]:
        """Test backend chat endpoint (streaming)"""
        print(f"\n💬 Testing Backend Chat (Streaming)")

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Form data for the request
                form_data = {
                    "message": message,
                    "session_id": "test-session",
                    "stream": "true",
                }

                files = None
                if image_path:
                    with open(image_path, "rb") as f:
                        files = {"image": (image_path.name, f.read(), "image/png")}

                async with client.stream(
                    "POST", f"{BACKEND_URL}/api/chat", data=form_data, files=files
                ) as response:
                    if response.status_code != 200:
                        self.print_status(
                            f"Backend chat failed: {response.status_code}", False
                        )
                        error_text = await response.aread()
                        print(f"   Error: {error_text.decode()[:200]}")
                        return None

                    full_response = ""
                    status_messages = []

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                break

                            try:
                                parsed = json.loads(data)
                                if parsed.get("type") == "status":
                                    status_messages.append(parsed.get("message"))
                                elif parsed.get("type") == "response":
                                    full_response += parsed.get("content", "")
                                elif parsed.get("type") == "error":
                                    self.print_status(
                                        f"Error: {parsed.get('message')}", False
                                    )
                                    return None
                            except json.JSONDecodeError:
                                continue

                    if full_response:
                        self.print_status("Backend chat successful (streaming)")
                        if status_messages:
                            print(f"   Status updates: {' → '.join(status_messages)}")
                        print(f"   Response: {full_response[:200]}...")
                        return {"response": full_response}
                    else:
                        self.print_status("No response received", False)
                        return None

        except Exception as e:
            self.print_status(f"Backend chat error: {str(e)}", False)
            import traceback

            print(f"   Traceback: {traceback.format_exc()[:200]}")
            return None

    async def test_calculator(self, expression: str) -> Optional[dict]:
        """Test calculator endpoint"""
        print(f"\n🧮 Testing Calculator with: {expression}")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{BACKEND_URL}/api/calculate",
                    json={"expression": expression, "show_steps": True},
                )

                if response.status_code == 200:
                    result = response.json()
                    self.print_status("Calculator successful")
                    print(f"   Expression: {result.get('expression')}")
                    print(f"   Result: {result.get('result')}")
                    if result.get("numeric_result"):
                        print(f"   Numeric: {result['numeric_result']}")
                    return result
                else:
                    self.print_status(
                        f"Calculator failed: {response.status_code}", False
                    )
                    print(f"   Error: {response.text[:200]}")
                    return None

        except Exception as e:
            self.print_status(f"Calculator error: {str(e)}", False)
            return None

    async def test_graph(self, function: str) -> Optional[dict]:
        """Test graph generator endpoint"""
        print(f"\n📊 Testing Graph Generator with: {function}")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{BACKEND_URL}/api/graph",
                    json={"function": function, "x_range": [-10, 10]},
                )

                if response.status_code == 200:
                    result = response.json()
                    self.print_status("Graph generation successful")
                    print(f"   Function: {result.get('function')}")
                    print(f"   Description: {result.get('description')}")
                    if result.get("image_base64"):
                        print(
                            f"   Generated image (base64 length: {len(result['image_base64'])})"
                        )
                    return result
                else:
                    self.print_status(f"Graph failed: {response.status_code}", False)
                    print(f"   Error: {response.text[:200]}")
                    return None

        except Exception as e:
            self.print_status(f"Graph error: {str(e)}", False)
            return None

    async def run_all_tests(self):
        """Run all service tests"""
        self.print_header("EduMath AI Service Tests")

        # Configuration info
        print("\n📋 Configuration:")
        print(
            f"   Mode: {'Hugging Face Endpoints' if USE_HF_ENDPOINTS else 'Local vLLM'}"
        )
        print(f"   OlmOCR URL: {OLMOCR_URL}")
        print(f"   LLM URL: {LLM_URL}")
        print(f"   Backend URL: {BACKEND_URL}")

        # Find example images
        example_images = []
        if ASSETS_PATH.exists():
            for grade_dir in ASSETS_PATH.iterdir():
                if grade_dir.is_dir():
                    for topic_dir in grade_dir.iterdir():
                        if topic_dir.is_dir():
                            for img_file in topic_dir.glob("*.png"):
                                example_images.append(img_file)
                                if len(example_images) >= 3:  # Test with 3 images max
                                    break
                    if len(example_images) >= 3:
                        break

        if not example_images:
            print("\n⚠️  No example images found in assets/questions")
            # Create a simple test image
            test_img = Path("/tmp/test_math.png")
            img = Image.new("RGB", (300, 100), color="white")
            from PIL import ImageDraw

            draw = ImageDraw.Draw(img)
            draw.text((20, 30), "2 + 3 = ?", fill="black")
            img.save(test_img)
            example_images = [test_img]

        # Test 1: Direct OlmOCR
        self.print_header("Test 1: Direct OlmOCR Service")
        for img_path in example_images[:1]:
            extracted_text = await self.test_olmocr(img_path)

        # Test 2: Direct LLM
        self.print_header("Test 2: Direct LLM Service")
        llm_response = await self.test_llm(
            "Explain what is 2+3 in a simple way for kids"
        )

        # Test 3: Backend OCR
        self.print_header("Test 3: Backend OCR Endpoint")
        for img_path in example_images[:1]:
            ocr_result = await self.test_backend_ocr(img_path)

        # Test 4: Backend Chat (text only)
        self.print_header("Test 4: Backend Chat (Text Only)")
        chat_result = await self.test_backend_chat("Como resolver 5 + 7?")

        # Test 5: Backend Chat with Image
        self.print_header("Test 5: Backend Chat with Image")
        for img_path in example_images[:1]:
            chat_with_img = await self.test_backend_chat(
                "Help me solve this problem", img_path
            )

        # Test 6: Math Calculator
        self.print_header("Test 6: Math Calculator")
        await self.test_calculator("2 + 3 * 4")

        # Test 7: Graph Generator
        self.print_header("Test 7: Graph Generator")
        await self.test_graph("x**2")


async def main():
    tester = ServiceTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
