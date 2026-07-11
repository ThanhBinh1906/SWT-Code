using Microsoft.EntityFrameworkCore;

public static class RmsValidators
{
    public static string? ValidateJobPost(JobPostRequest request)
    {
        if (request.EmployerId <= 0) return "Error: Employer login required";
        if (string.IsNullOrWhiteSpace(request.Title)) return "Error: Title is required";
        if (request.Quantity is null || request.Quantity <= 0) return "Error: Quantity must be > 0";
        if (request.Deadline is null || request.Deadline.Value.Date <= DateTime.UtcNow.Date) return "Error: Deadline invalid";
        if (request.Deadline.Value.Date < DateTime.UtcNow.Date.AddDays(3)) return "Error: Deadline must be at least +3 days";
        if (string.IsNullOrWhiteSpace(request.JobDescription)) return "Error: JD is required";
        return null;
    }

    public static async Task<string?> ValidateApplication(
        RmsDbContext db,
        bool isValidJob,
        int jobId,
        string fullName,
        string email,
        string phone,
        IFormFile? file)
    {
        if (!isValidJob) return "Error: Job is expired or closed";
        if (string.IsNullOrWhiteSpace(fullName)) return "Error: Full name is required";
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@')) return "Error: Email is invalid";
        if (string.IsNullOrWhiteSpace(phone)) return "Error: Phone is required";
        if (file is null || file.Length == 0) return "Error: CV file is required";

        var extension = Path.GetExtension(file.FileName);
        var allowed = new[] { ".pdf", ".doc", ".docx" };
        if (!allowed.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            return "Error: CV format must be .pdf, .doc, .docx";
        }

        var sizeMb = file.Length / 1024m / 1024m;
        if (sizeMb > 5m) return "Error: CV file size must not exceed 5MB";

        var cutoff = DateTime.UtcNow.AddDays(-30);
        var duplicate = await db.Applications
            .AnyAsync(a => a.JobId == jobId
                && a.CandidateEmail == email
                && a.SubmittedAt > cutoff
                && a.ApplicationStatus != "Rejected");
        if (duplicate) return "Error: Duplicate application within 30 days";

        return null;
    }

    public static async Task<string?> ValidateInterview(RmsDbContext db, Application? application, InterviewRequest request)
    {
        if (application is null) return "Error: Application not found";
        if (application.ApplicationStatus == "New Applied") return "Error: Application must pass CV before scheduling interview";
        if (application.ApplicationStatus == "Interview Scheduled") return "Error: Interview already scheduled for this application";
        if (application.ApplicationStatus != "CV Passed") return "Error: Only CV Passed applications can be scheduled";

        if (request.InterviewMode is not "Online" and not "Offline")
        {
            return "Error: Interview mode invalid";
        }

        if (request.InterviewTime.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            return "Error: Interview must be Monday-Friday";
        }

        var time = TimeOnly.FromDateTime(request.InterviewTime);
        var inMorning = time >= new TimeOnly(8, 0) && time <= new TimeOnly(12, 0);
        var inAfternoon = time >= new TimeOnly(13, 30) && time <= new TimeOnly(17, 30);
        if (!inMorning && !inAfternoon) return "Error: Time outside working hours";

        if (request.InterviewMode == "Online" && string.IsNullOrWhiteSpace(request.LocationOrLink))
        {
            return "Error: Online meeting link is required";
        }

        if (request.InterviewerUserIds is null || request.InterviewerUserIds.Count == 0)
        {
            return "Error: At least one interviewer is required";
        }

        var interviewerIds = request.InterviewerUserIds.Distinct().ToList();
        var activeInterviewerCount = await db.Users
            .CountAsync(u => interviewerIds.Contains(u.Id) && u.Role == "Interviewer" && u.AccountStatus == "Active");
        if (activeInterviewerCount != interviewerIds.Count)
        {
            return "Error: Interviewer must be active";
        }

        var conflict = await db.InterviewParticipants
            .Include(p => p.Interview)
            .AnyAsync(p => interviewerIds.Contains(p.InterviewerUserId)
                && p.Interview != null
                && p.Interview.InterviewTime == request.InterviewTime
                && p.Interview.InterviewStatus != "Canceled");

        return conflict ? "Error: Interviewer schedule conflict" : null;
    }

    public static string? ValidateApplicationTransition(string oldStatus, string newStatus)
    {
        var allowed = (oldStatus, newStatus) switch
        {
            ("New Applied", "CV Passed") => true,
            ("New Applied", "Rejected") => true,
            ("CV Passed", "Interview Scheduled") => true,
            ("CV Passed", "Rejected") => true,
            ("Interview Scheduled", "Interview Passed") => true,
            ("Interview Scheduled", "Interview Failed") => true,
            ("Interview Scheduled", "Rejected") => true,
            ("Interview Passed", "Offered") => true,
            ("Interview Passed", "Rejected") => true,
            ("Offered", "Hired") => true,
            ("Offered", "Rejected") => true,
            _ => false
        };

        return allowed ? null : $"Error: Cannot change application from {oldStatus} to {newStatus}";
    }
}
