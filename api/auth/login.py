"""
login.py - User Login Endpoint

POST /api/auth/login - Authenticate a user

Request Body:
{
    "email": "user@example.com",
    "password": "securepassword"
}

Response:
{
    "error": false,
    "data": {
        "user": {
            "id": "...",
            "email": "...",
            "name": "...",
            "role": "..."
        },
        "message": "Login successful"
    }
}
"""

import json
from typing import Dict, Any
from ..utils import parse_json_body, json_response, ValidationError, AuthError
from ..services import AuthService


def handler(request: Dict[str, Any]) -> tuple:
    """
    Handle user login request.
    
    Args:
        request: Vercel request object with:
            - method: HTTP method
            - headers: Request headers
            - body: Request body (bytes)
    
    Returns:
        Tuple of (response_body, status_code, headers)
    """
    try:
        # Only allow POST method
        method = request.get('method', 'GET').upper()
        if method != 'POST':
            return json_response(
                {'error': True, 'message': 'Method not allowed'},
                405
            )
        
        # Parse request body
        body = request.get('body', b'')
        data = parse_json_body(body)
        
        # Validate required fields
        if not data:
            return json_response(
                {'error': True, 'message': 'Request body is required'},
                400
            )
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return json_response(
                {'error': True, 'message': 'Email and password are required'},
                400
            )
        
        # Authenticate user
        user = AuthService.login_user(email, password)
        
        # Return response (without password hash)
        response_data = {
            'message': 'Login successful',
            'user': user.to_public_dict()
        }
        
        return json_response(response_data, 200)
    
    except ValidationError as e:
        return json_response(
            {'error': True, 'message': e.message, 'code': e.error_code},
            e.status_code
        )
    except AuthError as e:
        return json_response(
            {'error': True, 'message': e.message, 'code': e.error_code},
            e.status_code
        )
    except Exception as e:
        # Log error for debugging
        return json_response(
            {'error': True, 'message': f'Internal server error: {str(e)}'},
            500
        )
