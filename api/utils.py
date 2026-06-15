"""
utils.py - Utility Functions

Common utility functions for the Curiosity API including:
- JSON response formatting
- Error handling
- Input validation and sanitization
- Password hashing
- UUID generation
"""

import json
import re
import uuid
from datetime import datetime
from typing import Any, Dict, Optional, Tuple


# Error messages (matching frontend)
ERROR_MESSAGES = {
    'INVALID_EMAIL': 'Invalid email format',
    'PASSWORD_TOO_SHORT': 'Password must be at least 6 characters',
    'PASSWORDS_DONT_MATCH': 'Passwords do not match',
    'USER_EXISTS': 'User already exists',
    'INVALID_CREDENTIALS': 'Invalid email or password',
    'NOT_AUTHENTICATED': 'Please log in to continue',
    'NOT_AUTHORIZED': 'You do not have permission to perform this action',
    'COURSE_NOT_FOUND': 'Course not found',
    'DUPLICATE_ENROLLMENT': 'You are already enrolled in this course',
    'USER_NOT_FOUND': 'User not found',
    'ENROLLMENT_NOT_FOUND': 'Enrollment not found',
    'SESSION_NOT_FOUND': 'Session not found',
    'INVALID_REQUEST': 'Invalid request data',
    'DATABASE_ERROR': 'Database error occurred'
}


class APIError(Exception):
    """Custom exception for API errors."""
    
    def __init__(self, message: str, status_code: int = 400, error_code: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or 'API_ERROR'
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for JSON response."""
        return {
            'error': True,
            'message': self.message,
            'code': self.error_code,
            'status_code': self.status_code
        }


class AuthError(APIError):
    """Authentication-related errors."""
    
    def __init__(self, message: str, status_code: int = 401, error_code: str = 'AUTH_ERROR'):
        super().__init__(message, status_code, error_code)


class ValidationError(APIError):
    """Validation-related errors."""
    
    def __init__(self, message: str, field: Optional[str] = None, error_code: str = 'VALIDATION_ERROR'):
        super().__init__(message, 400, error_code)
        self.field = field


class NotFoundError(APIError):
    """Resource not found errors."""
    
    def __init__(self, message: str, resource_type: str = 'resource', error_code: str = 'NOT_FOUND'):
        super().__init__(message, 404, error_code)
        self.resource_type = resource_type


class AuthorizationError(APIError):
    """Authorization-related errors."""
    
    def __init__(self, message: str, error_code: str = 'NOT_AUTHORIZED'):
        super().__init__(message, 403, error_code)


# Roles
ROLES = {
    'STUDENT': 'student',
    'TEACHER': 'teacher'
}


def create_response(data: Any = None, error: Optional[APIError] = None, 
                    status_code: int = 200) -> Tuple[Dict[str, Any], int, Dict[str, str]]:
    """
    Create a standardized API response.
    
    Args:
        data: The data to return (will be serialized to JSON)
        error: An APIError instance if there was an error
        status_code: HTTP status code
    
    Returns:
        Tuple of (response_dict, status_code, headers)
    """
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    if error:
        response = error.to_dict()
        response['timestamp'] = datetime.utcnow().isoformat()
        return response, error.status_code, headers
    
    response = {
        'error': False,
        'data': data,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    return response, status_code, headers


def json_response(response_data: Any, status_code: int = 200) -> Tuple[str, int, Dict[str, str]]:
    """
    Create a JSON response.
    
    Args:
        response_data: Data to serialize to JSON
        status_code: HTTP status code
    
    Returns:
        Tuple of (json_string, status_code, headers)
    """
    json_str = json.dumps(response_data, default=str, ensure_ascii=False, indent=2)
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    return json_str, status_code, headers


def sanitize_input(input_str: str, max_length: int = 500) -> str:
    """
    Sanitize user input to prevent XSS and SQL injection.
    
    Args:
        input_str: The input string to sanitize
        max_length: Maximum allowed length
    
    Returns:
        Sanitized string
    """
    if not input_str or not isinstance(input_str, str):
        return ''
    
    # Remove potentially dangerous characters
    # Keep only alphanumeric, spaces, and common punctuation
    sanitized = re.sub(r"[<>\"'`]", '', input_str)
    
    # Truncate to max length
    sanitized = sanitized[:max_length]
    
    # Strip leading/trailing whitespace
    sanitized = sanitized.strip()
    
    return sanitized


def is_valid_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
    
    Returns:
        True if email is valid, False otherwise
    """
    if not email or not isinstance(email, str):
        return False
    
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(email_regex, email))


def is_valid_password(password: str) -> bool:
    """
    Validate password strength.
    
    Args:
        password: Password to validate
    
    Returns:
        True if password is valid, False otherwise
    """
    if not password or not isinstance(password, str):
        return False
    
    return len(password) >= 6


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid.uuid4())


def get_timestamp() -> str:
    """Get current UTC timestamp as ISO format string."""
    return datetime.utcnow().isoformat()


def parse_json_body(body: bytes) -> Dict[str, Any]:
    """
    Parse JSON request body.
    
    Args:
        body: Raw request body as bytes
    
    Returns:
        Parsed dictionary
    
    Raises:
        ValidationError: If JSON parsing fails
    """
    try:
        if not body:
            return {}
        
        # Handle both bytes and string
        if isinstance(body, bytes):
            body_str = body.decode('utf-8')
        else:
            body_str = str(body)
        
        return json.loads(body_str)
    except json.JSONDecodeError as e:
        raise ValidationError(f'Invalid JSON: {str(e)}', error_code='INVALID_JSON')
    except Exception as e:
        raise ValidationError(f'Failed to parse request: {str(e)}', error_code='PARSE_ERROR')


def get_authorization_token(headers: Dict[str, str]) -> Optional[str]:
    """
    Extract authorization token from headers.
    
    Args:
        headers: Request headers dictionary
    
    Returns:
        The authorization token if present, None otherwise
    """
    if not headers:
        return None
    
    auth_header = headers.get('Authorization', '')
    if not auth_header:
        return None
    
    # Handle both "Bearer <token>" and raw token
    if auth_header.lower().startswith('bearer '):
        return auth_header[7:].strip()
    
    return auth_header.strip()
