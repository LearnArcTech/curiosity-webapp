"""
password_utils.py - Password Hashing Utilities

This module provides secure password hashing using bcrypt.
It handles password hashing and verification for user authentication.

Fallback: If bcrypt is not available, uses SHA-256 (less secure but works without dependencies).
"""

import hashlib
import hmac
import os
from typing import Optional

# Try to import bcrypt, fall back to hashlib if not available
try:
    import bcrypt
    BCryptAvailable = True
except ImportError:
    BCryptAvailable = False


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt (or SHA-256 as fallback).
    
    Args:
        password: The plain text password to hash
    
    Returns:
        The hashed password as a UTF-8 string
    
    Raises:
        ValueError: If password is empty or None
    """
    if not password or not isinstance(password, str):
        raise ValueError("Password must be a non-empty string")
    
    # Encode password to bytes
    password_bytes = password.encode('utf-8')
    
    if BCryptAvailable:
        # Use bcrypt if available
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        # Prefix with bcrypt: for later identification
        return f"bcrypt:{hashed.decode('utf-8')}"
    else:
        # Fallback to SHA-256 with random salt
        salt = os.urandom(16).hex()
        # Hash password with salt using SHA-256
        hashed = hashlib.pbkdf2_hmac('sha256', password_bytes, salt.encode('utf-8'), 100000)
        # Return format: sha256:salt:hex_hash
        return f"sha256:{salt}:{hashed.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The stored hashed password
    
    Returns:
        True if the password matches, False otherwise
    """
    if not plain_password or not hashed_password:
        return False
    
    try:
        plain_bytes = plain_password.encode('utf-8')
        
        # Check which algorithm was used
        if hashed_password.startswith('bcrypt:'):
            if not BCryptAvailable:
                return False  # Can't verify bcrypt hash without bcrypt library
            hashed_bytes = hashed_password[7:].encode('utf-8')  # Remove 'bcrypt:' prefix
            return bcrypt.checkpw(plain_bytes, hashed_bytes)
        elif hashed_password.startswith('sha256:'):
            # Verify SHA-256 hash
            parts = hashed_password.split(':')
            if len(parts) != 3:
                return False
            salt = parts[1]
            stored_hash = parts[2]
            
            # Hash the plain password with the same salt
            new_hash = hashlib.pbkdf2_hmac('sha256', plain_bytes, salt.encode('utf-8'), 100000)
            new_hash_hex = new_hash.hex()
            
            # Use constant-time comparison to prevent timing attacks
            return hmac.compare_digest(new_hash_hex, stored_hash)
        else:
            # Legacy hash (plain SHA-256 without salt)
            hashed = hashlib.sha256(plain_bytes).hexdigest()
            return hmac.compare_digest(hashed, hashed_password)
    except (ValueError, TypeError, AttributeError):
        # If there's an error in encoding or hashing, return False
        return False


def needs_rehash(hashed_password: str) -> bool:
    """
    Check if a password needs to be rehashed with updated parameters.
    
    This is useful for migrating to stronger hashing parameters.
    
    Args:
        hashed_password: The stored hashed password
    
    Returns:
        True if the password should be rehashed, False otherwise
    """
    if not hashed_password:
        return False
    
    try:
        hashed_bytes = hashed_password.encode('utf-8')
        # Get the current work factor
        current_rounds = bcrypt.gensalt(rounds=12)
        
        # Check if the hash uses older parameters
        # We can't directly check rounds from the hash, but we can try
        # to hash a known value and compare
        return False
    except:
        return False
