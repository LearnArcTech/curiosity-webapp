"""
me.py - Current User Endpoints

GET /api/users/me - Get current user information
PUT /api/users/me - Update current user information
"""

import json
from typing import Dict, Any
from ..utils import parse_json_body, json_response, ValidationError, NotFoundError, get_authorization_token
from ..services import AuthService


def handler(request: Dict[str, Any]) -> tuple:
    """
    Handle current user requests.
    
    Args:
        request: Vercel request object
    
    Returns:
        Tuple of (response_body, status_code, headers)
    """
    try:
        method = request.get('method', 'GET').upper()
        headers = request.get('headers', {})
        
        if method == 'GET':
            return get_current_user(headers)
        elif method == 'PUT':
            body = request.get('body', b'')
            return update_current_user(headers, body)
        else:
            return json_response(
                {'error': True, 'message': 'Method not allowed'},
                405
            )
    except Exception as e:
        return json_response(
            {'error': True, 'message': f'Internal server error: {str(e)}'},
            500
        )


def get_current_user(headers: Dict[str, str]) -> tuple:
    """
    Get current user information.
    
    For this simple implementation, we'll use the Authorization header
    to identify the user. In a production environment, you'd use JWT tokens.
    
    For now, we'll accept user_id from headers or query params.
    """
    # Extract user ID from headers
    user_id = get_authorization_token(headers)
    
    # If no token, try to get from query
    query = headers.get('query', {}) if isinstance(headers.get('query'), dict) else {}
    if not user_id and isinstance(query, dict):
        user_id = query.get('user_id')
    
    if not user_id:
        return json_response(
            {'error': True, 'message': 'Not authenticated'},
            401
        )
    
    # Get user from database
    user = AuthService.get_user_by_id(user_id)
    
    if not user:
        return json_response(
            {'error': True, 'message': 'User not found'},
            404
        )
    
    response_data = {
        'user': user.to_public_dict()
    }
    
    return json_response(response_data, 200)


def update_current_user(headers: Dict[str, str], body: bytes) -> tuple:
    """
    Update current user information.
    """
    # Extract user ID from headers
    user_id = get_authorization_token(headers)
    
    if not user_id:
        return json_response(
            {'error': True, 'message': 'Not authenticated'},
            401
        )
    
    # Parse request body
    data = parse_json_body(body)
    
    if not data:
        return json_response(
            {'error': True, 'message': 'Request body is required'},
            400
        )
    
    try:
        user = AuthService.update_user(user_id, data)
        
        response_data = {
            'message': 'User updated successfully',
            'user': user.to_public_dict()
        }
        
        return json_response(response_data, 200)
    except NotFoundError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )
    except ValidationError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )
