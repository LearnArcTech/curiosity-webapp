#!/usr/bin/env python3
"""
test_api.py - Test Script for Curiosity API

This script tests the API endpoints locally without requiring Vercel deployment.
It creates a simple HTTP-like request object that matches what Vercel provides.
"""

import sys
import os
import json
import tempfile
import sqlite3

# Add the api directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set the database path to a temporary file
os.environ['CURIOSITY_DB_PATH'] = tempfile.mktemp(suffix='.db')

from database import db, DB_PATH
from services import AuthService, CourseService, EnrollmentService
from models import User, Course, Enrollment
from password_utils import hash_password, verify_password


def test_database():
    """Test database initialization."""
    print("🧪 Testing database initialization...")
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Check if tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    expected_tables = ['users', 'courses', 'enrollments', 'sessions', 'session_attendance']
    
    for table in expected_tables:
        if table in tables:
            print(f"  ✅ Table '{table}' exists")
        else:
            print(f"  ❌ Table '{table}' missing")
    
    print()


def test_password_hashing():
    """Test password hashing."""
    print("🧪 Testing password hashing...")
    
    password = "test123"
    
    # Hash password
    hashed = hash_password(password)
    print(f"  ✅ Password hashed successfully")
    
    # Verify password
    if verify_password(password, hashed):
        print(f"  ✅ Password verification successful")
    else:
        print(f"  ❌ Password verification failed")
    
    # Wrong password
    if not verify_password("wrong", hashed):
        print(f"  ✅ Wrong password correctly rejected")
    else:
        print(f"  ❌ Wrong password incorrectly accepted")
    
    print()


def test_user_registration():
    """Test user registration."""
    print("🧪 Testing user registration...")
    
    try:
        # Test valid registration
        user_data = {
            'email': 'test@example.com',
            'password': 'test123',
            'name': 'Test User',
            'role': 'student'
        }
        
        user = AuthService.register_user(user_data)
        print(f"  ✅ User registered: {user.email} (ID: {user.id})")
        
        # Try to register same user again
        try:
            AuthService.register_user(user_data)
            print(f"  ❌ Duplicate registration should have failed")
        except Exception as e:
            print(f"  ✅ Duplicate registration correctly rejected: {e}")
        
        # Test invalid email
        try:
            AuthService.register_user({
                'email': 'invalid-email',
                'password': 'test123',
                'name': 'Invalid User'
            })
            print(f"  ❌ Invalid email should have failed")
        except Exception as e:
            print(f"  ✅ Invalid email correctly rejected: {e}")
        
    except Exception as e:
        print(f"  ❌ Registration test failed: {e}")
    
    print()


def test_user_login():
    """Test user login."""
    print("🧪 Testing user login...")
    
    try:
        # First, register a user
        user_data = {
            'email': 'login@example.com',
            'password': 'login123',
            'name': 'Login User',
            'role': 'teacher'
        }
        
        user = AuthService.register_user(user_data)
        print(f"  ✅ Test user created for login")
        
        # Test correct login
        logged_in_user = AuthService.login_user('login@example.com', 'login123')
        print(f"  ✅ User logged in successfully: {logged_in_user.email}")
        
        # Test wrong password
        try:
            AuthService.login_user('login@example.com', 'wrong')
            print(f"  ❌ Wrong password should have failed")
        except Exception as e:
            print(f"  ✅ Wrong password correctly rejected: {e}")
        
        # Test non-existent user
        try:
            AuthService.login_user('nonexistent@example.com', 'anything')
            print(f"  ❌ Non-existent user should have failed")
        except Exception as e:
            print(f"  ✅ Non-existent user correctly rejected: {e}")
        
    except Exception as e:
        print(f"  ❌ Login test failed: {e}")
    
    print()


def test_course_creation():
    """Test course creation."""
    print("🧪 Testing course creation...")
    
    try:
        # First, register a teacher
        teacher_data = {
            'email': 'teacher@example.com',
            'password': 'teacher123',
            'name': 'Teacher User',
            'role': 'teacher'
        }
        
        teacher = AuthService.register_user(teacher_data)
        print(f"  ✅ Teacher created for course testing")
        
        # Create a course
        course_data = {
            'name': 'Test Course',
            'description': 'A test course for the API'
        }
        
        course = CourseService.create_course(course_data, teacher.id)
        print(f"  ✅ Course created: {course.name} (Code: {course.code})")
        
        # Get course by ID
        retrieved = CourseService.get_course_by_id(course.id)
        if retrieved and retrieved.id == course.id:
            print(f"  ✅ Course retrieved by ID successfully")
        else:
            print(f"  ❌ Course retrieval by ID failed")
        
        # Get course by code
        retrieved_by_code = CourseService.get_course_by_code(course.code)
        if retrieved_by_code and retrieved_by_code.id == course.id:
            print(f"  ✅ Course retrieved by code successfully")
        else:
            print(f"  ❌ Course retrieval by code failed")
        
    except Exception as e:
        print(f"  ❌ Course creation test failed: {e}")
    
    print()


def test_enrollment():
    """Test enrollment functionality."""
    print("🧪 Testing enrollment...")
    
    try:
        # Create teacher and student
        teacher = AuthService.register_user({
            'email': 'enroll_teacher@example.com',
            'password': 'teacher123',
            'name': 'Enrollment Teacher',
            'role': 'teacher'
        })
        
        student = AuthService.register_user({
            'email': 'enroll_student@example.com',
            'password': 'student123',
            'name': 'Enrollment Student',
            'role': 'student'
        })
        
        print(f"  ✅ Teacher and student created for enrollment testing")
        
        # Create a course
        course = CourseService.create_course({'name': 'Enrollment Test Course'}, teacher.id)
        print(f"  ✅ Course created for enrollment testing (Code: {course.code})")
        
        # Enroll student
        enrollment = EnrollmentService.enroll_student(student.id, course.code)
        print(f"  ✅ Student enrolled in course successfully")
        
        # Get enrollments for student
        student_enrollments = EnrollmentService.get_enrollments_by_student(student.id)
        if len(student_enrollments) > 0 and student_enrollments[0].course_id == course.id:
            print(f"  ✅ Student enrollments retrieved successfully")
        else:
            print(f"  ❌ Student enrollments retrieval failed")
        
        # Get students for course
        course_students = EnrollmentService.get_students_by_course(course.id)
        if len(course_students) > 0 and course_students[0]['id'] == student.id:
            print(f"  ✅ Course students retrieved successfully")
        else:
            print(f"  ❌ Course students retrieval failed")
        
    except Exception as e:
        print(f"  ❌ Enrollment test failed: {e}")
    
    print()


def test_api_endpoints():
    """Test the API endpoints with mock requests."""
    print("🧪 Testing API endpoints...")
    
    # Test registration endpoint
    try:
        from auth.register import handler as register_handler
        
        # Create a mock request
        request = {
            'method': 'POST',
            'headers': {},
            'body': json.dumps({
                'email': 'api_test@example.com',
                'password': 'api_test123',
                'name': 'API Test User',
                'role': 'student'
            }).encode('utf-8'),
            'query': {},
            'path': '/api/auth/register',
            'url': '/api/auth/register'
        }
        
        response_body, status_code, headers = register_handler(request)
        
        if status_code == 201:
            print(f"  ✅ Registration endpoint working")
        else:
            print(f"  ❌ Registration endpoint failed: {response_body}")
        
    except Exception as e:
        print(f"  ❌ Registration endpoint test failed: {e}")
    
    # Test login endpoint
    try:
        from auth.login import handler as login_handler
        
        request = {
            'method': 'POST',
            'headers': {},
            'body': json.dumps({
                'email': 'api_test@example.com',
                'password': 'api_test123'
            }).encode('utf-8'),
            'query': {},
            'path': '/api/auth/login',
            'url': '/api/auth/login'
        }
        
        response_body, status_code, headers = login_handler(request)
        
        if status_code == 200:
            print(f"  ✅ Login endpoint working")
        else:
            print(f"  ❌ Login endpoint failed: {response_body}")
        
    except Exception as e:
        print(f"  ❌ Login endpoint test failed: {e}")
    
    print()


def main():
    """Run all tests."""
    print("🚀 Curiosity API - Local Test Suite")
    print("=" * 50)
    print()
    
    try:
        # Test database
        test_database()
        
        # Test password hashing
        test_password_hashing()
        
        # Test services
        test_user_registration()
        test_user_login()
        test_course_creation()
        test_enrollment()
        
        # Test API endpoints
        test_api_endpoints()
        
        print("🎉 All tests completed!")
        print()
        print(f"💾 Database location: {DB_PATH}")
        print(f"⚠️  Remember: This is a temporary database. It will be deleted when the script exits.")
        
    except Exception as e:
        print(f"❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == '__main__':
    try:
        # Clean up temporary database on exit
        import atexit
        
        def cleanup():
            try:
                if os.path.exists(DB_PATH):
                    os.remove(DB_PATH)
                    print(f"\n🧹 Cleaned up temporary database: {DB_PATH}")
            except:
                pass
        
        atexit.register(cleanup)
        
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n👋 Test suite interrupted by user")
        sys.exit(1)
