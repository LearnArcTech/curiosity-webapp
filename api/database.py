"""
database.py - SQLite Database Connection and Schema Management

This module handles database connections, schema initialization, and provides
utility functions for working with the SQLite database in Vercel's serverless
environment.

Note: In Vercel Serverless Functions, the filesystem is ephemeral. We use /tmp
directory which persists for the duration of a request but may be cleared between
cold starts. For production, consider using an external database.
"""

import sqlite3
import os
import json
from datetime import datetime
from typing import Optional, Dict, Any, List


# Database path - using /tmp for Vercel compatibility
DB_PATH = os.environ.get('CURIOSITY_DB_PATH', '/tmp/curiosity.db')

# Roles
ROLE_STUDENT = 'student'
ROLE_TEACHER = 'teacher'


class Database:
    """Database connection manager with automatic schema initialization."""
    
    _instance = None
    
    def __new__(cls):
        """Singleton pattern to reuse connections within the same request."""
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._connection = None
        return cls._instance
    
    def get_connection(self) -> sqlite3.Connection:
        """Get or create a database connection."""
        if self._connection is None:
            # Create /tmp directory if it doesn't exist
            os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
            
            # Connect to the database
            self._connection = sqlite3.connect(DB_PATH)
            
            # Enable foreign key support
            self._connection.execute("PRAGMA foreign_keys = ON")
            
            # Set row factory to return dictionaries
            self._connection.row_factory = sqlite3.Row
            
            # Initialize schema
            self._initialize_schema()
        
        return self._connection
    
    def _initialize_schema(self):
        """Create database tables if they don't exist."""
        conn = self._connection
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                password_hash TEXT NOT NULL,
                role TEXT,
                is_guest INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        # Courses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                teacher_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Enrollments table (many-to-many between users and courses)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS enrollments (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                enrolled_at TEXT NOT NULL,
                progress REAL DEFAULT 0.0,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE(student_id, course_id)
            )
        """)
        
        # Sessions table (for tracking course sessions)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                name TEXT,
                start_time TEXT,
                end_time TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        """)
        
        # Session attendance table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS session_attendance (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                attended INTEGER DEFAULT 0,
                duration_minutes INTEGER DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(session_id, student_id)
            )
        """)
        
        # Create indexes for better query performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)")
        
        conn.commit()
    
    def close(self):
        """Close the database connection."""
        if self._connection is not None:
            self._connection.close()
            self._connection = None
    
    def reset_instance(self):
        """Reset the singleton instance (useful for testing)."""
        if self._instance is not None:
            self._instance.close()
            self._instance = None


# Global database instance
db = Database()


def get_db() -> sqlite3.Connection:
    """Get a database connection."""
    return db.get_connection()


def dict_factory(cursor: sqlite3.Cursor, row: sqlite3.Row) -> Dict[str, Any]:
    """Convert sqlite3.Row to dictionary."""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


def get_row_as_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Convert a single row to dictionary."""
    return dict(zip(row.keys(), row))


def get_rows_as_list(cursor: sqlite3.Cursor) -> List[Dict[str, Any]]:
    """Convert cursor results to list of dictionaries."""
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]
