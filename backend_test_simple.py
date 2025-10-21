#!/usr/bin/env python3
"""
TT-Manager Backend API Testing Suite - Simplified Version
Tests Sprint APIs, Labels APIs, and Enhanced Task APIs
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "http://localhost:3000/api"

def log(message, level="INFO"):
    """Log messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def test_backend_apis():
    """Test all backend APIs"""
    log("Starting TT-Manager Backend API Tests...")
    
    # Setup: Register user and get token
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    register_data = {
        "email": test_email,
        "password": "testpassword123",
        "name": "Test User"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    if response.status_code != 200:
        log(f"❌ Registration failed: {response.status_code}", "ERROR")
        return False
    
    token = response.json().get("token")
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    log("✅ User registered and authenticated")
    
    # Create team
    team_data = {"name": f"Test Team {uuid.uuid4().hex[:8]}"}
    response = requests.post(f"{BASE_URL}/teams", json=team_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Team creation failed: {response.status_code}", "ERROR")
        return False
    team_id = response.json().get("team", {}).get("id")
    log("✅ Team created")
    
    # Create project
    project_data = {
        "teamId": team_id,
        "name": f"Test Project {uuid.uuid4().hex[:8]}",
        "key": f"TP{uuid.uuid4().hex[:4].upper()}",
        "description": "Test project"
    }
    response = requests.post(f"{BASE_URL}/projects", json=project_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Project creation failed: {response.status_code}", "ERROR")
        return False
    project_id = response.json().get("project", {}).get("id")
    log("✅ Project created")
    
    # Create board
    board_data = {
        "projectId": project_id,
        "title": f"Test Board {uuid.uuid4().hex[:8]}"
    }
    response = requests.post(f"{BASE_URL}/boards", json=board_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Board creation failed: {response.status_code}", "ERROR")
        return False
    board_result = response.json()
    board_id = board_result.get("board", {}).get("id")
    column_id = board_result.get("board", {}).get("columns", [{}])[0].get("id")
    log("✅ Board and columns created")
    
    # Create tasks
    task_ids = []
    for i in range(3):
        task_data = {
            "projectId": project_id,
            "boardId": board_id,
            "columnId": column_id,
            "title": f"Test Task {i+1}",
            "description": f"Task {i+1} for testing",
            "priority": "medium"
        }
        response = requests.post(f"{BASE_URL}/tasks", json=task_data, headers=headers)
        if response.status_code != 200:
            log(f"❌ Task {i+1} creation failed: {response.status_code}", "ERROR")
            return False
        task_id = response.json().get("task", {}).get("id")
        task_ids.append(task_id)
    log("✅ Tasks created")
    
    # Test Sprint APIs
    log("=== Testing Sprint APIs ===")
    
    # Create sprint
    sprint_data = {
        "projectId": project_id,
        "name": f"Test Sprint {uuid.uuid4().hex[:8]}",
        "goal": "Test sprint goal"
    }
    response = requests.post(f"{BASE_URL}/sprints", json=sprint_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Sprint creation failed: {response.status_code}", "ERROR")
        return False
    sprint_id = response.json().get("sprint", {}).get("id")
    log("✅ Sprint created")
    
    # Get sprints
    response = requests.get(f"{BASE_URL}/sprints?projectId={project_id}", headers=headers)
    if response.status_code != 200:
        log(f"❌ Get sprints failed: {response.status_code}", "ERROR")
        return False
    sprints = response.json().get("sprints", [])
    if len(sprints) == 0:
        log("❌ No sprints returned", "ERROR")
        return False
    log("✅ Sprints retrieved")
    
    # Get single sprint
    response = requests.get(f"{BASE_URL}/sprints/{sprint_id}", headers=headers)
    if response.status_code != 200:
        log(f"❌ Get single sprint failed: {response.status_code}", "ERROR")
        return False
    log("✅ Single sprint retrieved")
    
    # Update sprint
    update_data = {"name": f"Updated Sprint {uuid.uuid4().hex[:8]}"}
    response = requests.put(f"{BASE_URL}/sprints/{sprint_id}", json=update_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Sprint update failed: {response.status_code}", "ERROR")
        return False
    log("✅ Sprint updated")
    
    # Add tasks to sprint
    add_tasks_data = {"action": "addTasks", "taskIds": task_ids[:2]}
    response = requests.patch(f"{BASE_URL}/sprints/{sprint_id}", json=add_tasks_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Add tasks to sprint failed: {response.status_code}", "ERROR")
        return False
    log("✅ Tasks added to sprint")
    
    # Start sprint
    start_data = {"action": "start"}
    response = requests.patch(f"{BASE_URL}/sprints/{sprint_id}", json=start_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Start sprint failed: {response.status_code}", "ERROR")
        return False
    log("✅ Sprint started")
    
    # Complete sprint
    complete_data = {"action": "complete"}
    response = requests.patch(f"{BASE_URL}/sprints/{sprint_id}", json=complete_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Complete sprint failed: {response.status_code}", "ERROR")
        return False
    log("✅ Sprint completed")
    
    # Test Labels APIs
    log("=== Testing Labels APIs ===")
    
    # Create labels
    label_ids = []
    labels_data = [
        {"projectId": project_id, "name": "Bug", "color": "#FF5733"},
        {"projectId": project_id, "name": "Feature", "color": "#33FF57"},
        {"projectId": project_id, "name": "Enhancement", "color": "#3357FF"}
    ]
    
    for label_data in labels_data:
        response = requests.post(f"{BASE_URL}/labels", json=label_data, headers=headers)
        if response.status_code != 200:
            log(f"❌ Label creation failed: {response.status_code}", "ERROR")
            return False
        label_id = response.json().get("label", {}).get("id")
        label_ids.append(label_id)
    log("✅ Labels created")
    
    # Get labels
    response = requests.get(f"{BASE_URL}/labels?projectId={project_id}", headers=headers)
    if response.status_code != 200:
        log(f"❌ Get labels failed: {response.status_code}", "ERROR")
        return False
    labels = response.json().get("labels", [])
    if len(labels) != 3:
        log(f"❌ Expected 3 labels, got {len(labels)}", "ERROR")
        return False
    log("✅ Labels retrieved")
    
    # Update label
    update_data = {"name": "Critical Bug", "color": "#FF0000"}
    response = requests.put(f"{BASE_URL}/labels/{label_ids[0]}", json=update_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Label update failed: {response.status_code}", "ERROR")
        return False
    log("✅ Label updated")
    
    # Test Enhanced Task APIs
    log("=== Testing Enhanced Task APIs ===")
    
    # Create new sprint for task testing
    sprint_data = {"projectId": project_id, "name": "Task Test Sprint"}
    response = requests.post(f"{BASE_URL}/sprints", json=sprint_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Task test sprint creation failed: {response.status_code}", "ERROR")
        return False
    test_sprint_id = response.json().get("sprint", {}).get("id")
    
    # Update task with sprint, story points, and labels
    update_data = {
        "sprintId": test_sprint_id,
        "storyPoints": 5,
        "labels": label_ids[:2]
    }
    response = requests.patch(f"{BASE_URL}/tasks/{task_ids[0]}", json=update_data, headers=headers)
    if response.status_code != 200:
        log(f"❌ Task update failed: {response.status_code}", "ERROR")
        return False
    
    # Verify task update
    updated_task = response.json().get("task", {})
    if updated_task.get("sprintId") != test_sprint_id:
        log("❌ Sprint ID not updated correctly", "ERROR")
        return False
    if updated_task.get("storyPoints") != 5:
        log("❌ Story points not updated correctly", "ERROR")
        return False
    if len(updated_task.get("labels", [])) != 2:
        log("❌ Labels not updated correctly", "ERROR")
        return False
    log("✅ Task updated with sprint, story points, and labels")
    
    # Get task with full details
    response = requests.get(f"{BASE_URL}/tasks/{task_ids[0]}", headers=headers)
    if response.status_code != 200:
        log(f"❌ Get task details failed: {response.status_code}", "ERROR")
        return False
    
    task = response.json().get("task", {})
    expected_fields = ["id", "title", "description", "assignee", "creator", "labels", "comments", "attachments"]
    for field in expected_fields:
        if field not in task:
            log(f"❌ Missing field in task details: {field}", "ERROR")
            return False
    log("✅ Task details retrieved with all fields")
    
    # Test Error Cases
    log("=== Testing Error Cases ===")
    
    # Test unauthorized access
    response = requests.get(f"{BASE_URL}/sprints?projectId={project_id}")
    if response.status_code != 401:
        log(f"❌ Should reject unauthorized access: {response.status_code}", "ERROR")
        return False
    log("✅ Unauthorized access properly rejected")
    
    # Test invalid sprint ID
    fake_sprint_id = str(uuid.uuid4())
    response = requests.get(f"{BASE_URL}/sprints/{fake_sprint_id}", headers=headers)
    if response.status_code != 404:
        log(f"❌ Should reject invalid sprint ID: {response.status_code}", "ERROR")
        return False
    log("✅ Invalid sprint ID properly rejected")
    
    # Test invalid color format
    invalid_color_data = {"projectId": project_id, "name": "Invalid", "color": "invalid-color"}
    response = requests.post(f"{BASE_URL}/labels", json=invalid_color_data, headers=headers)
    if response.status_code not in [400, 500]:
        log(f"❌ Should reject invalid color: {response.status_code}", "ERROR")
        return False
    log("✅ Invalid color format properly rejected")
    
    # Cleanup
    log("=== Cleaning Up ===")
    
    # Delete sprints
    requests.delete(f"{BASE_URL}/sprints/{sprint_id}", headers=headers)
    requests.delete(f"{BASE_URL}/sprints/{test_sprint_id}", headers=headers)
    
    # Delete labels
    for label_id in label_ids:
        requests.delete(f"{BASE_URL}/labels/{label_id}", headers=headers)
    
    # Delete tasks
    for task_id in task_ids:
        requests.delete(f"{BASE_URL}/tasks/{task_id}", headers=headers)
    
    log("✅ Cleanup completed")
    
    log("🎉 ALL BACKEND API TESTS PASSED!")
    return True

def main():
    """Main function"""
    try:
        success = test_backend_apis()
        sys.exit(0 if success else 1)
    except Exception as e:
        log(f"Test error: {str(e)}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()