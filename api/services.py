"""
services.py - Business Logic Services

This module contains the service layer that handles business logic for:
- User authentication and management
- Course management
- Enrollment management
- Session management

These services use the models and database to perform operations.
"""

import sqlite3
from typing import Any, Dict, List, Optional, Tuple
from .database import get_db, get_row_as_dict, get_rows_as_list
from .models import User, Course, Enrollment, Session, SessionAttendance
from .utils import (
    is_valid_email, is_valid_password, sanitize_input, 
    ValidationError, NotFoundError, AuthorizationError, AuthError,
    ERROR_MESSAGES
)
from .password_utils import hash_password, verify_password


class AuthService:
    """Authentication service for user management."""
    
    @staticmethod
    def register_user(user_data: Dict[str, Any]) -> User:
        """
        Register a new user.
        
        Args:
            user_data: Dictionary containing user registration data
                      (email, password, name, role)
        
        Returns:
            The created User object
        
        Raises:
            ValidationError: If validation fails
            AuthError: If user already exists
        """
        # Validate required fields
        if not user_data:
            raise ValidationError(ERROR_MESSAGES['INVALID_REQUEST'])
        
        email = user_data.get('email')
        password = user_data.get('password')
        name = user_data.get('name')
        role = user_data.get('role')
        
        if not email or not isinstance(email, str):
            raise ValidationError(ERROR_MESSAGES['INVALID_EMAIL'])
        
        if not password or not isinstance(password, str):
            raise ValidationError(ERROR_MESSAGES['PASSWORD_TOO_SHORT'])
        
        if not is_valid_email(email):
            raise ValidationError(ERROR_MESSAGES['INVALID_EMAIL'])
        
        if not is_valid_password(password):
            raise ValidationError(ERROR_MESSAGES['PASSWORD_TOO_SHORT'])
        
        # Check if user already exists
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            raise AuthError(ERROR_MESSAGES['USER_EXISTS'], error_code='USER_EXISTS')
        
        # Hash the password
        try:
            password_hash = hash_password(password)
        except ValueError:
            raise ValidationError(ERROR_MESSAGES['PASSWORD_TOO_SHORT'])
        
        # Create user
        user = User(
            email=email,
            name=name,
            password_hash=password_hash,
            role=role
        )
        
        # Save to database
        cursor.execute(
            """INSERT INTO users 
               (id, email, name, password_hash, role, is_guest, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user.id,
                user.email,
                user.name,
                user.password_hash,
                user.role,
                0,  # is_guest
                user.created_at,
                user.updated_at
            )
        )
        
        conn.commit()
        
        return user
    
    @staticmethod
    def login_user(email: str, password: str) -> User:
        """
        Authenticate a user.
        
        Args:
            email: User's email
            password: User's password
        
        Returns:
            The User object (without password hash)
        
        Raises:
            ValidationError: If validation fails
            AuthError: If credentials are invalid
        """
        if not email or not password:
            raise AuthError(ERROR_MESSAGES['INVALID_CREDENTIALS'])
        
        if not is_valid_email(email):
            raise ValidationError(ERROR_MESSAGES['INVALID_EMAIL'])
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user by email
        cursor.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        )
        row = cursor.fetchone()
        
        if not row:
            raise AuthError(ERROR_MESSAGES['INVALID_CREDENTIALS'])
        
        user = User.from_db_row(row)
        
        # Verify password
        if not verify_password(password, user.password_hash):
            raise AuthError(ERROR_MESSAGES['INVALID_CREDENTIALS'])
        
        return user
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """
        Get a user by email.
        
        Args:
            email: User's email
        
        Returns:
            User object or None if not found
        """
        if not email or not is_valid_email(email):
            return None
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return User.from_db_row(row)
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """
        Get a user by ID.
        
        Args:
            user_id: User's ID
        
        Returns:
            User object or None if not found
        """
        if not user_id:
            return None
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return User.from_db_row(row)
    
    @staticmethod
    def update_user(user_id: str, updates: Dict[str, Any]) -> User:
        """
        Update user information.
        
        Args:
            user_id: User's ID
            updates: Dictionary of fields to update
        
        Returns:
            Updated User object
        
        Raises:
            NotFoundError: If user not found
        """
        conn = get_db()
        cursor = conn.cursor()
        
        # Get current user
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        
        if not row:
            raise NotFoundError('User not found', resource_type='user')
        
        user = User.from_db_row(row)
        
        # Update fields
        if 'name' in updates:
            user.name = sanitize_input(updates['name'])
        if 'role' in updates:
            user.role = updates['role']
        if 'email' in updates:
            if is_valid_email(updates['email']):
                user.email = updates['email']
        
        user.updated_at = user.updated_at  # Update timestamp
        
        # Save updates
        cursor.execute(
            """UPDATE users 
               SET name = ?, email = ?, role = ?, updated_at = ?
               WHERE id = ?""",
            (user.name, user.email, user.role, user.updated_at, user.id)
        )
        
        conn.commit()
        
        return user
    
    @staticmethod
    def update_user_role(user_id: str, role: str) -> User:
        """
        Update a user's role.
        
        Args:
            user_id: User's ID
            role: New role (student or teacher)
        
        Returns:
            Updated User object
        
        Raises:
            NotFoundError: If user not found
            ValidationError: If role is invalid
        """
        if role not in ['student', 'teacher']:
            raise ValidationError('Invalid role. Must be "student" or "teacher"')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get current user
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        
        if not row:
            raise NotFoundError('User not found', resource_type='user')
        
        user = User.from_db_row(row)
        user.role = role
        
        # Save updates
        cursor.execute(
            "UPDATE users SET role = ?, updated_at = ? WHERE id = ?",
            (user.role, user.updated_at, user.id)
        )
        
        conn.commit()
        
        return user
    
    @staticmethod
    def get_all_users() -> List[Dict[str, Any]]:
        """
        Get all users (for admin purposes).
        
        Returns:
            List of user dictionaries (without password hashes)
        """
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, email, name, role, is_guest, created_at, updated_at FROM users"
        )
        
        return get_rows_as_list(cursor)


class CourseService:
    """Service for course management."""
    
    @staticmethod
    def create_course(course_data: Dict[str, Any], teacher_id: str) -> Course:
        """
        Create a new course.
        
        Args:
            course_data: Dictionary containing course data (name, description)
            teacher_id: ID of the teacher creating the course
        
        Returns:
            The created Course object
        
        Raises:
            ValidationError: If validation fails
        """
        if not course_data:
            raise ValidationError(ERROR_MESSAGES['INVALID_REQUEST'])
        
        name = course_data.get('name')
        description = course_data.get('description')
        code = course_data.get('code')
        
        if not name or not isinstance(name, str):
            raise ValidationError('Course name is required')
        
        # Generate unique course code if not provided
        if not code:
            code = CourseService._generate_unique_code()
        
        course = Course(
            name=name,
            description=description,
            code=code,
            teacher_id=teacher_id
        )
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if code already exists
        cursor.execute("SELECT id FROM courses WHERE code = ?", (code,))
        existing = cursor.fetchone()
        
        if existing and code != existing[0]:
            # Generate a new unique code
            code = CourseService._generate_unique_code()
            course.code = code
        
        cursor.execute(
            """INSERT INTO courses 
               (id, code, name, description, teacher_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                course.id,
                course.code,
                course.name,
                course.description,
                course.teacher_id,
                course.created_at,
                course.updated_at
            )
        )
        
        conn.commit()
        
        return course
    
    @staticmethod
    def _generate_unique_code() -> str:
        """Generate a unique course code."""
        import random
        import string
        
        conn = get_db()
        cursor = conn.cursor()
        
        for _ in range(100):  # Try up to 100 times
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            cursor.execute("SELECT id FROM courses WHERE code = ?", (code,))
            if not cursor.fetchone():
                return code
        
        # Fallback: use UUID
        return CourseService._generate_unique_code()
    
    @staticmethod
    def get_course_by_id(course_id: str) -> Optional[Course]:
        """
        Get a course by ID.
        
        Args:
            course_id: Course ID
        
        Returns:
            Course object or None if not found
        """
        if not course_id:
            return None
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM courses WHERE id = ?", (course_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return Course.from_db_row(row)
    
    @staticmethod
    def get_course_by_code(code: str) -> Optional[Course]:
        """
        Get a course by its code.
        
        Args:
            code: Course code
        
        Returns:
            Course object or None if not found
        """
        if not code:
            return None
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM courses WHERE code = ?", (code.upper(),))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return Course.from_db_row(row)
    
    @staticmethod
    def get_courses_by_teacher(teacher_id: str) -> List[Course]:
        """
        Get all courses taught by a specific teacher.
        
        Args:
            teacher_id: Teacher's user ID
        
        Returns:
            List of Course objects
        """
        if not teacher_id:
            return []
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT * FROM courses WHERE teacher_id = ? ORDER BY created_at DESC",
            (teacher_id,)
        )
        
        return [Course.from_db_row(row) for row in cursor.fetchall()]
    
    @staticmethod
    def get_student_courses(student_id: str) -> List[Dict[str, Any]]:
        """
        Get all courses a student is enrolled in.
        
        Args:
            student_id: Student's user ID
        
        Returns:
            List of course dictionaries with enrollment info
        """
        if not student_id:
            return []
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT c.*, e.id as enrollment_id, e.enrolled_at, e.progress
               FROM courses c
               JOIN enrollments e ON c.id = e.course_id
               WHERE e.student_id = ?
               ORDER BY e.enrolled_at DESC""",
            (student_id,)
        )
        
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    @staticmethod
    def get_all_courses() -> List[Course]:
        """
        Get all courses.
        
        Returns:
            List of all Course objects
        """
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM courses ORDER BY created_at DESC")
        
        return [Course.from_db_row(row) for row in cursor.fetchall()]
    
    @staticmethod
    def update_course(course_id: str, updates: Dict[str, Any], teacher_id: str) -> Course:
        """
        Update a course.
        
        Args:
            course_id: Course ID
            updates: Dictionary of fields to update
            teacher_id: Teacher's ID (for authorization)
        
        Returns:
            Updated Course object
        
        Raises:
            NotFoundError: If course not found
            AuthorizationError: If teacher doesn't own the course
        """
        conn = get_db()
        cursor = conn.cursor()
        
        # Get current course
        cursor.execute("SELECT * FROM courses WHERE id = ?", (course_id,))
        row = cursor.fetchone()
        
        if not row:
            raise NotFoundError('Course not found', resource_type='course')
        
        course = Course.from_db_row(row)
        
        # Check authorization
        if course.teacher_id != teacher_id:
            raise AuthorizationError('Only the course teacher can update this course')
        
        # Update fields
        if 'name' in updates:
            course.name = sanitize_input(updates['name'])
        if 'description' in updates:
            course.description = sanitize_input(updates['description'])
        
        # Save updates
        cursor.execute(
            """UPDATE courses 
               SET name = ?, description = ?, updated_at = ?
               WHERE id = ?""",
            (course.name, course.description, course.updated_at, course.id)
        )
        
        conn.commit()
        
        return course
    
    @staticmethod
    def delete_course(course_id: str, teacher_id: str) -> bool:
        """
        Delete a course.
        
        Args:
            course_id: Course ID
            teacher_id: Teacher's ID (for authorization)
        
        Returns:
            True if deleted, False otherwise
        
        Raises:
            NotFoundError: If course not found
            AuthorizationError: If teacher doesn't own the course
        """
        conn = get_db()
        cursor = conn.cursor()
        
        # Get current course
        cursor.execute("SELECT * FROM courses WHERE id = ?", (course_id,))
        row = cursor.fetchone()
        
        if not row:
            raise NotFoundError('Course not found', resource_type='course')
        
        course = Course.from_db_row(row)
        
        # Check authorization
        if course.teacher_id != teacher_id:
            raise AuthorizationError('Only the course teacher can delete this course')
        
        # Delete course (cascade will delete related records)
        cursor.execute("DELETE FROM courses WHERE id = ?", (course_id,))
        
        conn.commit()
        
        return True


class EnrollmentService:
    """Service for enrollment management."""
    
    @staticmethod
    def enroll_student(student_id: str, course_code: str) -> Enrollment:
        """
        Enroll a student in a course using the course code.
        
        Args:
            student_id: Student's user ID
            course_code: Course code
        
        Returns:
            The created Enrollment object
        
        Raises:
            ValidationError: If validation fails
            NotFoundError: If course not found
            AuthorizationError: If user is not a student
        """
        if not student_id or not course_code:
            raise ValidationError(ERROR_MESSAGES['INVALID_REQUEST'])
        
        # Get course by code
        course = CourseService.get_course_by_code(course_code)
        if not course:
            raise NotFoundError('Course not found', resource_type='course')
        
        # Check if user is a student
        student = AuthService.get_user_by_id(student_id)
        if not student:
            raise NotFoundError('User not found', resource_type='user')
        
        if not student.is_student():
            raise AuthorizationError('Only students can enroll in courses')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check for existing enrollment
        cursor.execute(
            "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?",
            (student_id, course.id)
        )
        existing = cursor.fetchone()
        
        if existing:
            raise ValidationError(ERROR_MESSAGES['DUPLICATE_ENROLLMENT'])
        
        # Create enrollment
        enrollment = Enrollment(
            student_id=student_id,
            course_id=course.id
        )
        
        cursor.execute(
            """INSERT INTO enrollments 
               (id, student_id, course_id, enrolled_at, progress)
               VALUES (?, ?, ?, ?, ?)""",
            (
                enrollment.id,
                enrollment.student_id,
                enrollment.course_id,
                enrollment.enrolled_at,
                enrollment.progress
            )
        )
        
        conn.commit()
        
        return enrollment
    
    @staticmethod
    def get_enrollment_by_id(enrollment_id: str) -> Optional[Enrollment]:
        """
        Get an enrollment by ID.
        
        Args:
            enrollment_id: Enrollment ID
        
        Returns:
            Enrollment object or None if not found
        """
        if not enrollment_id:
            return None
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM enrollments WHERE id = ?", (enrollment_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return Enrollment.from_db_row(row)
    
    @staticmethod
    def get_enrollments_by_student(student_id: str) -> List[Enrollment]:
        """
        Get all enrollments for a student.
        
        Args:
            student_id: Student's user ID
        
        Returns:
            List of Enrollment objects
        """
        if not student_id:
            return []
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT * FROM enrollments WHERE student_id = ?",
            (student_id,)
        )
        
        return [Enrollment.from_db_row(row) for row in cursor.fetchall()]
    
    @staticmethod
    def get_students_by_course(course_id: str) -> List[Dict[str, Any]]:
        """
        Get all students enrolled in a course.
        
        Args:
            course_id: Course ID
        
        Returns:
            List of user dictionaries
        """
        if not course_id:
            return []
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT u.id, u.email, u.name, u.role, u.is_guest, u.created_at, u.updated_at
               FROM users u
               JOIN enrollments e ON u.id = e.student_id
               WHERE e.course_id = ?
               ORDER BY u.name, u.email""",
            (course_id,)
        )
        
        return get_rows_as_list(cursor)
    
    @staticmethod
    def update_enrollment_progress(enrollment_id: str, progress: float, student_id: str) -> Enrollment:
        """
        Update a student's progress in a course.
        
        Args:
            enrollment_id: Enrollment ID
            progress: Progress percentage (0.0 to 100.0)
            student_id: Student's ID (for authorization)
        
        Returns:
            Updated Enrollment object
        
        Raises:
            NotFoundError: If enrollment not found
            AuthorizationError: If student doesn't own the enrollment
        """
        conn = get_db()
        cursor = conn.cursor()
        
        # Get current enrollment
        cursor.execute("SELECT * FROM enrollments WHERE id = ?", (enrollment_id,))
        row = cursor.fetchone()
        
        if not row:
            raise NotFoundError('Enrollment not found', resource_type='enrollment')
        
        enrollment = Enrollment.from_db_row(row)
        
        # Check authorization
        if enrollment.student_id != student_id:
            raise AuthorizationError('Only the enrolled student can update their progress')
        
        # Clamp progress between 0 and 100
        enrollment.progress = max(0.0, min(100.0, float(progress)))
        
        # Save updates
        cursor.execute(
            "UPDATE enrollments SET progress = ? WHERE id = ?",
            (enrollment.progress, enrollment.id)
        )
        
        conn.commit()
        
        return enrollment
    
    @staticmethod
    def unenroll_student(student_id: str, course_id: str) -> bool:
        """
        Unenroll a student from a course.
        
        Args:
            student_id: Student's user ID
            course_id: Course ID
        
        Returns:
            True if unenrolled, False otherwise
        
        Raises:
            NotFoundError: If enrollment not found
        """
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if enrollment exists
        cursor.execute(
            "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?",
            (student_id, course_id)
        )
        enrollment = cursor.fetchone()
        
        if not enrollment:
            raise NotFoundError('Enrollment not found', resource_type='enrollment')
        
        # Delete enrollment
        cursor.execute(
            "DELETE FROM enrollments WHERE student_id = ? AND course_id = ?",
            (student_id, course_id)
        )
        
        conn.commit()
        
        return True


class SessionService:
    """Service for session management."""
    
    @staticmethod
    def create_session(session_data: Dict[str, Any], teacher_id: str) -> Session:
        """
        Create a new session for a course.
        
        Args:
            session_data: Dictionary containing session data
            teacher_id: Teacher's ID (for authorization)
        
        Returns:
            The created Session object
        
        Raises:
            ValidationError: If validation fails
            AuthorizationError: If teacher doesn't own the course
        """
        if not session_data:
            raise ValidationError(ERROR_MESSAGES['INVALID_REQUEST'])
        
        course_id = session_data.get('course_id')
        name = session_data.get('name')
        start_time = session_data.get('start_time')
        end_time = session_data.get('end_time')
        
        if not course_id:
            raise ValidationError('Course ID is required')
        
        # Check if teacher owns the course
        course = CourseService.get_course_by_id(course_id)
        if not course:
            raise NotFoundError('Course not found', resource_type='course')
        
        if course.teacher_id != teacher_id:
            raise AuthorizationError('Only the course teacher can create sessions')
        
        session = Session(
            course_id=course_id,
            name=name or f"Session for {course.name}",
            start_time=start_time,
            end_time=end_time
        )
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            """INSERT INTO sessions 
               (id, course_id, name, start_time, end_time, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                session.id,
                session.course_id,
                session.name,
                session.start_time,
                session.end_time,
                session.created_at
            )
        )
        
        conn.commit()
        
        return session
    
    @staticmethod
    def get_session_by_id(session_id: str) -> Optional[Session]:
        """
        Get a session by ID.
        
        Args:
            session_id: Session ID
        
        Returns:
            Session object or None if not found
        """
        if not session_id:
            return None
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return Session.from_db_row(row)
    
    @staticmethod
    def get_sessions_by_course(course_id: str) -> List[Session]:
        """
        Get all sessions for a course.
        
        Args:
            course_id: Course ID
        
        Returns:
            List of Session objects
        """
        if not course_id:
            return []
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT * FROM sessions WHERE course_id = ? ORDER BY created_at DESC",
            (course_id,)
        )
        
        return [Session.from_db_row(row) for row in cursor.fetchall()]
    
    @staticmethod
    def mark_attendance(
        session_id: str, 
        student_id: str, 
        attended: bool = True,
        duration_minutes: int = 0
    ) -> SessionAttendance:
        """
        Mark a student's attendance for a session.
        
        Args:
            session_id: Session ID
            student_id: Student's user ID
            attended: Whether the student attended
            duration_minutes: Duration in minutes
        
        Returns:
            The created or updated SessionAttendance object
        """
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if attendance record exists
        cursor.execute(
            "SELECT id FROM session_attendance WHERE session_id = ? AND student_id = ?",
            (session_id, student_id)
        )
        existing = cursor.fetchone()
        
        attendance = SessionAttendance(
            session_id=session_id,
            student_id=student_id,
            attended=attended,
            duration_minutes=duration_minutes
        )
        
        if existing:
            # Update existing record
            cursor.execute(
                """UPDATE session_attendance 
                   SET attended = ?, duration_minutes = ?
                   WHERE session_id = ? AND student_id = ?""",
                (attendance.attended, attendance.duration_minutes, session_id, student_id)
            )
        else:
            # Create new record
            cursor.execute(
                """INSERT INTO session_attendance 
                   (id, session_id, student_id, attended, duration_minutes)
                   VALUES (?, ?, ?, ?, ?)""",
                (
                    attendance.id,
                    attendance.session_id,
                    attendance.student_id,
                    attendance.attended,
                    attendance.duration_minutes
                )
            )
        
        conn.commit()
        
        return attendance
    
    @staticmethod
    def get_session_attendance(session_id: str) -> List[Dict[str, Any]]:
        """
        Get attendance records for a session.
        
        Args:
            session_id: Session ID
        
        Returns:
            List of attendance records with student info
        """
        if not session_id:
            return []
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT sa.*, u.name, u.email
               FROM session_attendance sa
               JOIN users u ON sa.student_id = u.id
               WHERE sa.session_id = ?
               ORDER BY u.name, u.email""",
            (session_id,)
        )
        
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
