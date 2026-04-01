# 🚀 UNY ALPHA - MISSION VALIDATION CHECKLIST

This document outlines the strict operational tests required to certify the **UNY.2100 Command Center** for the first 5 Commanders.

---

## ✅ TEST 1: NEURAL IDENTITY (Authentication)

**Objective**: Ensure secure access and automated profile provisioning.

1.  **Steps**:
    *   Navigate to `/register`.
    *   Enter a full name, email, and password (at least 6 characters).
    *   Submit the form.
    *   Attempt to login at `/login` with an incorrect password.
    *   Login with the correct credentials.
2.  **Expected Result**:
    *   Registration redirects to `/onboarding`.
    *   Wrong password shows: *"Access Denied: Invalid credentials."*
    *   Correct login identifies the user and redirects correctly based on onboarding status.
3.  **SQL Verification**:
    ```sql
    -- Verify auth user exists
    SELECT email, id FROM auth.users WHERE email = 'your-email@example.com';
    
    -- Verify public profile was created via trigger
    SELECT id, full_name, onboarding_completed FROM public.profiles WHERE id = 'AUTH_USER_ID';
    ```

---

## ✅ TEST 2: CORE CALIBRATION (Onboarding)

**Objective**: Validate organization node creation and metadata synchronization.

1.  **Steps**:
    *   Login to a new account.
    *   Complete Phase 1 (Name/Company), Phase 2 (Industry/Team), and Phase 3 (Revenue Goal).
    *   Wait for Phase 4 (Neuro-Syncing) to complete.
2.  **Expected Result**:
    *   Neural link progress bar reaches 100%.
    *   Automatic redirection to `/dashboard` occurs within 5 seconds of the final sync.
3.  **SQL Verification**:
    ```sql
    -- Verify organization creation
    SELECT * FROM public.organizations WHERE name = 'Your Company Name';
    
    -- Verify profile link and metadata persistence
    SELECT org_id, onboarding_completed, metadata 
    FROM public.profiles 
    WHERE id = 'AUTH_USER_ID';
    ```

---

## ✅ TEST 3: STRATEGIC OVERVIEW (Dashboard)

**Objective**: Verify initial state "Empty Sector" logic.

1.  **Steps**:
    *   Access the Dashboard immediately after onboarding.
2.  **Expected Result**:
    *   Mission Stats: All display `0` or `0h`.
    *   Velocity Trajectory: Displays *"Awaiting first revenue node..."*
    *   Business Memory: Displays *"Initializing Neural Core"* with noise nodes only.
    *   Console: `F12` should show zero `404` or `500` errors.
3.  **SQL Verification**:
    ```sql
    -- Confirm zero data for new org
    SELECT COUNT(*) FROM public.projects WHERE org_id = 'YOUR_ORG_ID';
    ```

---

## ✅ TEST 4: MISSION DEPLOYMENT (Project Creation)

**Objective**: Test real-time write/read operations.

1.  **Steps**:
    *   In `ProjectsTable`, click the `PlusCircle` icon.
    *   Fill out the "Deploy Mission Node" form (Name, Priority, Revenue).
    *   Submit.
2.  **Expected Result**:
    *   Modal closes immediately.
    *   The new project appears in the table without a page refresh.
    *   The "Strategic Command" percentage updates to reflect the new revenue node.
3.  **SQL Verification**:
    ```sql
    -- Check project record
    SELECT name, revenue, priority, org_id 
    FROM public.projects 
    WHERE org_id = 'YOUR_ORG_ID' 
    ORDER BY created_at DESC LIMIT 1;
    ```

---

## ✅ TEST 5: SIGNAL ISOLATION (Row Level Security)

**Objective**: Guarantee multi-tenant privacy.

1.  **Steps**:
    *   Open Browser A (Incognito): Login as User 1, create a project "Stealth Mission".
    *   Open Browser B (Incognito): Login as User 2, complete onboarding.
    *   Navigate to the Dashboard on Browser B.
2.  **Expected Result**:
    *   User 2 **MUST NOT** see "Stealth Mission".
    *   User 2's `Mission Stats` remains at `0`.
3.  **SQL Verification**:
    ```sql
    -- Verify RLS is active (this should return data only for current session)
    SELECT * FROM public.projects;
    ```

---

## ✅ TEST 6: TELEMETRY STREAMING (Audit Logs)

**Objective**: Validate real-time telemetry interception.

1.  **Steps**:
    *   Click on a node in `Business Memory`.
    *   Approve an action in the `Autopilot Queue`.
    *   Go to `Sidebar` -> `Telemetry Hub`.
2.  **Expected Result**:
    *   `AUTOPILOT_APPROVAL` signal is visible in the stream.
    *   `NEURAL_INTERACTION` signal (from clicking the node) is recorded.
    *   Timestamp and Node ID are correctly mapped.
3.  **SQL Verification**:
    ```sql
    -- Check telemetry log entry
    SELECT event_type, metric_label, org_id 
    FROM public.telemetry_logs 
    ORDER BY timestamp DESC LIMIT 5;
    ```

---
**Build Certified for Alpha-01 Deployment.**
*Command: UNY.2100*