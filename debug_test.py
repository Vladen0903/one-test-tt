#!/usr/bin/env python3
"""
Debug test for specific API issues
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "http://localhost:3000/api"
HEADERS = {"Content-Type": "application/json"}

def test_calendar_day_missing_date():
    """Test calendar day API with missing date"""
    print("Testing calendar day API with missing date...")
    
    try:
        response = requests.get(f"{BASE_URL}/calendar/day", headers=HEADERS, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

def test_board_settings_unauthorized():
    """Test board settings with unauthorized access"""
    print("Testing board settings unauthorized access...")
    
    fake_board_id = str(uuid.uuid4())
    data = {"title": "Test"}
    
    try:
        response = requests.patch(f"{BASE_URL}/boards/{fake_board_id}/settings", 
                                headers=HEADERS, json=data, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

if __name__ == "__main__":
    print("=== Debug Tests ===")
    test_calendar_day_missing_date()
    print()
    test_board_settings_unauthorized()