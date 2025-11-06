"""Custom middleware for the application"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
import time
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Create rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_PERIOD}s"]
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.request_counts = {}
        
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host
        
        # Check rate limit
        current_time = time.time()
        
        # Clean old entries
        self.request_counts = {
            ip: (count, timestamp) 
            for ip, (count, timestamp) in self.request_counts.items()
            if current_time - timestamp < settings.RATE_LIMIT_PERIOD
        }
        
        # Check current client
        if client_ip in self.request_counts:
            count, first_request_time = self.request_counts[client_ip]
            
            if current_time - first_request_time < settings.RATE_LIMIT_PERIOD:
                if count >= settings.RATE_LIMIT_REQUESTS:
                    logger.warning(f"Rate limit exceeded for {client_ip}")
                    return JSONResponse(
                        status_code=429,
                        content={"error": "Too many requests. Please try again later."}
                    )
                self.request_counts[client_ip] = (count + 1, first_request_time)
            else:
                self.request_counts[client_ip] = (1, current_time)
        else:
            self.request_counts[client_ip] = (1, current_time)
        
        # Process request
        response = await call_next(request)
        return response
