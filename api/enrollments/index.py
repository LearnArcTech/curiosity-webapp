"""
index.py - Enrollment Endpoints

POST /api/enrollments - Enroll in a course using code
GET /api/enrollments - Get enrollments for current user
DELETE /api/enrollments - Unenroll from a course
"""

import json
from typing import Dict, Any
from ..utils import parse_json_body, json_response, ValidationError, AuthorizationError, NotFoundError, get_authorization_token
from ..services import EnrollmentService, AuthService


def handler(request: Dict[str, Any]) -> tuple:
    """
    Handle enrollment requests.
    
    Args:
        request: Vercel request object
    
    Returns:
        Tuple of (response_body, status_code, headers)
    """
    try:
        method = request.get('method', 'GET').upper()
        headers = request.get('headers', {})
        query = request.get('query', {})
        
        if method == 'GET':
            return get_enrollments(headers)
        elif method == 'POST':
            body = request.get('body', b'')
            return enroll_in_course(headers, body)
        elif method == 'DELETE':
            body = request.get('body', b'')
            return unenroll_from_course(headers, body, query)
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


def get_enrollments(headers: Dict[str, str]) -> tuple:
    """
    Get enrollments for current user.
    """
    user_id = get_authorization_token(headers)
    
    if not user_id:
        return json_response(
            {'error': True, 'message': 'Authentication required'},
            401
        )
    
    try:
        enrollments = EnrollmentService.get_enrollments_by_student(user_id)
        
        # Get course details for each enrollment
        response_data = {
            'enrollments': [
                {
                    'id': e.id,
                    'course_id': e.course_id,
                    'enrolled_at': e.enrolled_at,
                    'progress': e.progress
                }
                for e in enrollments
            ]
        }
        
        return json_response(response_data, 200)
    except Exception as e:
        return json_response(
            {'error': True, 'message': str(e)},
            500
        )


def enroll_in_course(headers: Dict[str, str], body: bytes) -> tuple:
    """
    Enroll current user in a course using course code.
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
    
    course_code = data.get('course_code')
    
    if not course_code:
        return json_response(
            {'error': True, 'message': 'Course code is required'},
            400
        )
    
    try:
        enrollment = EnrollmentService.enroll_student(user_id, course_code)
        
        response_data = {
            'message': 'Successfully enrolled in course',
            'enrollment': {
                'id': enrollment.id,
                'student_id': enrollment.student_id,
                'course_id': enrollment.course_id,
                'enrolled_at': enrollment.enrolled_at,
                'progress': enrollment.progress
            }
        }
        
        return json_response(response_data, 201)
    except ValidationError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )
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


def unenroll_from_course(headers: Dict[str, str], body: bytes, query: Dict[str, Any]) -> tuple:
    """
    Unenroll current user from a course.
    """
    user_id = get_authorization_token(headers)
    
    if not user_id:
        return json_response(
            {'error': True, 'message': 'Authentication required'},
            401
        )
    
    # Get course_id from query or body
    course_id = query.get('course_id') if isinstance(query, dict) else None
    
    if not course_id:
        # Try to parse from body
        data = parse_json_body(body)
        course_id = data.get('course_id')
    
    if not course_id:
        return json_response(
            {'error': True, 'message': 'Course ID is required'},
            400
        )
    
    try:
        EnrollmentService.unenroll_student(user_id, course_id)
        
        return json_response({
            'message': 'Successfully unenrolled from course'
        }, 200)
    except NotFoundError as e:
        return json_response(
            {'error': True, 'message': e.message},
            e.status_code
        )
    except Exception as e:
        return json_response(
            {'error': True, 'message': str(e)},
            400
        )
