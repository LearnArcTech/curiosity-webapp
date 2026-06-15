"""
index.py - Course List Endpoint

GET /api/courses - List all courses or user's courses
POST /api/courses - Create a new course
"""

import json
from typing import Dict, Any
from ..utils import parse_json_body, json_response, ValidationError, AuthorizationError, get_authorization_token
from ..services import CourseService, AuthService


def handler(request: Dict[str, Any]) -> tuple:
    """
    Handle course list and creation requests.
    
    Args:
        request: Vercel request object
    
    Returns:
        Tuple of (response_body, status_code, headers)
    """
    try:
        method = request.get('method', 'GET').upper()
        headers = request.get('headers', {})
        
        if method == 'GET':
            return get_courses(headers, request.get('query', {}))
        elif method == 'POST':
            body = request.get('body', b'')
            return create_course(headers, body)
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


def get_courses(headers: Dict[str, str], query: Dict[str, Any]) -> tuple:
    """
    Get list of courses.
    
    If user is authenticated as a teacher, return their courses.
    If user is authenticated as a student, return their enrolled courses.
    Otherwise, return all courses.
    """
    user_id = get_authorization_token(headers)
    
    # Try to get user from query params if not in headers
    if not user_id and isinstance(query, dict):
        user_id = query.get('user_id')
    
    try:
        if user_id:
            # Get user to determine role
            user = AuthService.get_user_by_id(user_id)
            if user:
                if user.is_teacher():
                    # Get teacher's courses
                    courses = CourseService.get_courses_by_teacher(user_id)
                    return json_response({
                        'courses': [course.to_dict() for course in courses],
                        'type': 'teacher'
                    }, 200)
                elif user.is_student():
                    # Get student's enrolled courses
                    student_courses = CourseService.get_student_courses(user_id)
                    return json_response({
                        'courses': student_courses,
                        'type': 'student'
                    }, 200)
    except:
        pass
    
    # Default: get all courses (for public access)
    courses = CourseService.get_all_courses()
    return json_response({
        'courses': [course.to_dict() for course in courses],
        'type': 'public'
    }, 200)


def create_course(headers: Dict[str, str], body: bytes) -> tuple:
    """
    Create a new course.
    
    Requires authentication as a teacher.
    """
    user_id = get_authorization_token(headers)
    
    if not user_id:
        return json_response(
            {'error': True, 'message': 'Authentication required'},
            401
        )
    
    # Verify user is a teacher
    user = AuthService.get_user_by_id(user_id)
    if not user or not user.is_teacher():
        return json_response(
            {'error': True, 'message': 'Only teachers can create courses'},
            403
        )
    
    # Parse request body
    data = parse_json_body(body)
    
    if not data:
        return json_response(
            {'error': True, 'message': 'Request body is required'},
            400
        )
    
    try:
        course = CourseService.create_course(data, user_id)
        
        response_data = {
            'message': 'Course created successfully',
            'course': course.to_dict()
        }
        
        return json_response(response_data, 201)
    except ValidationError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )
    except Exception as e:
        return json_response(
            {'error': True, 'message': str(e)},
            400
        )
