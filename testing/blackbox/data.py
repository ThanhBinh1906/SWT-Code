from datetime import date


COLUMNS = [
    "TC_ID",
    "FR_ID",
    "Description",
    "Pre-condition",
    "Test Data",
    "Steps",
    "Expected Result",
    "Type (N/A/B)",
    "Technique",
    "Priority",
    "Actual Result",
    "Status",
    "Test Date",
    "Note",
]


def tc(tc_id, fr_id, desc, pre, data, steps, expected, kind, technique, priority="Medium", note=""):
    return {
        "TC_ID": tc_id,
        "FR_ID": fr_id,
        "Description": desc,
        "Pre-condition": pre,
        "Test Data": data,
        "Steps": steps,
        "Expected Result": expected,
        "Type (N/A/B)": kind,
        "Technique": technique,
        "Priority": priority,
        "Actual Result": "",
        "Status": "Untested",
        "Test Date": "",
        "Note": note,
    }


TEST_CASES = [
    # Employer - job post creation and approval submission
    tc("TC-EMP-001", "FR-EMP-001", "Save a valid job post as draft", "Employer account is active.", "Title=Java Developer; Quantity=2; Deadline=today+7; Action=SaveDraft", "Login as Employer > Job posts > fill valid form > Save draft.", "Job post is saved with Draft status.", "N", "EP", "High"),
    tc("TC-EMP-002", "FR-EMP-001", "Submit a valid job post for approval", "Employer account is active.", "Title=QA Engineer; Quantity=3; Deadline=today+10; Action=Submit", "Login as Employer > fill valid form > Submit for approval.", "Job post is saved with Pending Approval status.", "N", "EP", "High"),
    tc("TC-EMP-003", "FR-EMP-001", "Reject job post with empty title", "Employer account is active.", "Title empty; valid quantity, JD and deadline", "Open job form > leave title empty > submit.", "System shows title required error and does not save job.", "A", "EP", "High"),
    tc("TC-EMP-004", "FR-EMP-001", "Reject job post with empty JD", "Employer account is active.", "JobDescription empty", "Open job form > leave JD empty > submit.", "System shows JD required error and does not save job.", "A", "EP", "High"),
    tc("TC-EMP-005", "FR-EMP-001", "Reject job post with missing deadline", "Employer account is active.", "Deadline empty", "Open job form > leave deadline empty > submit.", "System shows deadline invalid error.", "A", "EP", "High"),
    tc("TC-EMP-006", "FR-EMP-001", "Reject job post with quantity 0", "Employer account is active.", "Quantity=0", "Open job form > set quantity 0 > submit.", "System shows quantity must be greater than 0.", "B", "BVA", "High"),
    tc("TC-EMP-007", "FR-EMP-001", "Accept job post with quantity 1", "Employer account is active.", "Quantity=1", "Open job form > set quantity 1 > submit.", "System accepts quantity boundary and saves job.", "B", "BVA", "High"),
    tc("TC-EMP-008", "FR-EMP-001", "Reject job post with deadline today", "Employer account is active.", "Deadline=today", "Open job form > choose today as deadline > submit.", "System shows deadline invalid error.", "B", "BVA", "High"),
    tc("TC-EMP-009", "FR-EMP-001", "Reject job post with deadline today plus 2 days", "Employer account is active.", "Deadline=today+2", "Open job form > choose today+2 > submit.", "System shows deadline must be at least plus 3 days.", "B", "BVA", "High"),
    tc("TC-EMP-010", "FR-EMP-001", "Accept job post with deadline today plus 3 days", "Employer account is active.", "Deadline=today+3", "Open job form > choose today+3 > submit.", "System accepts deadline boundary and saves job.", "B", "BVA", "High"),
    tc("TC-EMP-011", "FR-EMP-001", "Save job post with optional requirements empty", "Employer account is active.", "JobRequirements empty; other required fields valid", "Open job form > leave requirements empty > save draft.", "System saves job because requirements are optional in current build.", "N", "EP"),
    tc("TC-EMP-012", "FR-EMP-001", "Save job post with salary negotiation", "Employer account is active.", "SalaryMin=0; SalaryMax=0; SalaryType=Negotiable", "Open job form > select negotiable salary > save.", "System saves job with salary data preserved.", "N", "EP"),
    tc("TC-EMP-013", "FR-EMP-001", "Keep Draft job hidden from candidate search", "Employer has Draft job.", "PostStatus=Draft", "Login Candidate > Find jobs > search draft job title.", "Draft job is not displayed in candidate search.", "N", "Functional"),
    tc("TC-EMP-014", "FR-EMP-001", "Keep Pending job hidden from candidate search", "Employer has Pending Approval job.", "PostStatus=Pending Approval", "Login Candidate > Find jobs > search pending job title.", "Pending job is not displayed in candidate search.", "N", "Functional"),
    tc("TC-EMP-015", "FR-EMP-001", "Display Active approved job in candidate search", "Admin approved the job.", "PostStatus=Active", "Login Candidate > Find jobs > search approved title.", "Active job is displayed in candidate search.", "N", "Functional", "High"),
    tc("TC-EMP-016", "FR-EMP-001", "Reject direct job creation without employer identity", "No valid Employer session.", "EmployerId=0", "Submit job payload without employer id.", "System rejects with employer login required.", "A", "RBAC", "High"),

    # Employer - application processing
    tc("TC-EMP-017", "FR-EMP-002", "Display applications for employer job", "A candidate has submitted an application to employer job.", "EmployerId owns JobId", "Login Employer > Applications.", "Application list shows candidate profile for owned job.", "N", "Functional", "High"),
    tc("TC-EMP-018", "FR-EMP-002", "Do not display applications for another employer job", "Another employer owns a job with applications.", "EmployerId does not own JobId", "Login Employer > Applications.", "Applications from other employer jobs are not listed.", "A", "RBAC", "High"),
    tc("TC-EMP-019", "FR-EMP-002", "Filter applications by New Applied status", "Application list contains multiple statuses.", "Status=New Applied", "Open Applications > apply New Applied filter.", "Only New Applied applications are shown.", "N", "EP"),
    tc("TC-EMP-020", "FR-EMP-002", "Filter applications by candidate keyword", "Application list contains several candidates.", "Keyword=candidate name/email", "Open Applications > search by keyword.", "Only matching candidate rows are shown.", "N", "EP"),
    tc("TC-EMP-021", "FR-EMP-002", "Mark New Applied application as CV Passed", "Application status is New Applied.", "NewStatus=CV Passed", "Open Applications > click Pass CV.", "Application status changes to CV Passed and history is recorded.", "N", "State Transition", "High"),
    tc("TC-EMP-022", "FR-EMP-002", "Reject New Applied application", "Application status is New Applied.", "NewStatus=Rejected", "Open Applications > click Reject.", "Application status changes to Rejected and is archived from main queue.", "N", "State Transition", "High"),
    tc("TC-EMP-023", "FR-EMP-002", "Reject CV Passed application", "Application status is CV Passed.", "NewStatus=Rejected", "Open Applications > click Reject.", "Application status changes to Rejected and history is recorded.", "N", "State Transition"),
    tc("TC-EMP-024", "FR-EMP-002", "Block invalid transition from New Applied to Offered", "Application status is New Applied.", "NewStatus=Offered", "Call status update with Offered.", "System rejects invalid status transition.", "A", "State Transition", "High"),
    tc("TC-EMP-025", "FR-EMP-002", "Record audit log after status update", "Employer updates an application status.", "OldStatus=New Applied; NewStatus=CV Passed", "Update application status > open Admin Audit logs.", "Audit log contains action, entity, old status and new status.", "N", "Functional", "High"),
    tc("TC-EMP-026", "FR-EMP-002", "Open uploaded CV information", "Application has a CV file.", "CV=.pdf", "Open Applications > inspect CV/file information.", "System displays CV file metadata or downloadable storage path.", "N", "Functional"),
    tc("TC-EMP-027", "FR-EMP-002", "Show empty state when job has no applications", "Employer has a job with no candidates.", "JobId no applications", "Open Applications for that job.", "System shows an empty state instead of an error.", "N", "Functional"),
    tc("TC-EMP-028", "FR-EMP-002", "Preserve rejected candidate history", "Application was rejected.", "Status=Rejected", "Open candidate history or audit log.", "Rejected status is still traceable in history/log records.", "N", "Functional"),

    # Employer - interview schedule and post-interview lifecycle
    tc("TC-EMP-029", "FR-EMP-003", "Schedule valid online interview", "Application status is CV Passed and interviewer is active.", "Mode=Online; Time=weekday 09:00; Link provided", "Click Schedule > fill valid data > create interview.", "Interview is created, application moves to Interview Scheduled, mock email is logged.", "N", "Decision Table", "High"),
    tc("TC-EMP-030", "FR-EMP-003", "Schedule valid offline interview", "Application status is CV Passed and interviewer is active.", "Mode=Offline; Time=weekday 14:00; Room=A1", "Create offline interview.", "Interview is created with Offline mode and room/location.", "N", "Decision Table", "High"),
    tc("TC-EMP-031", "FR-EMP-003", "Reject schedule when application is New Applied", "Application status is New Applied.", "Status=New Applied", "Try to schedule interview.", "System says application must pass CV before scheduling.", "A", "State Transition", "High"),
    tc("TC-EMP-032", "FR-EMP-003", "Reject duplicate interview schedule", "Application already has Interview Scheduled.", "Status=Interview Scheduled", "Try to schedule another interview.", "System rejects duplicate schedule.", "A", "State Transition", "High"),
    tc("TC-EMP-033", "FR-EMP-003", "Reject weekend interview", "Application status is CV Passed.", "Time=Saturday 09:00", "Try to schedule weekend interview.", "System rejects interview outside Monday-Friday.", "B", "BVA", "High"),
    tc("TC-EMP-034", "FR-EMP-003", "Accept morning start boundary", "Application status is CV Passed.", "Time=Monday 08:00", "Schedule interview at 08:00.", "System accepts the schedule.", "B", "BVA"),
    tc("TC-EMP-035", "FR-EMP-003", "Reject time before working hours", "Application status is CV Passed.", "Time=Monday 07:59", "Schedule interview at 07:59.", "System rejects time outside working hours.", "B", "BVA", "High"),
    tc("TC-EMP-036", "FR-EMP-003", "Accept afternoon end boundary", "Application status is CV Passed.", "Time=Monday 17:30", "Schedule interview at 17:30.", "System accepts the schedule.", "B", "BVA"),
    tc("TC-EMP-037", "FR-EMP-003", "Reject online interview without meeting link", "Application status is CV Passed.", "Mode=Online; LocationOrLink empty", "Create online interview without link.", "System requires online meeting link.", "A", "Decision Table", "High"),
    tc("TC-EMP-038", "FR-EMP-003", "Reject schedule without interviewer", "Application status is CV Passed.", "InterviewerUserIds empty", "Create interview without interviewer.", "System requires at least one interviewer.", "A", "Decision Table", "High"),
    tc("TC-EMP-039", "FR-EMP-003", "Reject interviewer schedule conflict", "Interviewer already has interview at same time.", "Same InterviewerUserId and InterviewTime", "Create another interview at same time.", "System rejects with interviewer schedule conflict.", "A", "Decision Table", "High"),
    tc("TC-EMP-040", "FR-EMP-003", "Pass interview and move application forward", "Application status is Interview Scheduled.", "Result=Passed", "Open Interviews > click Pass interview.", "Interview status becomes Completed and application becomes Interview Passed.", "N", "State Transition", "High"),

    # Candidate - search jobs
    tc("TC-CAN-001", "FR-CAN-001", "Search active jobs without filters", "At least one active job exists.", "No keyword or filters", "Login Candidate > Find jobs > search.", "System displays active non-expired jobs sorted newest first.", "N", "Functional", "High"),
    tc("TC-CAN-002", "FR-CAN-001", "Search jobs by title keyword", "Active jobs exist.", "Keyword=Engineer", "Enter keyword and search.", "Only matching jobs by title/JD/requirements are displayed.", "N", "EP"),
    tc("TC-CAN-003", "FR-CAN-001", "Search jobs by location", "Active jobs in different locations exist.", "Location=Ho Chi Minh", "Apply location filter.", "Only jobs in matching location are displayed.", "N", "EP"),
    tc("TC-CAN-004", "FR-CAN-001", "Search jobs by level", "Active jobs in different levels exist.", "Level=Junior", "Apply level filter.", "Only matching level jobs are displayed.", "N", "EP"),
    tc("TC-CAN-005", "FR-CAN-001", "Search jobs by salary minimum", "Active jobs have salary ranges.", "MinSalary=1000", "Apply minimum salary filter.", "Jobs with SalaryMax >= MinSalary are displayed.", "N", "EP"),
    tc("TC-CAN-006", "FR-CAN-001", "Search jobs by salary maximum", "Active jobs have salary ranges.", "MaxSalary=2000", "Apply maximum salary filter.", "Jobs with SalaryMin <= MaxSalary are displayed.", "N", "EP"),
    tc("TC-CAN-007", "FR-CAN-001", "Hide expired job from search results", "A job deadline is before today.", "Deadline=today-1", "Search by expired job title.", "Expired job is not displayed.", "A", "EP", "High"),
    tc("TC-CAN-008", "FR-CAN-001", "Hide rejected job from search results", "Admin rejected a job.", "PostStatus=Rejected", "Search by rejected job title.", "Rejected job is not displayed.", "A", "EP", "High"),
    tc("TC-CAN-009", "FR-CAN-001", "Show empty state when no job matches", "No job matches the filters.", "Keyword=NoSuchRole", "Search by unmatched keyword.", "System shows clear empty state without crashing.", "N", "Functional"),
    tc("TC-CAN-010", "FR-CAN-001", "Open selected job and switch to apply form", "Candidate sees active job in list.", "JobId active", "Click Select this job.", "Selected job is stored and UI switches to Apply section.", "N", "Functional", "High"),

    # Candidate - application submission
    tc("TC-CAN-011", "FR-CAN-002", "Submit valid application with PDF CV", "Candidate selected an active job.", "CV=resume.pdf; Size<5MB", "Fill full name/email/phone > upload PDF > submit.", "Application is saved with New Applied status and confirmation message.", "N", "EP", "High"),
    tc("TC-CAN-012", "FR-CAN-002", "Submit valid application with DOC CV", "Candidate selected an active job.", "CV=resume.doc; Size<5MB", "Upload DOC CV and submit valid form.", "Application is accepted.", "N", "EP"),
    tc("TC-CAN-013", "FR-CAN-002", "Submit valid application with DOCX CV", "Candidate selected an active job.", "CV=resume.docx; Size<5MB", "Upload DOCX CV and submit valid form.", "Application is accepted.", "N", "EP"),
    tc("TC-CAN-014", "FR-CAN-002", "Reject application without selected job", "Candidate is on Apply section without selected job.", "JobId missing", "Fill form and submit.", "System asks candidate to select a job first.", "A", "EP", "High"),
    tc("TC-CAN-015", "FR-CAN-002", "Reject application with empty full name", "Candidate selected active job.", "FullName empty", "Leave full name empty > submit.", "System shows full name required error.", "A", "EP", "High"),
    tc("TC-CAN-016", "FR-CAN-002", "Reject application with invalid email", "Candidate selected active job.", "Email=invalid-email", "Enter invalid email > submit.", "System shows email invalid error.", "A", "EP", "High"),
    tc("TC-CAN-017", "FR-CAN-002", "Reject application with empty phone", "Candidate selected active job.", "Phone empty", "Leave phone empty > submit.", "System shows phone required error.", "A", "EP", "High"),
    tc("TC-CAN-018", "FR-CAN-002", "Reject application without CV file", "Candidate selected active job.", "CV missing", "Fill form without CV > submit.", "System shows CV file required error.", "A", "EP", "High"),
    tc("TC-CAN-019", "FR-CAN-002", "Reject application with invalid CV extension", "Candidate selected active job.", "CV=resume.exe", "Upload EXE file > submit.", "System rejects file format.", "A", "EP", "High"),
    tc("TC-CAN-020", "FR-CAN-002", "Accept CV size exactly 5MB", "Candidate selected active job.", "CV size=5.00MB", "Upload 5MB allowed file > submit.", "System accepts file size boundary.", "B", "BVA", "High"),
    tc("TC-CAN-021", "FR-CAN-002", "Reject CV size over 5MB", "Candidate selected active job.", "CV size=5.01MB", "Upload over-sized file > submit.", "System rejects file size.", "B", "BVA", "High"),
    tc("TC-CAN-022", "FR-CAN-002", "Reject duplicate application within 30 days", "Candidate already applied to same job less than 30 days ago and not rejected.", "Same email + same JobId", "Submit another application.", "System rejects duplicate application.", "A", "Decision Table", "High"),
    tc("TC-CAN-023", "FR-CAN-002", "Allow re-apply after previous application was rejected", "Candidate has rejected application for same job.", "Same email + same JobId; previous status=Rejected", "Submit application again.", "System allows new application.", "N", "Decision Table", "High"),
    tc("TC-CAN-024", "FR-CAN-002", "Reject application to expired job", "Candidate selected expired job through stale UI/API.", "Job deadline expired", "Submit application.", "System rejects job expired or closed.", "A", "EP", "High"),
    tc("TC-CAN-025", "FR-CAN-002", "Submit application with optional cover letter empty", "Candidate selected active job.", "CoverLetter empty", "Leave cover letter empty and submit.", "System accepts application because cover letter is optional.", "N", "EP"),
    tc("TC-CAN-026", "FR-CAN-002", "Clear CV input and switch to history after success", "Candidate submits valid application.", "Valid application", "Submit application successfully.", "UI refreshes history, clears CV file field and opens History section.", "N", "Functional"),

    # Candidate - history and status tracking
    tc("TC-CAN-027", "FR-CAN-003", "View application history by candidate email", "Candidate has submitted applications.", "Email=candidate@example.com", "Login Candidate > History.", "System displays only applications submitted by the candidate email.", "N", "Functional", "High"),
    tc("TC-CAN-028", "FR-CAN-003", "Map New Applied to waiting label", "Application status is New Applied.", "Status=New Applied", "Open History.", "Candidate sees Waiting for CV screening.", "N", "Functional"),
    tc("TC-CAN-029", "FR-CAN-003", "Map CV Passed to candidate label", "Application status is CV Passed.", "Status=CV Passed", "Open History.", "Candidate sees CV passed.", "N", "Functional"),
    tc("TC-CAN-030", "FR-CAN-003", "Map Interview Scheduled to candidate label", "Application status is Interview Scheduled.", "Status=Interview Scheduled", "Open History.", "Candidate sees Interview scheduled.", "N", "Functional"),
    tc("TC-CAN-031", "FR-CAN-003", "Map Interview Failed to candidate label", "Application status is Interview Failed.", "Status=Interview Failed", "Open History.", "Candidate sees Not selected after interview.", "N", "Functional"),
    tc("TC-CAN-032", "FR-CAN-003", "Map Offered to candidate label", "Application status is Offered.", "Status=Offered", "Open History.", "Candidate sees Offer sent.", "N", "Functional"),
    tc("TC-CAN-033", "FR-CAN-003", "Map Hired to candidate label", "Application status is Hired.", "Status=Hired", "Open History.", "Candidate sees Hired.", "N", "Functional"),
    tc("TC-CAN-034", "FR-CAN-003", "Show empty history for new candidate", "Candidate has no applications.", "Email has no applications", "Open History.", "System shows empty state instead of error.", "N", "Functional"),

    # Admin - accounts, approval and audit
    tc("TC-ADM-001", "FR-ADM-001", "Create Employer staff account with company email", "Admin account is active.", "Email=hrstaff@company.com; Role=Employer", "Login Admin > Accounts > fill valid data > Create.", "System creates active Employer account.", "N", "EP", "High"),
    tc("TC-ADM-002", "FR-ADM-001", "Create Interviewer account with company email", "Admin account is active.", "Email=interviewer2@company.com; Role=Interviewer", "Create account with Interviewer role.", "System creates active Interviewer account.", "N", "EP", "High"),
    tc("TC-ADM-003", "FR-ADM-001", "Reject staff account with non-company email", "Admin account is active.", "Email=user@gmail.com", "Create staff account with gmail email.", "System requires @company.com email.", "A", "EP", "High"),
    tc("TC-ADM-004", "FR-ADM-001", "Reject account creation with empty full name", "Admin account is active.", "FullName empty", "Create account without full name.", "System shows full name required error.", "A", "EP", "High"),
    tc("TC-ADM-005", "FR-ADM-001", "Reject account creation with empty phone", "Admin account is active.", "Phone empty", "Create account without phone.", "System shows phone required error.", "A", "EP"),
    tc("TC-ADM-006", "FR-ADM-001", "Lock active user account", "Admin account is active and target user exists.", "AccountStatus=Locked", "Click Lock on active account.", "Target account becomes Locked and audit log is recorded.", "N", "Functional", "High"),
    tc("TC-ADM-007", "FR-ADM-001", "Unlock locked user account", "Target account is Locked.", "AccountStatus=Active", "Click Unlock on locked account.", "Target account becomes Active and can sign in.", "N", "Functional", "High"),
    tc("TC-ADM-008", "FR-ADM-001", "Block login for locked account", "A user account is Locked.", "Locked Employer email", "Try to login with locked account.", "System rejects login because account is locked.", "A", "RBAC", "High"),
    tc("TC-ADM-009", "FR-ADM-001", "Change staff role from Employer to Interviewer", "Admin account is active and target staff exists.", "Role=Interviewer", "Update account role.", "System saves new role and dashboard changes on next login.", "N", "Functional"),
    tc("TC-ADM-010", "FR-ADM-001", "Reject account update by non-admin actor", "Employer account is active.", "ActorRole=Employer", "Call account update as Employer.", "System denies access.", "A", "RBAC", "High"),
    tc("TC-ADM-011", "FR-ADM-001", "List active and locked account counts", "Accounts exist with mixed statuses.", "Active/Locked users", "Open Admin dashboard.", "Overview shows correct active and locked user counts.", "N", "Functional"),
    tc("TC-ADM-012", "FR-ADM-001", "Reset demo data as Admin", "Admin account is active.", "ActorRole=Admin", "Click Reset demo data.", "System resets seed data and logs user out to Login.", "N", "Functional", "High"),
    tc("TC-ADM-013", "FR-ADM-001", "Reject reset demo data by non-admin", "Employer or Candidate account is active.", "ActorRole=Employer", "Call reset data endpoint.", "System denies access.", "A", "RBAC", "High"),
    tc("TC-ADM-014", "FR-ADM-001", "Login works after reset demo data", "Admin reset data successfully.", "Demo account email", "Login again with demo account.", "Demo account can sign in using seeded data.", "N", "Functional", "High"),
    tc("TC-ADM-015", "FR-ADM-001", "Approve pending job post", "A job post has Pending Approval status.", "Approved=true", "Open Job approvals > click Approve.", "Job status becomes Active and appears in candidate search.", "N", "Functional", "High"),
    tc("TC-ADM-016", "FR-ADM-001", "Reject pending job post", "A job post has Pending Approval status.", "Approved=false", "Open Job approvals > click Reject.", "Job status becomes Rejected and stays hidden from candidate search.", "N", "Functional", "High"),
    tc("TC-ADM-017", "FR-ADM-001", "Reject job approval by non-admin actor", "Pending job exists.", "ActorRole=Employer", "Call approval endpoint as Employer.", "System denies access.", "A", "RBAC", "High"),
    tc("TC-ADM-018", "FR-ADM-001", "Show pending job count on Admin dashboard", "Pending jobs exist.", "Pending Approval jobs", "Open Admin dashboard.", "Pending job overview count matches data.", "N", "Functional"),

    tc("TC-ADM-019", "FR-ADM-002", "Display audit logs to Admin", "Audit logs exist.", "ActorRole=Admin", "Open Admin > Audit logs.", "System displays audit records as read-only rows.", "N", "Functional", "High"),
    tc("TC-ADM-020", "FR-ADM-002", "Filter audit logs by action type", "Audit logs contain multiple action types.", "ActionType=UPDATE_STATUS", "Search/filter audit logs.", "Only matching audit logs are displayed.", "N", "EP"),
    tc("TC-ADM-021", "FR-ADM-002", "Reject edit audit log", "Admin is viewing audit logs.", "PATCH audit log", "Attempt to edit an audit log record.", "System returns read-only error.", "A", "Negative", "High"),
    tc("TC-ADM-022", "FR-ADM-002", "Reject delete audit log", "Admin is viewing audit logs.", "DELETE audit log", "Attempt to delete an audit log record.", "System returns read-only error.", "A", "Negative", "High"),
    tc("TC-ADM-023", "FR-ADM-002", "Reject audit log access by Employer", "Employer account is active.", "ActorRole=Employer", "Call audit logs endpoint as Employer.", "System denies access.", "A", "RBAC", "High"),
    tc("TC-ADM-024", "FR-ADM-002", "Record audit after admin account action", "Admin locks/unlocks an account.", "Action=LOCK_ACCOUNT", "Lock account > open Audit logs.", "Audit log contains admin user, action type, target entity and success status.", "N", "Functional", "High"),
]


MODULE_SHEETS = {
    "EMP": "Employer",
    "CAN": "Candidate",
    "ADM": "Admin",
}


def cases_by_module(module):
    prefix = f"TC-{module}-"
    return [case for case in TEST_CASES if case["TC_ID"].startswith(prefix)]


def summary():
    return {
        "created_date": date.today().isoformat(),
        "total": len(TEST_CASES),
        "pass": sum(1 for case in TEST_CASES if case["Status"] == "Pass"),
        "fail": sum(1 for case in TEST_CASES if case["Status"] == "Fail"),
        "untested": sum(1 for case in TEST_CASES if case["Status"] == "Untested"),
    }


assert len(TEST_CASES) == 98, f"Expected 98 test cases, got {len(TEST_CASES)}"
assert (len(cases_by_module("EMP")), len(cases_by_module("CAN")), len(cases_by_module("ADM"))) == (40, 34, 24)
