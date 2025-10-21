#!/usr/bin/env python3
"""
TT-Manager Backend API Testing Suite - Phase 2
Tests Calendar Events APIs, Comments APIs, and Project Members APIs
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "http://localhost:3000/api"
HEADERS = {"Content-Type": "application/json"}

class TTManagerPhase2Tester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        # User tokens and IDs for multi-user testing
        self.user1_token = None
        self.user1_id = None
        self.user1_email = None
        self.user2_token = None
        self.user2_id = None
        self.user2_email = None
        self.user3_token = None
        self.user3_id = None
        self.user3_email = None
        # Project setup
        self.team_id = None
        self.project_id = None
        self.board_id = None
        self.column_id = None
        self.task_ids = []
        # Phase 2 test data
        self.event_ids = []
        self.comment_ids = []
        self.member_ids = []
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method, endpoint, data=None, auth_token=None, auth_required=True):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
            
        try:
            self.log(f"Making {method} request to {url}", "DEBUG")
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            self.log(f"Response: {response.status_code} - {response.text[:200]}", "DEBUG")
            return response
        except requests.exceptions.ConnectionError as e:
            self.log(f"Connection error to {url}: {str(e)}", "ERROR")
            return None
        except requests.exceptions.Timeout as e:
            self.log(f"Timeout error to {url}: {str(e)}", "ERROR")
            return None
        except Exception as e:
            self.log(f"Request error to {url}: {str(e)}", "ERROR")
            return None
    
    def register_user(self, name, email_prefix):
        """Register a user and return token and user info"""
        test_email = f"{email_prefix}_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "testpassword123"
        
        register_data = {
            "email": test_email,
            "password": test_password,
            "name": name
        }
        
        response = self.make_request("POST", "/auth/register", register_data, auth_required=False)
        if not response or response.status_code != 200:
            self.log(f"Registration failed for {name}: {response.status_code if response else 'No response'}", "ERROR")
            return None, None, None
            
        register_result = response.json()
        token = register_result.get("token")
        user_id = register_result.get("user", {}).get("id")
        
        if not token or not user_id:
            self.log(f"No auth token or user ID received for {name}", "ERROR")
            return None, None, None
            
        self.log(f"✅ User registered: {name} ({test_email})")
        return token, user_id, test_email
    
    def setup_users(self):
        """Register 3 test users"""
        self.log("=== Setting up test users ===")
        
        # Register User 1 (Project Creator/Admin)
        self.user1_token, self.user1_id, self.user1_email = self.register_user("Alice Admin", "alice")
        if not self.user1_token:
            return False
            
        # Register User 2 (Member)
        self.user2_token, self.user2_id, self.user2_email = self.register_user("Bob Member", "bob")
        if not self.user2_token:
            return False
            
        # Register User 3 (Viewer)
        self.user3_token, self.user3_id, self.user3_email = self.register_user("Charlie Viewer", "charlie")
        if not self.user3_token:
            return False
            
        return True
    
    def setup_project(self):
        """Create team and project with User 1"""
        self.log("=== Setting up team and project ===")
        
        # Create team
        team_data = {
            "name": f"Test Team {uuid.uuid4().hex[:8]}"
        }
        
        response = self.make_request("POST", "/teams", team_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"Team creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        team_result = response.json()
        self.team_id = team_result.get("team", {}).get("id")
        
        if not self.team_id:
            self.log("No team ID received", "ERROR")
            return False
            
        self.log(f"✅ Team created: {self.team_id}")
        
        # Create project
        project_data = {
            "teamId": self.team_id,
            "name": f"Test Project {uuid.uuid4().hex[:8]}",
            "key": f"TP{uuid.uuid4().hex[:4].upper()}",
            "description": "Test project for Phase 2 API testing"
        }
        
        response = self.make_request("POST", "/projects", project_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"Project creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        project_result = response.json()
        self.project_id = project_result.get("project", {}).get("id")
        
        if not self.project_id:
            self.log("No project ID received", "ERROR")
            return False
            
        self.log(f"✅ Project created: {self.project_id}")
        
        # Create board and get column
        board_data = {
            "projectId": self.project_id,
            "title": f"Test Board {uuid.uuid4().hex[:8]}",
            "background": "#f0f0f0"
        }
        
        response = self.make_request("POST", "/boards", board_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"Board creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        board_result = response.json()
        self.board_id = board_result.get("board", {}).get("id")
        columns = board_result.get("board", {}).get("columns", [])
        
        if not self.board_id or not columns:
            self.log("No board ID or columns received", "ERROR")
            return False
            
        self.column_id = columns[0].get("id")
        self.log(f"✅ Board created: {self.board_id}")
        
        # Create a test task for comments testing
        task_data = {
            "projectId": self.project_id,
            "boardId": self.board_id,
            "columnId": self.column_id,
            "title": "Test Task for Comments",
            "description": "Task for testing comment functionality",
            "priority": "high"
        }
        
        response = self.make_request("POST", "/tasks", task_data, auth_token=self.user1_token)
        if response and response.status_code == 200:
            task_result = response.json()
            task_id = task_result.get("task", {}).get("id")
            if task_id:
                self.task_ids.append(task_id)
                self.log(f"✅ Test task created for comments")
            else:
                self.log("❌ Task creation failed - no ID", "ERROR")
                return False
        else:
            self.log(f"❌ Task creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        return True
    
    def test_calendar_events_apis(self):
        """Test Calendar Events APIs"""
        self.log("=== Testing Calendar Events APIs ===")
        
        # Test 1: Create personal event (no project/team)
        self.log("Testing Create Personal Event...")
        personal_event_data = {
            "title": "Personal Meeting",
            "description": "Personal calendar event",
            "startTime": (datetime.now() + timedelta(hours=1)).isoformat(),
            "endTime": (datetime.now() + timedelta(hours=2)).isoformat(),
            "type": "meeting",
            "color": "#FF5733"
        }
        
        response = self.make_request("POST", "/calendar", personal_event_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Personal event creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        event_result = response.json()
        personal_event_id = event_result.get("event", {}).get("id")
        if not personal_event_id:
            self.log("❌ No personal event ID received", "ERROR")
            return False
            
        self.event_ids.append(personal_event_id)
        self.log("✅ Personal event created successfully")
        
        # Test 2: Create project event with attendees
        self.log("Testing Create Project Event with Attendees...")
        project_event_data = {
            "projectId": self.project_id,
            "title": "Project Sprint Planning",
            "description": "Sprint planning meeting for the project",
            "location": "Conference Room A",
            "startTime": (datetime.now() + timedelta(days=1)).isoformat(),
            "endTime": (datetime.now() + timedelta(days=1, hours=2)).isoformat(),
            "type": "meeting",
            "color": "#33FF57",
            "attendeeIds": [self.user2_id, self.user3_id]
        }
        
        response = self.make_request("POST", "/calendar", project_event_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Project event creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        event_result = response.json()
        project_event_id = event_result.get("event", {}).get("id")
        if not project_event_id:
            self.log("❌ No project event ID received", "ERROR")
            return False
            
        self.event_ids.append(project_event_id)
        
        # Verify attendees were added
        attendees = event_result.get("event", {}).get("attendees", [])
        if len(attendees) != 2:
            self.log(f"❌ Expected 2 attendees, got {len(attendees)}", "ERROR")
            return False
            
        self.log("✅ Project event with attendees created successfully")
        
        # Test 3: Get events with date range filtering
        self.log("Testing Get Events with Date Range Filtering...")
        start_date = datetime.now().isoformat()
        end_date = (datetime.now() + timedelta(days=2)).isoformat()
        
        response = self.make_request("GET", f"/calendar?startDate={start_date}&endDate={end_date}", auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Get events with date filter failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        events_result = response.json()
        events = events_result.get("events", [])
        if len(events) < 1:  # Should have at least the project event
            self.log(f"❌ Expected at least 1 event in date range, got {len(events)}", "ERROR")
            return False
            
        self.log(f"✅ Date range filtering working - found {len(events)} events")
        
        # Test 4: User2 (attendee) updates their status to "accepted"
        self.log("Testing Attendee Status Update...")
        status_update_data = {"status": "accepted"}
        
        response = self.make_request("PATCH", f"/calendar/{project_event_id}", status_update_data, auth_token=self.user2_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Attendee status update failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Attendee status updated successfully")
        
        # Test 5: User1 (creator) updates event
        self.log("Testing Event Update by Creator...")
        update_data = {
            "title": "Updated Sprint Planning Meeting",
            "description": "Updated description for sprint planning",
            "location": "Conference Room B"
        }
        
        response = self.make_request("PUT", f"/calendar/{project_event_id}", update_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Event update failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        updated_event = response.json().get("event", {})
        if updated_event.get("title") != "Updated Sprint Planning Meeting":
            self.log("❌ Event title not updated correctly", "ERROR")
            return False
            
        self.log("✅ Event updated by creator successfully")
        
        # Test 6: User3 (not involved) tries to access/modify (should fail)
        self.log("Testing Unauthorized Access by Non-Attendee...")
        
        # Try to update event as non-creator/non-attendee
        response = self.make_request("PUT", f"/calendar/{project_event_id}", update_data, auth_token=self.user3_token)
        if response and response.status_code == 403:
            self.log("✅ Non-creator properly blocked from updating event")
        elif response:
            self.log(f"❌ Should block non-creator from updating: {response.status_code} - {response.text[:100]}", "ERROR")
            return False
        else:
            self.log("❌ No response received for unauthorized update test", "ERROR")
            return False
        
        # Test 7: Get single event with full details
        self.log("Testing Get Single Event...")
        response = self.make_request("GET", f"/calendar/{project_event_id}", auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Get single event failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        event_details = response.json().get("event", {})
        if not event_details.get("attendees"):
            self.log("❌ Event details missing attendees", "ERROR")
            return False
            
        self.log("✅ Single event retrieved with full details")
        
        # Test 8: Delete event (creator only)
        self.log("Testing Event Deletion...")
        response = self.make_request("DELETE", f"/calendar/{personal_event_id}", auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Event deletion failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Event deleted successfully")
        
        return True
    
    def test_comments_apis(self):
        """Test Comments APIs"""
        self.log("=== Testing Comments APIs ===")
        
        if not self.task_ids:
            self.log("❌ No test task available for comments testing", "ERROR")
            return False
            
        task_id = self.task_ids[0]
        
        # First, add User2 to the project so they can comment
        self.log("Adding User2 to project for comments testing...")
        add_member_data = {
            "email": self.user2_email,
            "role": "member"
        }
        
        response = self.make_request("POST", f"/projects/{self.project_id}/members", add_member_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to add User2 to project: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        self.log("✅ User2 added to project for comments testing")
        
        # Test 1: Create comment from User1
        self.log("Testing Create Comment (User1)...")
        comment1_data = {
            "taskId": task_id,
            "body": "This is the first comment from User1",
            "mentions": [self.user2_id]
        }
        
        response = self.make_request("POST", "/comments", comment1_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Comment creation failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        comment_result = response.json()
        comment1_id = comment_result.get("comment", {}).get("id")
        if not comment1_id:
            self.log("❌ No comment ID received", "ERROR")
            return False
            
        self.comment_ids.append(comment1_id)
        self.log("✅ Comment created by User1")
        
        # Test 2: Create comment from User2
        self.log("Testing Create Comment (User2)...")
        comment2_data = {
            "taskId": task_id,
            "body": "This is a reply from User2"
        }
        
        response = self.make_request("POST", "/comments", comment2_data, auth_token=self.user2_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Comment creation by User2 failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        comment_result = response.json()
        comment2_id = comment_result.get("comment", {}).get("id")
        if not comment2_id:
            self.log("❌ No comment ID received for User2", "ERROR")
            return False
            
        self.comment_ids.append(comment2_id)
        self.log("✅ Comment created by User2")
        
        # Test 3: Get comments for task
        self.log("Testing Get Comments for Task...")
        response = self.make_request("GET", f"/comments?taskId={task_id}", auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Get comments failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        comments_result = response.json()
        comments = comments_result.get("comments", [])
        if len(comments) != 2:
            self.log(f"❌ Expected 2 comments, got {len(comments)}", "ERROR")
            return False
            
        self.log("✅ Comments retrieved successfully")
        
        # Test 4: Edit own comment (User1)
        self.log("Testing Edit Own Comment...")
        edit_data = {"body": "This is the updated first comment from User1"}
        
        response = self.make_request("PUT", f"/comments/{comment1_id}", edit_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Comment edit failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        updated_comment = response.json().get("comment", {})
        if updated_comment.get("body") != "This is the updated first comment from User1":
            self.log("❌ Comment body not updated correctly", "ERROR")
            return False
            
        self.log("✅ Own comment edited successfully")
        
        # Test 5: Try to edit other user's comment (should fail)
        self.log("Testing Edit Other User's Comment (should fail)...")
        response = self.make_request("PUT", f"/comments/{comment2_id}", edit_data, auth_token=self.user1_token)
        if response and response.status_code == 403:
            self.log("✅ Properly blocked from editing other user's comment")
        else:
            self.log(f"❌ Should block editing other user's comment: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        # Test 6: Delete own comment (User2)
        self.log("Testing Delete Own Comment...")
        response = self.make_request("DELETE", f"/comments/{comment2_id}", auth_token=self.user2_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Comment deletion failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Own comment deleted successfully")
        
        # Test 7: Try to delete other user's comment (should fail)
        self.log("Testing Delete Other User's Comment (should fail)...")
        response = self.make_request("DELETE", f"/comments/{comment1_id}", auth_token=self.user2_token)
        if response and response.status_code == 403:
            self.log("✅ Properly blocked from deleting other user's comment")
        else:
            self.log(f"❌ Should block deleting other user's comment: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        return True
    
    def test_project_members_apis(self):
        """Test Project Members APIs"""
        self.log("=== Testing Project Members APIs ===")
        
        # Test 1: List members (initially just user1)
        self.log("Testing List Project Members...")
        response = self.make_request("GET", f"/projects/{self.project_id}/members", auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ List members failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        members_result = response.json()
        members = members_result.get("members", [])
        if len(members) != 1:
            self.log(f"❌ Expected 1 initial member, got {len(members)}", "ERROR")
            return False
            
        self.log("✅ Initial project members listed successfully")
        
        # Test 2: Add user2 as "member" by email
        self.log("Testing Add Member by Email (User2 as member)...")
        add_member_data = {
            "email": self.user2_email,
            "role": "member"
        }
        
        response = self.make_request("POST", f"/projects/{self.project_id}/members", add_member_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Add member failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        member_result = response.json()
        user2_member_id = member_result.get("member", {}).get("id")
        if not user2_member_id:
            self.log("❌ No member ID received for User2", "ERROR")
            return False
            
        self.member_ids.append(user2_member_id)
        self.log("✅ User2 added as member successfully")
        
        # Test 3: Add user3 as "viewer" by email
        self.log("Testing Add Member by Email (User3 as viewer)...")
        add_viewer_data = {
            "email": self.user3_email,
            "role": "viewer"
        }
        
        response = self.make_request("POST", f"/projects/{self.project_id}/members", add_viewer_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Add viewer failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        member_result = response.json()
        user3_member_id = member_result.get("member", {}).get("id")
        if not user3_member_id:
            self.log("❌ No member ID received for User3", "ERROR")
            return False
            
        self.member_ids.append(user3_member_id)
        self.log("✅ User3 added as viewer successfully")
        
        # Test 4: User2 tries to add another member (should work - members can add)
        self.log("Testing Member Adding Another Member...")
        # First register a new user for this test
        new_user_token, new_user_id, new_user_email = self.register_user("Dave NewMember", "dave")
        if not new_user_token:
            self.log("❌ Failed to register new user for member test", "ERROR")
            return False
            
        add_new_member_data = {
            "email": new_user_email,
            "role": "member"
        }
        
        response = self.make_request("POST", f"/projects/{self.project_id}/members", add_new_member_data, auth_token=self.user2_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Member adding member failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Member successfully added another member")
        
        # Test 5: User3 tries to add member (should fail - viewers cannot add)
        self.log("Testing Viewer Adding Member (should fail)...")
        # Register another user for this test
        another_user_token, another_user_id, another_user_email = self.register_user("Eve AnotherUser", "eve")
        if not another_user_token:
            self.log("❌ Failed to register another user for viewer test", "ERROR")
            return False
            
        add_another_member_data = {
            "email": another_user_email,
            "role": "member"
        }
        
        response = self.make_request("POST", f"/projects/{self.project_id}/members", add_another_member_data, auth_token=self.user3_token)
        if response and response.status_code == 403:
            self.log("✅ Viewer properly blocked from adding members")
        elif response:
            self.log(f"❌ Should block viewer from adding members: {response.status_code} - {response.text[:100]}", "ERROR")
            return False
        else:
            self.log("❌ No response received for viewer add member test", "ERROR")
            return False
        
        # Test 6: Update user2 role to "admin"
        self.log("Testing Update Member Role to Admin...")
        update_role_data = {
            "memberId": user2_member_id,
            "role": "admin"
        }
        
        response = self.make_request("PUT", f"/projects/{self.project_id}/members", update_role_data, auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Update member role failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        updated_member = response.json().get("member", {})
        if updated_member.get("role") != "admin":
            self.log("❌ Member role not updated to admin", "ERROR")
            return False
            
        self.log("✅ Member role updated to admin successfully")
        
        # Test 7: User3 tries to update roles (should fail - only admins can update)
        self.log("Testing Non-Admin Updating Roles (should fail)...")
        response = self.make_request("PUT", f"/projects/{self.project_id}/members", update_role_data, auth_token=self.user3_token)
        if response and response.status_code == 403:
            self.log("✅ Non-admin properly blocked from updating roles")
        else:
            self.log(f"❌ Should block non-admin from updating roles: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        # Test 8: Remove user3 from project
        self.log("Testing Remove Member from Project...")
        response = self.make_request("DELETE", f"/projects/{self.project_id}/members?memberId={user3_member_id}", auth_token=self.user1_token)
        if not response or response.status_code != 200:
            self.log(f"❌ Remove member failed: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
        self.log("✅ Member removed from project successfully")
        
        # Test 9: User3 tries to access project (should fail)
        self.log("Testing Removed User Access (should fail)...")
        response = self.make_request("GET", f"/projects/{self.project_id}/members", auth_token=self.user3_token)
        if response and response.status_code == 403:
            self.log("✅ Removed user properly blocked from accessing project")
        else:
            self.log(f"❌ Should block removed user from accessing project: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        return True
    
    def test_error_cases(self):
        """Test error handling scenarios"""
        self.log("=== Testing Error Cases ===")
        
        # Test 1: Unauthorized access (no token)
        self.log("Testing Unauthorized Access...")
        response = self.make_request("GET", "/calendar", auth_required=False)
        if response and response.status_code == 401:
            self.log("✅ Unauthorized access properly rejected")
        else:
            self.log(f"❌ Should reject unauthorized access: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        # Test 2: Invalid event ID
        self.log("Testing Invalid Event ID...")
        fake_event_id = str(uuid.uuid4())
        response = self.make_request("GET", f"/calendar/{fake_event_id}", auth_token=self.user1_token)
        if response and response.status_code == 404:
            self.log("✅ Invalid event ID properly rejected")
        else:
            self.log(f"❌ Should reject invalid event ID: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        # Test 3: Invalid task ID for comments
        self.log("Testing Invalid Task ID for Comments...")
        fake_task_id = str(uuid.uuid4())
        comment_data = {
            "taskId": fake_task_id,
            "body": "Test comment"
        }
        response = self.make_request("POST", "/comments", comment_data, auth_token=self.user1_token)
        if response and response.status_code == 404:
            self.log("✅ Invalid task ID properly rejected")
        else:
            self.log(f"❌ Should reject invalid task ID: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        # Test 4: Invalid project ID for members
        self.log("Testing Invalid Project ID for Members...")
        fake_project_id = str(uuid.uuid4())
        response = self.make_request("GET", f"/projects/{fake_project_id}/members", auth_token=self.user1_token)
        if response and response.status_code == 403:
            self.log("✅ Invalid project ID properly handled")
        else:
            self.log(f"❌ Should handle invalid project ID: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        return True
    
    def run_all_tests(self):
        """Run all Phase 2 tests in sequence"""
        self.log("Starting TT-Manager Phase 2 Backend API Tests...")
        
        # Setup phase
        if not self.setup_users():
            self.log("❌ User setup failed", "ERROR")
            return False
            
        if not self.setup_project():
            self.log("❌ Project setup failed", "ERROR")
            return False
        
        # Main tests
        tests_passed = 0
        total_tests = 4
        
        if self.test_calendar_events_apis():
            tests_passed += 1
            self.log("✅ Calendar Events APIs tests PASSED")
        else:
            self.log("❌ Calendar Events APIs tests FAILED", "ERROR")
        
        if self.test_comments_apis():
            tests_passed += 1
            self.log("✅ Comments APIs tests PASSED")
        else:
            self.log("❌ Comments APIs tests FAILED", "ERROR")
        
        if self.test_project_members_apis():
            tests_passed += 1
            self.log("✅ Project Members APIs tests PASSED")
        else:
            self.log("❌ Project Members APIs tests FAILED", "ERROR")
        
        if self.test_error_cases():
            tests_passed += 1
            self.log("✅ Error handling tests PASSED")
        else:
            self.log("❌ Error handling tests FAILED", "ERROR")
        
        # Summary
        self.log(f"=== TEST SUMMARY ===")
        self.log(f"Tests Passed: {tests_passed}/{total_tests}")
        self.log(f"Success Rate: {(tests_passed/total_tests)*100:.1f}%")
        
        if tests_passed == total_tests:
            self.log("🎉 ALL PHASE 2 TESTS PASSED!")
            return True
        else:
            self.log("❌ SOME PHASE 2 TESTS FAILED")
            return False

def main():
    """Main function to run Phase 2 tests"""
    tester = TTManagerPhase2Tester()
    
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