"""
[id].py - Course Detail Endpoint

GET /api/courses/{id} - Get course by ID
PUT /api/courses/{id} - Update course
DELETE /api/courses/{id} - Delete course
POST /api/courses/{id}/enroll - Enroll in course
"""

import json
from typing import Dict, Any
from ..utils import parse_json_body, json_response, ValidationError, AuthorizationError, NotFoundError, get_authorization_token
from ..services import CourseService, AuthService, EnrollmentService


def handler(request: Dict[str, Any]) -> tuple:
    """
    Handle course detail requests.
    
    Args:
        request: Vercel request object
    
    Returns:
        Tuple of (response_body, status_code, headers)
    """
    try:
        method = request.get('method', 'GET').upper()
        headers = request.get('headers', {})
        query = request.get('query', {})
        
        # Extract course ID from various sources
        course_id = query.get('id') if isinstance(query, dict) else None
        
        # For Vercel, the ID might be in the path
        path = request.get('path', '')
        
        # Try to extract ID from path like /api/courses/123
        if not course_id:
            parts = path.split('/')
            for part in parts:
                if part and part not in ['api', 'courses', '[id].py', 'api/courses']:
                    # Check if this looks like an ID (not a filename)
                    if not part.endswith('.py') and len(part) < 50:
                        course_id = part
                        break
        
        if not course_id:
            return json_response(
                {'error': True, 'message': 'Course ID is required'},
                400
            )
        
        if method == 'GET':
            return get_course(course_id, headers)
        elif method == 'PUT':
            body = request.get('body', b'')
            return update_course(course_id, headers, body)
        elif method == 'DELETE':
            return delete_course(course_id, headers)
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


def get_course(course_id: str, headers: Dict[str, str]) -> tuple:
    """
    Get course by ID.
    """
    try:
        course = CourseService.get_course_by_id(course_id)
        
        if not course:
            return json_response(
                {'error': True, 'message': 'Course not found'},
                404
            )
        
        # Get students if user is teacher and owns the course
        user_id = get_authorization_token(headers)
        students = []
        
        if user_id:
            user = AuthService.get_user_by_id(user_id)
            if user and user.is_teacher() and course.teacher_id == user_id:
                students = EnrollmentService.get_students_by_course(course_id)
        
        response_data = {
            'course': course.to_dict(),
            'students': students
        }
        
        return json_response(response_data, 200)
    except Exception as e:
        return json_response(
            {'error': True, 'message': str(e)},
            500
        )


def update_course(course_id: str, headers: Dict[str, str], body: bytes) -> tuple:
    """
    Update course.
    """
    user_id = get_authorization_token(headers)
    
    if not user_id:
        return json_response(
            {'error': True, 'message': 'Authentication required'},
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
        course = CourseService.update_course(course_id, data, user_id)
        
        response_data = {
            'message': 'Course updated successfully',
            'course': course.to_dict()
        }
        
        return json_response(response_data, 200)
    except NotFoundError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )
    except AuthorizationError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )
    except ValidationError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )


def delete_course(course_id: str, headers: Dict[str, str]) -> tuple:
    """
    Delete course.
    """
    user_id = get_authorization_token(headers)
    
    if not user_id:
        return json_response(
            {'error': True, 'message': 'Authentication required'},
            401
        )
    
    try:
        CourseService.delete_course(course_id, user_id)
        
        return json_response({
            'message': 'Course deleted successfully'
        }, 200)
    except NotFoundError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )
    except AuthorizationError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )
