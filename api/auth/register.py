"""
register.py - User Registration Endpoint

POST /api/auth/register - Register a new user

Request Body:
{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "User Name",
    "role": "student" | "teacher"
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
        "message": "Registration successful"
    }
}
"""

import json
from typing import Dict, Any
from ..utils import parse_json_body, json_response, ValidationError, AuthError
from ..services import AuthService


def handler(request: Dict[str, Any]) -> tuple:
    """
    Handle user registration request.
    
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
        
        # Register user
        user = AuthService.register_user(data)
        
        # Return response (without password hash)
        response_data = {
            'message': 'Registration successful',
            'user': user.to_public_dict()
        }
        
        return json_response(response_data, 201)
    
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
