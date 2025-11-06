#!/usr/bin/env python3
"""
Test script to verify OlmOCR integration in EduMath AI
"""

import requests
import base64
import time
import sys
from pathlib import Path

def test_olmocr_health():
    """Test if OlmOCR service is healthy"""
    print("🔍 Testing OlmOCR service health...")
    
    try:
        # Check vLLM server
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            print("✅ OlmOCR vLLM server is healthy")
            return True
        else:
            print(f"❌ OlmOCR server returned status {response.status_code}")
            return False
    except requests.ConnectionError:
        print("❌ Cannot connect to OlmOCR server on port 8001")
        print("   Make sure the service is running: docker compose up olmocr-server")
        return False
    except Exception as e:
        print(f"❌ Error checking OlmOCR health: {e}")
        return False


def test_olmocr_model():
    """Check if OlmOCR model is loaded"""
    print("\n🔍 Checking OlmOCR model...")
    
    try:
        response = requests.get("http://localhost:8001/v1/models", timeout=5)
        if response.status_code == 200:
            models = response.json()
            print(f"✅ Available models: {models}")
            
            # Check if olmocr model is loaded
            if 'data' in models:
                model_names = [m.get('id', '') for m in models['data']]
                if 'olmocr' in model_names or any('olmOCR' in name for name in model_names):
                    print("✅ OlmOCR model is loaded")
                    return True
                else:
                    print(f"⚠️  OlmOCR model not found in: {model_names}")
                    return False
        else:
            print(f"⚠️  Models endpoint returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error checking model: {e}")
        return False


def test_ocr_extraction():
    """Test OCR extraction with a sample image"""
    print("\n🔍 Testing OCR extraction...")
    
    # Create a simple test image with text
    try:
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        # Create image with math problem
        img = Image.new('RGB', (400, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to use a basic font
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 30)
        except:
            font = ImageFont.load_default()
        
        # Draw a simple math problem
        draw.text((50, 50), "2 + 3 = ?", fill='black', font=font)
        draw.text((50, 100), "x² + 2x + 1 = 0", fill='black', font=font)
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        print("📝 Created test image with math problems")
        
    except ImportError:
        print("⚠️  PIL not installed, using a pre-encoded test image")
        # Use a small test image (1x1 white pixel as fallback)
        img_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    # Test via backend API
    try:
        print("📤 Sending image to backend OCR service...")
        
        # Create a simple file upload
        from io import BytesIO
        img_bytes = base64.b64decode(img_base64)
        files = {'image': ('test.png', BytesIO(img_bytes), 'image/png')}
        data = {'message': 'Extraia o texto desta imagem'}
        
        response = requests.post(
            "http://localhost:8000/api/ocr",
            files=files,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ OCR extraction successful!")
            print(f"   Extracted text: {result.get('text', '')[:100]}...")
            if result.get('has_math'):
                print("   ✅ Mathematical content detected")
            return True
        else:
            print(f"❌ OCR extraction failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.ConnectionError:
        print("❌ Cannot connect to backend API on port 8000")
        print("   Make sure the backend is running: docker compose up backend")
        return False
    except Exception as e:
        print(f"❌ Error during OCR extraction: {e}")
        return False


def test_chat_with_image():
    """Test the complete chat flow with an image"""
    print("\n🔍 Testing chat with image...")
    
    try:
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        # Create a math problem image
        img = Image.new('RGB', (300, 100), color='white')
        draw = ImageDraw.Draw(img)
        draw.text((20, 30), "Resolva: 5 + 7 = ?", fill='black')
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_bytes = buffered.getvalue()
        
        # Send to chat endpoint
        files = {'image': ('problem.png', io.BytesIO(img_bytes), 'image/png')}
        data = {'message': 'Me ajude a resolver este problema', 'session_id': 'test-session'}
        
        response = requests.post(
            "http://localhost:8000/api/chat",
            files=files,
            data=data,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Chat with image successful!")
            print(f"   Response: {result.get('response', '')[:150]}...")
            return True
        else:
            print(f"❌ Chat failed with status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ Error in chat test: {e}")
        return False


def main():
    print("=" * 60)
    print("EduMath AI - OlmOCR Integration Test")
    print("=" * 60)
    
    # Wait a moment for services to be ready
    print("\n⏳ Waiting for services to initialize...")
    time.sleep(2)
    
    # Run tests
    tests_passed = 0
    total_tests = 4
    
    if test_olmocr_health():
        tests_passed += 1
    
    if test_olmocr_model():
        tests_passed += 1
    
    if test_ocr_extraction():
        tests_passed += 1
    
    if test_chat_with_image():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"\n{'✅' if tests_passed == total_tests else '⚠️'} {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("\n🎉 All OlmOCR integration tests passed!")
        print("The OCR service is working correctly with the backend.")
    else:
        print("\n⚠️  Some tests failed. Please check the logs above.")
        print("\nTroubleshooting tips:")
        print("1. Make sure all services are running: docker compose up")
        print("2. Check GPU availability: nvidia-smi")
        print("3. Check service logs: docker compose logs olmocr-server")
        print("4. Ensure model is downloaded (first run may take time)")
        
    return 0 if tests_passed == total_tests else 1


if __name__ == "__main__":
    sys.exit(main())
