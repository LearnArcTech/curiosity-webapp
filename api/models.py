"""
models.py - Data Models

This module defines the data models for the Curiosity application.
It provides classes for User, Course, Enrollment, and Session objects.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from .utils import generate_uuid, get_timestamp, sanitize_input
from .database import ROLE_STUDENT, ROLE_TEACHER


class User:
    """User model representing a user in the system."""
    
    def __init__(
        self,
        id: Optional[str] = None,
        email: str = '',
        name: Optional[str] = None,
        password_hash: str = '',
        role: Optional[str] = None,
        is_guest: bool = False,
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None
    ):
        self.id = id or generate_uuid()
        self.email = sanitize_input(email) if email else ''
        self.name = sanitize_input(name) if name else None
        self.password_hash = password_hash
        self.role = role
        self.is_guest = is_guest
        self.created_at = created_at or get_timestamp()
        self.updated_at = updated_at or get_timestamp()
    
    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """Convert user to dictionary."""
        result = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'is_guest': self.is_guest,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
        
        if include_sensitive and self.password_hash:
            result['password_hash'] = self.password_hash
        
        return result
    
    def to_public_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary without sensitive data."""
        return self.to_dict(include_sensitive=False)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], include_password: bool = True) -> 'User':
        """Create a User from a dictionary."""
        return cls(
            id=data.get('id'),
            email=data.get('email', ''),
            name=data.get('name'),
            password_hash=data.get('password_hash', '') if include_password else '',
            role=data.get('role'),
            is_guest=data.get('is_guest', False),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )
    
    @classmethod
    def from_db_row(cls, row: Any) -> 'User':
        """Create a User from a database row."""
        return cls(
            id=row['id'] if 'id' in row else row[0],
            email=row['email'] if 'email' in row else row[1],
            name=row['name'] if 'name' in row else row[2],
            password_hash=row['password_hash'] if 'password_hash' in row else row[3],
            role=row['role'] if 'role' in row else row[4],
            is_guest=bool(row['is_guest']) if 'is_guest' in row else bool(row[5]),
            created_at=row['created_at'] if 'created_at' in row else row[6],
            updated_at=row['updated_at'] if 'updated_at' in row else row[7]
        )
    
    def is_student(self) -> bool:
        """Check if user is a student."""
        return self.role == ROLE_STUDENT
    
    def is_teacher(self) -> bool:
        """Check if user is a teacher."""
        return self.role == ROLE_TEACHER
    
    def has_role(self) -> bool:
        """Check if user has a role assigned."""
        return self.role in [ROLE_STUDENT, ROLE_TEACHER]


class Course:
    """Course model representing a course in the system."""
    
    def __init__(
        self,
        id: Optional[str] = None,
        code: str = '',
        name: str = '',
        description: Optional[str] = None,
        teacher_id: str = '',
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None
    ):
        self.id = id or generate_uuid()
        self.code = code.upper() if code else generate_uuid()[:8].upper()
        self.name = sanitize_input(name) if name else ''
        self.description = sanitize_input(description) if description else None
        self.teacher_id = teacher_id
        self.created_at = created_at or get_timestamp()
        self.updated_at = updated_at or get_timestamp()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert course to dictionary."""
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'teacher_id': self.teacher_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Course':
        """Create a Course from a dictionary."""
        return cls(
            id=data.get('id'),
            code=data.get('code', ''),
            name=data.get('name', ''),
            description=data.get('description'),
            teacher_id=data.get('teacher_id', ''),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )
    
    @classmethod
    def from_db_row(cls, row: Any) -> 'Course':
        """Create a Course from a database row."""
        return cls(
            id=row['id'] if 'id' in row else row[0],
            code=row['code'] if 'code' in row else row[1],
            name=row['name'] if 'name' in row else row[2],
            description=row['description'] if 'description' in row else row[3],
            teacher_id=row['teacher_id'] if 'teacher_id' in row else row[4],
            created_at=row['created_at'] if 'created_at' in row else row[5],
            updated_at=row['updated_at'] if 'updated_at' in row else row[6]
        )


class Enrollment:
    """Enrollment model representing a student's enrollment in a course."""
    
    def __init__(
        self,
        id: Optional[str] = None,
        student_id: str = '',
        course_id: str = '',
        enrolled_at: Optional[str] = None,
        progress: float = 0.0
    ):
        self.id = id or generate_uuid()
        self.student_id = student_id
        self.course_id = course_id
        self.enrolled_at = enrolled_at or get_timestamp()
        self.progress = float(progress) if progress else 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert enrollment to dictionary."""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'course_id': self.course_id,
            'enrolled_at': self.enrolled_at,
            'progress': self.progress
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Enrollment':
        """Create an Enrollment from a dictionary."""
        return cls(
            id=data.get('id'),
            student_id=data.get('student_id', ''),
            course_id=data.get('course_id', ''),
            enrolled_at=data.get('enrolled_at'),
            progress=data.get('progress', 0.0)
        )
    
    @classmethod
    def from_db_row(cls, row: Any) -> 'Enrollment':
        """Create an Enrollment from a database row."""
        return cls(
            id=row['id'] if 'id' in row else row[0],
            student_id=row['student_id'] if 'student_id' in row else row[1],
            course_id=row['course_id'] if 'course_id' in row else row[2],
            enrolled_at=row['enrolled_at'] if 'enrolled_at' in row else row[3],
            progress=float(row['progress']) if 'progress' in row else float(row[4])
        )


class Session:
    """Session model representing a course session."""
    
    def __init__(
        self,
        id: Optional[str] = None,
        course_id: str = '',
        name: str = '',
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        created_at: Optional[str] = None
    ):
        self.id = id or generate_uuid()
        self.course_id = course_id
        self.name = sanitize_input(name) if name else ''
        self.start_time = start_time
        self.end_time = end_time
        self.created_at = created_at or get_timestamp()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary."""
        result = {
            'id': self.id,
            'course_id': self.course_id,
            'name': self.name,
            'created_at': self.created_at
        }
        
        if self.start_time:
            result['start_time'] = self.start_time
        if self.end_time:
            result['end_time'] = self.end_time
        
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Session':
        """Create a Session from a dictionary."""
        return cls(
            id=data.get('id'),
            course_id=data.get('course_id', ''),
            name=data.get('name', ''),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            created_at=data.get('created_at')
        )
    
    @classmethod
    def from_db_row(cls, row: Any) -> 'Session':
        """Create a Session from a database row."""
        return cls(
            id=row['id'] if 'id' in row else row[0],
            course_id=row['course_id'] if 'course_id' in row else row[1],
            name=row['name'] if 'name' in row else row[2],
            start_time=row['start_time'] if 'start_time' in row else row[3],
            end_time=row['end_time'] if 'end_time' in row else row[4],
            created_at=row['created_at'] if 'created_at' in row else row[5]
        )


class SessionAttendance:
    """Session attendance model representing student attendance in a session."""
    
    def __init__(
        self,
        id: Optional[str] = None,
        session_id: str = '',
        student_id: str = '',
        attended: bool = False,
        duration_minutes: int = 0
    ):
        self.id = id or generate_uuid()
        self.session_id = session_id
        self.student_id = student_id
        self.attended = bool(attended)
        self.duration_minutes = int(duration_minutes) if duration_minutes else 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session attendance to dictionary."""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'student_id': self.student_id,
            'attended': self.attended,
            'duration_minutes': self.duration_minutes
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SessionAttendance':
        """Create a SessionAttendance from a dictionary."""
        return cls(
            id=data.get('id'),
            session_id=data.get('session_id', ''),
            student_id=data.get('student_id', ''),
            attended=data.get('attended', False),
            duration_minutes=data.get('duration_minutes', 0)
        )
    
    @classmethod
    def from_db_row(cls, row: Any) -> 'SessionAttendance':
        """Create a SessionAttendance from a database row."""
        return cls(
            id=row['id'] if 'id' in row else row[0],
            session_id=row['session_id'] if 'session_id' in row else row[1],
            student_id=row['student_id'] if 'student_id' in row else row[2],
            attended=bool(row['attended']) if 'attended' in row else bool(row[3]),
            duration_minutes=int(row['duration_minutes']) if 'duration_minutes' in row else int(row[4])
        )
