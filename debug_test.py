#!/usr/bin/env python3
"""
Debug test for Phase 2 APIs
"""

import requests
import json
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000/api"
HEADERS = {"Content-Type": "application/json"}

def make_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = HEADERS.copy()
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        
        print(f"{method} {endpoint} -> {response.status_code}")
        if response.status_code != 200:
            print(f"Error: {response.text}")
        return response
    except Exception as e:
        print(f"Exception: {e}")
        return None

def main():
    print("=== Debug Test ===")
    
    # Register users
    user1_data = {
        "email": f"user1_{uuid.uuid4().hex[:8]}@example.com",
        "password": "test123",
        "name": "User 1"
    }
    
    user2_data = {
        "email": f"user2_{uuid.uuid4().hex[:8]}@example.com", 
        "password": "test123",
        "name": "User 2"
    }
    
    # Register User 1
    response = make_request("POST", "/auth/register", user1_data)
    if not response or response.status_code != 200:
        print("Failed to register user1")
        return
    
    user1_result = response.json()
    user1_token = user1_result.get("token")
    user1_id = user1_result.get("user", {}).get("id")
    
    # Register User 2
    response = make_request("POST", "/auth/register", user2_data)
    if not response or response.status_code != 200:
        print("Failed to register user2")
        return
    
    user2_result = response.json()
    user2_token = user2_result.get("token")
    user2_id = user2_result.get("user", {}).get("id")
    
    print(f"User1 ID: {user1_id}")
    print(f"User2 ID: {user2_id}")
    
    # Create team
    team_data = {"name": f"Test Team {uuid.uuid4().hex[:8]}"}
    response = make_request("POST", "/teams", team_data, user1_token)
    if not response or response.status_code != 200:
        print("Failed to create team")
        return
    
    team_id = response.json().get("team", {}).get("id")
    print(f"Team ID: {team_id}")
    
    # Create project
    project_data = {
        "teamId": team_id,
        "name": f"Test Project {uuid.uuid4().hex[:8]}",
        "key": f"TP{uuid.uuid4().hex[:4].upper()}",
        "description": "Test project"
    }
    
    response = make_request("POST", "/projects", project_data, user1_token)
    if not response or response.status_code != 200:
        print("Failed to create project")
        return
    
    project_id = response.json().get("project", {}).get("id")
    print(f"Project ID: {project_id}")
    
    # Add User2 to project first
    add_member_data = {
        "email": user2_data["email"],
        "role": "member"
    }
    
    response = make_request("POST", f"/projects/{project_id}/members", add_member_data, user1_token)
    if response and response.status_code == 200:
        print("✅ User2 added to project")
    else:
        print("❌ Failed to add User2 to project")
        return
    
    # Create board and task
    board_data = {
        "projectId": project_id,
        "title": f"Test Board {uuid.uuid4().hex[:8]}",
        "background": "#f0f0f0"
    }
    
    response = make_request("POST", "/boards", board_data, user1_token)
    if not response or response.status_code != 200:
        print("Failed to create board")
        return
    
    board_result = response.json()
    board_id = board_result.get("board", {}).get("id")
    columns = board_result.get("board", {}).get("columns", [])
    column_id = columns[0].get("id") if columns else None
    
    if not column_id:
        print("No column ID")
        return
    
    # Create task
    task_data = {
        "projectId": project_id,
        "boardId": board_id,
        "columnId": column_id,
        "title": "Test Task",
        "description": "Test task for comments",
        "priority": "high"
    }
    
    response = make_request("POST", "/tasks", task_data, user1_token)
    if not response or response.status_code != 200:
        print("Failed to create task")
        return
    
    task_id = response.json().get("task", {}).get("id")
    print(f"Task ID: {task_id}")
    
    # Test comment creation by User2 (now a project member)
    comment_data = {
        "taskId": task_id,
        "body": "Test comment from User2"
    }
    
    print("\n=== Testing Comment Creation by User2 ===")
    response = make_request("POST", "/comments", comment_data, user2_token)
    if response and response.status_code == 200:
        print("✅ Comment created by User2")
    else:
        print("❌ Comment creation failed")
    
    # Test calendar event creation
    print("\n=== Testing Calendar Event Creation ===")
    event_data = {
        "title": "Test Event",
        "startTime": (datetime.now() + timedelta(hours=1)).isoformat(),
        "endTime": (datetime.now() + timedelta(hours=2)).isoformat(),
        "type": "meeting"
    }
    
    response = make_request("POST", "/calendar", event_data, user1_token)
    if response and response.status_code == 200:
        print("✅ Calendar event created")
        event_id = response.json().get("event", {}).get("id")
        
        # Test unauthorized update
        print("\n=== Testing Unauthorized Event Update ===")
        update_data = {"title": "Updated by User2"}
        response = make_request("PUT", f"/calendar/{event_id}", update_data, user2_token)
        if response and response.status_code == 403:
            print("✅ Unauthorized update properly blocked")
        else:
            print(f"❌ Should block unauthorized update: {response.status_code if response else 'No response'}")
    else:
        print("❌ Calendar event creation failed")

if __name__ == "__main__":
    main()