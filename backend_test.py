#!/usr/bin/env python3
"""
TT-Manager Backend API Testing Suite
Tests Sprint APIs, Labels APIs, and Enhanced Task APIs
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "http://localhost:3000/api"
HEADERS = {"Content-Type": "application/json"}

class TTManagerAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.auth_token = None
        self.user_id = None
        self.team_id = None
        self.project_id = None
        self.board_id = None
        self.column_id = None
        self.task_ids = []
        self.sprint_ids = []
        self.label_ids = []
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method, endpoint, data=None, auth_required=True):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.ConnectionError:
            self.log(f"Connection error to {url}", "ERROR")
            return None
        except Exception as e:
            self.log(f"Request error: {str(e)}", "ERROR")
            return None
    
    def test_user_registration_and_login(self):
        """Test user registration and login to get auth token"""
        self.log("Testing user registration and login...")
        
        # Generate unique email for testing
        test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "testpassword123"
        test_name = "Test User"
        
        # Register user
        register_data = {
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
        
        response = self.make_request("POST", "/auth/register", register_data, auth_required=False)
        if not response:
            self.log("Failed to connect to registration endpoint", "ERROR")
            return False
            
        if response.status_code != 200:
            self.log(f"Registration failed: {response.status_code} - {response.text}", "ERROR")
            return False
            
        register_result = response.json()
        self.auth_token = register_result.get("token")
        self.user_id = register_result.get("user", {}).get("id")
        
        if not self.auth_token:
            self.log("No auth token received from registration", "ERROR")
            return False
            
        self.log(f"✅ User registered successfully: {test_email}")
        
        # Test login with same credentials
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        response = self.make_request("POST", "/auth/login", login_data, auth_required=False)
        if response and response.status_code == 200:
            login_result = response.json()
            login_token = login_result.get("token")
            if login_token:
                self.log("✅ Login successful")
                return True
        
        self.log("Login test failed", "ERROR")
        return False
    
    def test_team_creation(self):
        """Create a test team"""
        self.log("Creating test team...")
        
        team_data = {
            "name": f"Test Team {uuid.uuid4().hex[:8]}"
        }
        
        response = self.make_request("POST", "/teams", team_data)
        if not response or response.status_code != 200:
            self.log(f"Team creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        team_result = response.json()
        self.team_id = team_result.get("team", {}).get("id")
        
        if not self.team_id:
            self.log("No team ID received", "ERROR")
            return False
            
        self.log(f"✅ Team created: {self.team_id}")
        return True
    
    def test_project_creation(self):
        """Create a test project"""
        self.log("Creating test project...")
        
        project_data = {
            "teamId": self.team_id,
            "name": f"Test Project {uuid.uuid4().hex[:8]}",
            "key": f"TP{uuid.uuid4().hex[:4].upper()}",
            "description": "Test project for API testing"
        }
        
        response = self.make_request("POST", "/projects", project_data)
        if not response or response.status_code != 200:
            self.log(f"Project creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        project_result = response.json()
        self.project_id = project_result.get("project", {}).get("id")
        
        if not self.project_id:
            self.log("No project ID received", "ERROR")
            return False
            
        self.log(f"✅ Project created: {self.project_id}")
        return True
    
    def test_board_and_column_creation(self):
        """Create a test board and get column ID"""
        self.log("Creating test board...")
        
        board_data = {
            "projectId": self.project_id,
            "title": f"Test Board {uuid.uuid4().hex[:8]}",
            "background": "#f0f0f0"
        }
        
        response = self.make_request("POST", "/boards", board_data)
        if not response or response.status_code != 200:
            self.log(f"Board creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        board_result = response.json()
        self.board_id = board_result.get("board", {}).get("id")
        columns = board_result.get("board", {}).get("columns", [])
        
        if not self.board_id or not columns:
            self.log("No board ID or columns received", "ERROR")
            return False
            
        # Get first column ID for task creation
        self.column_id = columns[0].get("id")
        
        self.log(f"✅ Board created: {self.board_id}, Column: {self.column_id}")
        return True
    
    def test_task_creation(self):
        """Create test tasks"""
        self.log("Creating test tasks...")
        
        tasks_data = [
            {
                "projectId": self.project_id,
                "boardId": self.board_id,
                "columnId": self.column_id,
                "title": "Test Task 1 - Sprint Testing",
                "description": "Task for testing sprint functionality",
                "priority": "high"
            },
            {
                "projectId": self.project_id,
                "boardId": self.board_id,
                "columnId": self.column_id,
                "title": "Test Task 2 - Label Testing",
                "description": "Task for testing label functionality",
                "priority": "medium"
            },
            {
                "projectId": self.project_id,
                "boardId": self.board_id,
                "columnId": self.column_id,
                "title": "Test Task 3 - Story Points",
                "description": "Task for testing story points",
                "priority": "low"
            }
        ]
        
        for task_data in tasks_data:
            response = self.make_request("POST", "/tasks", task_data)
            if response and response.status_code == 200:
                task_result = response.json()
                task_id = task_result.get("task", {}).get("id")
                if task_id:
                    self.task_ids.append(task_id)
                    self.log(f"✅ Task created: {task_data['title']}")
                else:
                    self.log(f"❌ Task creation failed - no ID: {task_data['title']}", "ERROR")
                    return False
            else:
                self.log(f"❌ Task creation failed: {response.status_code if response else 'No response'}", "ERROR")
                return False
        
        return len(self.task_ids) == len(tasks_data)
    
    def test_sprint_apis(self):
        """Test all Sprint API endpoints"""
        self.log("=== Testing Sprint APIs ===")
        
        # Test 1: Create Sprint
        self.log("Testing Sprint Creation...")
        sprint_data = {
            "projectId": self.project_id,
            "name": f"Test Sprint {uuid.uuid4().hex[:8]}",
            "goal": "Test sprint goal for API testing",
            "startDate": (datetime.now() + timedelta(days=1)).isoformat(),
            "endDate": (datetime.now() + timedelta(days=14)).isoformat()
        }
        
        response = self.make_request("POST", "/sprints", sprint_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Sprint creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        sprint_result = response.json()
        sprint_id = sprint_result.get("sprint", {}).get("id")
        if not sprint_id:
            self.log("❌ No sprint ID received", "ERROR")
            return False
            
        self.sprint_ids.append(sprint_id)
        self.log(f"✅ Sprint created: {sprint_id}")
        
        # Test 2: Get Sprints for Project
        self.log("Testing Get Sprints...")
        response = self.make_request("GET", f"/sprints?projectId={self.project_id}")
        if not response or response.status_code != 200:
            self.log(f"❌ Get sprints failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        sprints_result = response.json()
        sprints = sprints_result.get("sprints", [])
        if not sprints or len(sprints) == 0:
            self.log("❌ No sprints returned", "ERROR")
            return False
            
        self.log(f"✅ Retrieved {len(sprints)} sprints")
        
        # Test 3: Get Single Sprint
        self.log("Testing Get Single Sprint...")
        response = self.make_request("GET", f"/sprints/{sprint_id}")
        if not response or response.status_code != 200:
            self.log(f"❌ Get single sprint failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        single_sprint = response.json()
        if not single_sprint.get("sprint"):
            self.log("❌ No sprint data returned", "ERROR")
            return False
            
        self.log("✅ Single sprint retrieved successfully")
        
        # Test 4: Update Sprint
        self.log("Testing Sprint Update...")
        update_data = {
            "name": f"Updated Sprint {uuid.uuid4().hex[:8]}",
            "goal": "Updated sprint goal"
        }
        
        response = self.make_request("PUT", f"/sprints/{sprint_id}", update_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Sprint update failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Sprint updated successfully")
        
        # Test 5: Add Tasks to Sprint
        self.log("Testing Add Tasks to Sprint...")
        add_tasks_data = {
            "action": "addTasks",
            "taskIds": self.task_ids[:2]  # Add first 2 tasks
        }
        
        response = self.make_request("PATCH", f"/sprints/{sprint_id}", add_tasks_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Add tasks to sprint failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Tasks added to sprint successfully")
        
        # Test 6: Start Sprint
        self.log("Testing Start Sprint...")
        start_data = {"action": "start"}
        
        response = self.make_request("PATCH", f"/sprints/{sprint_id}", start_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Start sprint failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Sprint started successfully")
        
        # Test 7: Remove Tasks from Sprint
        self.log("Testing Remove Tasks from Sprint...")
        remove_tasks_data = {
            "action": "removeTasks",
            "taskIds": [self.task_ids[0]]  # Remove first task
        }
        
        response = self.make_request("PATCH", f"/sprints/{sprint_id}", remove_tasks_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Remove tasks from sprint failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Tasks removed from sprint successfully")
        
        # Test 8: Complete Sprint
        self.log("Testing Complete Sprint...")
        complete_data = {"action": "complete"}
        
        response = self.make_request("PATCH", f"/sprints/{sprint_id}", complete_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Complete sprint failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Sprint completed successfully")
        
        return True
    
    def test_labels_apis(self):
        """Test all Labels API endpoints"""
        self.log("=== Testing Labels APIs ===")
        
        # Test 1: Create Labels
        self.log("Testing Label Creation...")
        labels_data = [
            {
                "projectId": self.project_id,
                "name": "Bug",
                "color": "#FF5733"
            },
            {
                "projectId": self.project_id,
                "name": "Feature",
                "color": "#33FF57"
            },
            {
                "projectId": self.project_id,
                "name": "Enhancement",
                "color": "#3357FF"
            }
        ]
        
        for label_data in labels_data:
            response = self.make_request("POST", "/labels", label_data)
            if not response or response.status_code != 200:
                self.log(f"❌ Label creation failed: {response.status_code if response else 'No response'}", "ERROR")
                return False
                
            label_result = response.json()
            label_id = label_result.get("label", {}).get("id")
            if not label_id:
                self.log("❌ No label ID received", "ERROR")
                return False
                
            self.label_ids.append(label_id)
            self.log(f"✅ Label created: {label_data['name']} ({label_data['color']})")
        
        # Test 2: Get Labels for Project
        self.log("Testing Get Labels...")
        response = self.make_request("GET", f"/labels?projectId={self.project_id}")
        if not response or response.status_code != 200:
            self.log(f"❌ Get labels failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        labels_result = response.json()
        labels = labels_result.get("labels", [])
        if len(labels) != len(labels_data):
            self.log(f"❌ Expected {len(labels_data)} labels, got {len(labels)}", "ERROR")
            return False
            
        self.log(f"✅ Retrieved {len(labels)} labels")
        
        # Test 3: Update Label
        self.log("Testing Label Update...")
        update_data = {
            "name": "Critical Bug",
            "color": "#FF0000"
        }
        
        response = self.make_request("PUT", f"/labels/{self.label_ids[0]}", update_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Label update failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Label updated successfully")
        
        # Test 4: Test Invalid Color Format
        self.log("Testing Invalid Color Format...")
        invalid_color_data = {
            "projectId": self.project_id,
            "name": "Invalid Color",
            "color": "invalid-color"
        }
        
        response = self.make_request("POST", "/labels", invalid_color_data)
        if response and response.status_code in [400, 500]:  # Accept both validation error and server error
            self.log("✅ Invalid color format properly rejected")
        else:
            self.log(f"❌ Invalid color should be rejected: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        return True
    
    def test_enhanced_task_apis(self):
        """Test Enhanced Task API with labels and sprint support"""
        self.log("=== Testing Enhanced Task APIs ===")
        
        # Test 1: Update Task with Sprint and Story Points
        self.log("Testing Task Update with Sprint and Story Points...")
        
        # Create a new sprint for testing
        sprint_data = {
            "projectId": self.project_id,
            "name": f"Task Test Sprint {uuid.uuid4().hex[:8]}",
            "goal": "Sprint for task testing"
        }
        
        response = self.make_request("POST", "/sprints", sprint_data)
        if not response or response.status_code != 200:
            self.log("❌ Failed to create sprint for task testing", "ERROR")
            return False
            
        test_sprint_id = response.json().get("sprint", {}).get("id")
        
        update_data = {
            "sprintId": test_sprint_id,
            "storyPoints": 5,
            "labels": self.label_ids[:2]  # Assign first 2 labels
        }
        
        response = self.make_request("PATCH", f"/tasks/{self.task_ids[0]}", update_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Task update failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        task_result = response.json()
        updated_task = task_result.get("task", {})
        
        # Verify updates
        if updated_task.get("sprintId") != test_sprint_id:
            self.log("❌ Sprint ID not updated correctly", "ERROR")
            return False
            
        if updated_task.get("storyPoints") != 5:
            self.log("❌ Story points not updated correctly", "ERROR")
            return False
            
        task_labels = updated_task.get("labels", [])
        if len(task_labels) != 2:
            self.log(f"❌ Expected 2 labels, got {len(task_labels)}", "ERROR")
            return False
            
        self.log("✅ Task updated with sprint, story points, and labels")
        
        # Test 2: Remove Task from Sprint
        self.log("Testing Remove Task from Sprint...")
        remove_sprint_data = {"sprintId": None}
        
        response = self.make_request("PATCH", f"/tasks/{self.task_ids[0]}", remove_sprint_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Remove task from sprint failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        task_result = response.json()
        if task_result.get("task", {}).get("sprintId") is not None:
            self.log("❌ Task not removed from sprint", "ERROR")
            return False
            
        self.log("✅ Task removed from sprint successfully")
        
        # Test 3: Update Task Labels
        self.log("Testing Update Task Labels...")
        new_labels_data = {"labels": [self.label_ids[2]]}  # Only third label
        
        response = self.make_request("PATCH", f"/tasks/{self.task_ids[1]}", new_labels_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Update task labels failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        task_result = response.json()
        task_labels = task_result.get("task", {}).get("labels", [])
        if len(task_labels) != 1:
            self.log(f"❌ Expected 1 label, got {len(task_labels)}", "ERROR")
            return False
            
        self.log("✅ Task labels updated successfully")
        
        # Test 4: Get Task with Full Details
        self.log("Testing Get Task with Full Details...")
        response = self.make_request("GET", f"/tasks/{self.task_ids[0]}")
        if not response or response.status_code != 200:
            self.log(f"❌ Get task details failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        task_result = response.json()
        task = task_result.get("task", {})
        
        # Verify task has all expected fields
        expected_fields = ["id", "title", "description", "assignee", "creator", "labels", "comments", "attachments"]
        for field in expected_fields:
            if field not in task:
                self.log(f"❌ Missing field in task details: {field}", "ERROR")
                return False
                
        self.log("✅ Task details retrieved with all fields")
        
        return True
    
    def test_error_cases(self):
        """Test error handling scenarios"""
        self.log("=== Testing Error Cases ===")
        
        # Test 1: Unauthorized Access (no token)
        self.log("Testing Unauthorized Access...")
        old_token = self.auth_token
        self.auth_token = None
        
        response = self.make_request("GET", f"/sprints?projectId={self.project_id}")
        if response and response.status_code == 401:
            self.log("✅ Unauthorized access properly rejected")
        else:
            self.log(f"❌ Should reject unauthorized access: {response.status_code if response else 'No response'}", "ERROR")
            self.auth_token = old_token
            return False
            
        self.auth_token = old_token
        
        # Test 2: Invalid Sprint ID
        self.log("Testing Invalid Sprint ID...")
        fake_sprint_id = str(uuid.uuid4())
        response = self.make_request("GET", f"/sprints/{fake_sprint_id}")
        if response and response.status_code == 404:
            self.log("✅ Invalid sprint ID properly rejected")
        else:
            self.log(f"❌ Should reject invalid sprint ID: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        # Test 3: Invalid Project ID for Sprints
        self.log("Testing Invalid Project ID...")
        fake_project_id = str(uuid.uuid4())
        response = self.make_request("GET", f"/sprints?projectId={fake_project_id}")
        if response and response.status_code in [403, 404]:
            self.log("✅ Invalid project ID properly handled")
        else:
            self.log(f"❌ Should handle invalid project ID: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        # Test 4: Invalid Label ID
        self.log("Testing Invalid Label ID...")
        fake_label_id = str(uuid.uuid4())
        response = self.make_request("PUT", f"/labels/{fake_label_id}", {"name": "Test"})
        if response and response.status_code == 404:
            self.log("✅ Invalid label ID properly rejected")
        else:
            self.log(f"❌ Should reject invalid label ID: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        return True
    
    def cleanup(self):
        """Clean up test data"""
        self.log("=== Cleaning Up Test Data ===")
        
        # Delete sprints
        for sprint_id in self.sprint_ids:
            response = self.make_request("DELETE", f"/sprints/{sprint_id}")
            if response and response.status_code == 200:
                self.log(f"✅ Sprint deleted: {sprint_id}")
            else:
                self.log(f"❌ Failed to delete sprint: {sprint_id}", "ERROR")
        
        # Delete labels
        for label_id in self.label_ids:
            response = self.make_request("DELETE", f"/labels/{label_id}")
            if response and response.status_code == 200:
                self.log(f"✅ Label deleted: {label_id}")
            else:
                self.log(f"❌ Failed to delete label: {label_id}", "ERROR")
        
        # Delete tasks
        for task_id in self.task_ids:
            response = self.make_request("DELETE", f"/tasks/{task_id}")
            if response and response.status_code == 200:
                self.log(f"✅ Task deleted: {task_id}")
            else:
                self.log(f"❌ Failed to delete task: {task_id}", "ERROR")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("Starting TT-Manager Backend API Tests...")
        
        # Setup phase
        if not self.test_user_registration_and_login():
            self.log("❌ Authentication setup failed", "ERROR")
            return False
            
        if not self.test_team_creation():
            self.log("❌ Team setup failed", "ERROR")
            return False
            
        if not self.test_project_creation():
            self.log("❌ Project setup failed", "ERROR")
            return False
            
        if not self.test_board_and_column_creation():
            self.log("❌ Board setup failed", "ERROR")
            return False
            
        if not self.test_task_creation():
            self.log("❌ Task setup failed", "ERROR")
            return False
        
        # Main tests
        tests_passed = 0
        total_tests = 4
        
        if self.test_sprint_apis():
            tests_passed += 1
            self.log("✅ Sprint APIs tests PASSED")
        else:
            self.log("❌ Sprint APIs tests FAILED", "ERROR")
        
        if self.test_labels_apis():
            tests_passed += 1
            self.log("✅ Labels APIs tests PASSED")
        else:
            self.log("❌ Labels APIs tests FAILED", "ERROR")
        
        if self.test_enhanced_task_apis():
            tests_passed += 1
            self.log("✅ Enhanced Task APIs tests PASSED")
        else:
            self.log("❌ Enhanced Task APIs tests FAILED", "ERROR")
        
        if self.test_error_cases():
            tests_passed += 1
            self.log("✅ Error handling tests PASSED")
        else:
            self.log("❌ Error handling tests FAILED", "ERROR")
        
        # Cleanup
        self.cleanup()
        
        # Summary
        self.log(f"=== TEST SUMMARY ===")
        self.log(f"Tests Passed: {tests_passed}/{total_tests}")
        self.log(f"Success Rate: {(tests_passed/total_tests)*100:.1f}%")
        
        if tests_passed == total_tests:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log("❌ SOME TESTS FAILED")
            return False

def main():
    """Main function to run tests"""
    tester = TTManagerAPITester()
    
    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        tester.log("Tests interrupted by user", "ERROR")
        sys.exit(1)
    except Exception as e:
        tester.log(f"Unexpected error: {str(e)}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()