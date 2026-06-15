"""
handler.py - Main Vercel API Handler

This is the main entry point for Vercel Serverless Functions.
It routes requests to the appropriate endpoint handlers.
"""

import json
import os
import importlib
import traceback
from typing import Dict, Any, Tuple
from urllib.parse import urlparse, parse_qs


def extract_route_and_id(path: str) -> Tuple[str, str, Dict[str, str]]:
    """
    Extract route information from the request path.
    
    Args:
        path: Request path
    
    Returns:
        Tuple of (base_route, resource_id, query_params)
    """
    # Remove leading and trailing slashes
    path = path.strip('/')
    
    # Parse URL
    parsed = urlparse(f'http://localhost/{path}')
    query_params = parse_qs(parsed.query)
    
    # Flatten query params
    flat_params = {}
    for key, values in query_params.items():
        flat_params[key] = values[0] if len(values) == 1 else values
    
    # Split path into parts
    parts = path.split('/')
    
    # Check if this is an API request
    if parts and parts[0] == 'api':
        parts = parts[1:]  # Remove 'api'
    
    if not parts:
        return ('', '', flat_params)
    
    # Check for specific patterns
    if len(parts) >= 2:
        if parts[0] == 'courses' and len(parts) >= 2:
            # Handle /courses/{id} pattern
            if parts[1] != 'index.py':
                return ('courses/[id]', parts[1], flat_params)
        elif parts[0] == 'enrollments' and len(parts) >= 2:
            if parts[1] == 'course':
                # Handle /enrollments/course/{id}
                if len(parts) >= 3:
                    return ('enrollments/course', parts[2], flat_params)
    
    # Default: use the first part as route
    base_route = '/'.join(parts)
    resource_id = ''
    
    return (base_route, resource_id, flat_params)


def import_module_safely(module_path: str):
    """
    Import a module safely, handling import errors.
    
    Args:
        module_path: Path to the module (e.g., 'auth.login')
    
    Returns:
        The imported module or None if import fails
    """
    try:
        return importlib.import_module(module_path)
    except ImportError as e:
        print(f"Failed to import {module_path}: {e}")
        return None
    except Exception as e:
        print(f"Error importing {module_path}: {e}")
        return None


def create_vercel_request(request: Dict[str, Any], body: bytes, query: Dict[str, str]) -> Dict[str, Any]:
    """
    Create a standardized request object for our handlers.
    
    Args:
        request: Vercel request object
        body: Request body
        query: Query parameters
    
    Returns:
        Standardized request object
    """
    return {
        'method': request.get('method', 'GET'),
        'headers': request.get('headers', {}),
        'body': body,
        'query': query,
        'path': request.get('path', ''),
        'url': request.get('url', '')
    }


def handler(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main Vercel API handler.
    
    This function is called by Vercel for each request.
    It routes to the appropriate endpoint handler based on the URL path.
    
    Args:
        request: Vercel request object with:
            - method: HTTP method
            - headers: Request headers
            - body: Request body
            - query: Query parameters
            - url: Full URL
            - path: Path part of URL
    
    Returns:
        Vercel response object with:
            - statusCode: HTTP status code
            - headers: Response headers
            - body: Response body (string)
    """
    try:
        # Get request body
        body = request.get('body', b'')
        if isinstance(body, str):
            body = body.encode('utf-8')
        
        # Extract query parameters
        query = request.get('query', {})
        if isinstance(query, str):
            query = parse_qs(query)
            # Flatten
            query = {k: v[0] if len(v) == 1 else v for k, v in query.items()}
        
        # Extract path
        path = request.get('path', request.get('url', ''))
        if path.startswith('/api/'):
            path = path[5:]  # Remove /api/ prefix
        
        # Parse path to get route and ID
        parts = [p for p in path.split('/') if p]
        
        # Route to appropriate handler based on path
        if not parts or parts[0] == '':
            # Root API request
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Curiosity API - Welcome'})
            }
        
        # Handle different routes
        route = parts[0]
        
        if route == 'auth':
            if len(parts) >= 2:
                auth_route = parts[1]
                if auth_route == 'register':
                    return handle_auth_register(request, body, query)
                elif auth_route == 'login':
                    return handle_auth_login(request, body, query)
        
        elif route == 'users':
            if len(parts) >= 2 and parts[1] == 'me':
                return handle_users_me(request, body, query)
        
        elif route == 'courses':
            if len(parts) == 1:
                return handle_courses_index(request, body, query)
            elif len(parts) >= 2 and parts[1] == 'id':
                # For /courses/id path, extract the actual ID from the next part
                course_id = parts[2] if len(parts) >= 3 else ''
                return handle_courses_id(request, body, query, course_id)
            else:
                # Try to use the second part as course ID
                return handle_courses_id(request, body, query, parts[1])
        
        elif route == 'enrollments':
            if len(parts) == 1 or (len(parts) == 2 and parts[1] == 'index.py'):
                return handle_enrollments_index(request, body, query)
        
        # Default: not found
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': True, 'message': 'Endpoint not found'})
        }
    
    except Exception as e:
        # Log error
        print(f"API Error: {e}")
        print(traceback.format_exc())
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': True, 'message': f'Internal server error: {str(e)}'})
        }


def handle_auth_register(request: Dict[str, Any], body: bytes, query: Dict[str, str]) -> Dict[str, Any]:
    """Handle auth/register endpoint."""
    try:
        from .auth.register import handler as register_handler
        
        # Create request object for handler
        req = create_vercel_request(request, body, query)
        
        # Call handler
        response_body, status_code, headers = register_handler(req)
        
        return {
            'statusCode': status_code,
            'headers': headers,
            'body': response_body
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': True, 'message': str(e)})
        }


def handle_auth_login(request: Dict[str, Any], body: bytes, query: Dict[str, str]) -> Dict[str, Any]:
    """Handle auth/login endpoint."""
    try:
        from .auth.login import handler as login_handler
        
        req = create_vercel_request(request, body, query)
        response_body, status_code, headers = login_handler(req)
        
        return {
            'statusCode': status_code,
            'headers': headers,
            'body': response_body
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': True, 'message': str(e)})
        }


def handle_users_me(request: Dict[str, Any], body: bytes, query: Dict[str, str]) -> Dict[str, Any]:
    """Handle users/me endpoint."""
    try:
        from .users.me import handler as me_handler
        
        req = create_vercel_request(request, body, query)
        response_body, status_code, headers = me_handler(req)
        
        return {
            'statusCode': status_code,
            'headers': headers,
            'body': response_body
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': True, 'message': str(e)})
        }


def handle_courses_index(request: Dict[str, Any], body: bytes, query: Dict[str, str]) -> Dict[str, Any]:
    """Handle courses/index endpoint."""
    try:
        from .courses.index import handler as index_handler
        
        req = create_vercel_request(request, body, query)
        response_body, status_code, headers = index_handler(req)
        
        return {
            'statusCode': status_code,
            'headers': headers,
            'body': response_body
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': True, 'message': str(e)})
        }


def handle_courses_id(request: Dict[str, Any], body: bytes, query: Dict[str, str], course_id: str) -> Dict[str, Any]:
    """Handle courses/[id] endpoint."""
    try:
        from .courses import id as id_module
        
        req = create_vercel_request(request, body, {**query, 'id': course_id})
        response_body, status_code, headers = id_module.handler(req)
        
        return {
            'statusCode': status_code,
            'headers': headers,
            'body': response_body
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': True, 'message': str(e)})
        }


def handle_enrollments_index(request: Dict[str, Any], body: bytes, query: Dict[str, str]) -> Dict[str, Any]:
    """Handle enrollments/index endpoint."""
    try:
        from .enrollments.index import handler as index_handler
        
        req = create_vercel_request(request, body, query)
        response_body, status_code, headers = index_handler(req)
        
        return {
            'statusCode': status_code,
            'headers': headers,
            'body': response_body
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': True, 'message': str(e)})
        }
