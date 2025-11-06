#!/usr/bin/env python3
"""
Test script to verify EduMath AI setup
"""

import sys
import subprocess
import time
import requests
from pathlib import Path

def check_command(command):
    """Check if a command is available"""
    try:
        subprocess.run(command, capture_output=True, shell=True, check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def check_docker():
    """Check Docker installation"""
    print("🔍 Checking Docker installation...")
    if check_command("docker --version"):
        print("✅ Docker is installed")
        return True
    else:
        print("❌ Docker is not installed")
        return False

def check_docker_compose():
    """Check Docker Compose installation"""
    print("🔍 Checking Docker Compose installation...")
    if check_command("docker-compose --version"):
        print("✅ Docker Compose is installed")
        return True
    else:
        print("❌ Docker Compose is not installed")
        return False

def check_gpu():
    """Check GPU availability"""
    print("🔍 Checking GPU availability...")
    try:
        result = subprocess.run("nvidia-smi", capture_output=True, shell=True)
        if result.returncode == 0:
            print("✅ NVIDIA GPU detected")
            return True
        else:
            print("⚠️  No NVIDIA GPU detected (will use CPU)")
            return False
    except:
        print("⚠️  nvidia-smi not found (will use CPU)")
        return False

def check_ports():
    """Check if required ports are available"""
    print("🔍 Checking port availability...")
    ports = {
        3000: "Frontend",
        8000: "Backend API",
        8001: "OlmOCR Server",
        8002: "LLM Server",
        5432: "PostgreSQL",
        6379: "Redis"
    }
    
    available = True
    for port, service in ports.items():
        try:
            result = subprocess.run(
                f"lsof -i:{port} 2>/dev/null | grep LISTEN",
                capture_output=True,
                shell=True
            )
            if result.returncode == 0:
                print(f"⚠️  Port {port} ({service}) is in use")
                available = False
            else:
                print(f"✅ Port {port} ({service}) is available")
        except:
            # lsof might not be available, try netstat
            try:
                result = subprocess.run(
                    f"netstat -tuln | grep :{port}",
                    capture_output=True,
                    shell=True
                )
                if result.returncode == 0:
                    print(f"⚠️  Port {port} ({service}) is in use")
                    available = False
                else:
                    print(f"✅ Port {port} ({service}) is available")
            except:
                print(f"⚠️  Could not check port {port}")
    
    return available

def check_env_file():
    """Check if .env file exists"""
    print("🔍 Checking environment configuration...")
    env_file = Path(".env")
    if env_file.exists():
        print("✅ .env file found")
        return True
    else:
        print("⚠️  .env file not found (will be created)")
        return False

def test_services():
    """Test if services are running"""
    print("\n🔍 Testing services...")
    services = {
        "http://localhost:8000/health": "Backend API",
        "http://localhost:3000": "Frontend",
        "http://localhost:8001/health": "OlmOCR Server",
        "http://localhost:8002/health": "LLM Server"
    }
    
    for url, service in services.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code < 500:
                print(f"✅ {service} is responding")
            else:
                print(f"⚠️  {service} returned error: {response.status_code}")
        except requests.ConnectionError:
            print(f"❌ {service} is not reachable")
        except requests.Timeout:
            print(f"⚠️  {service} is slow to respond")
        except Exception as e:
            print(f"❌ {service} error: {str(e)}")

def main():
    print("=" * 50)
    print("EduMath AI - Setup Verification")
    print("=" * 50)
    print()
    
    # Check prerequisites
    docker_ok = check_docker()
    compose_ok = check_docker_compose()
    
    if not docker_ok or not compose_ok:
        print("\n❌ Missing required dependencies")
        print("Please install Docker and Docker Compose first")
        sys.exit(1)
    
    print()
    gpu_ok = check_gpu()
    
    print()
    ports_ok = check_ports()
    
    print()
    env_ok = check_env_file()
    
    # Check if services are running
    print("\n" + "=" * 50)
    print("Checking running services...")
    print("=" * 50)
    
    # Check if docker-compose is running
    result = subprocess.run(
        "docker-compose ps",
        capture_output=True,
        shell=True
    )
    
    if result.returncode == 0:
        print("\n📦 Docker Compose services status:")
        print(result.stdout.decode())
        
        # Test services
        test_services()
    else:
        print("\n⚠️  Docker Compose is not running")
        print("Run './start.sh' to start all services")
    
    # Summary
    print("\n" + "=" * 50)
    print("Summary")
    print("=" * 50)
    
    if docker_ok and compose_ok and ports_ok:
        print("\n✅ System is ready for EduMath AI")
        print("\nTo start the application, run:")
        print("  ./start.sh")
        print("\nThen access:")
        print("  Frontend: http://localhost:3000")
        print("  API Docs: http://localhost:8000/docs")
    else:
        print("\n⚠️  Some issues need to be resolved")
        if not ports_ok:
            print("  - Stop services using the required ports")
    
    if not gpu_ok:
        print("\n💡 Note: Running without GPU will be slower")
        print("  Consider reducing model size in .env file")

if __name__ == "__main__":
    main()
