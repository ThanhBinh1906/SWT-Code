using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddDbContext<RmsDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")
        ?? "Data Source=rms-swt.db"));
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors("frontend");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RmsDbContext>();
    db.Database.EnsureCreated();
    SeedData.EnsureSeeded(db);
}

app.MapGet("/api/health", () => Results.Ok(new { status = "OK", app = "RMS SWT API" }));

app.MapPost("/api/auth/login", async (LoginRequest request, RmsDbContext db) =>
{
    var user = await db.Users
        .FirstOrDefaultAsync(u => u.Email == request.Email && u.Role == request.Role);

    if (user is null || user.AccountStatus != "Active")
    {
        return Results.BadRequest(new { message = "Invalid credentials or account is locked" });
    }

    return Results.Ok(new { user.Id, user.FullName, user.Email, user.Role, user.AccountStatus });
});

app.MapGet("/api/jobs", async (
    string? keyword,
    string? location,
    string? level,
    decimal? minSalary,
    decimal? maxSalary,
    RmsDbContext db) =>
{
    var today = DateTime.UtcNow.Date;
    var query = db.JobPosts
        .Where(j => j.PostStatus == "Active" && j.Deadline.Date >= today);

    if (!string.IsNullOrWhiteSpace(keyword))
    {
        query = query.Where(j => j.Title.Contains(keyword) || j.JobDescription.Contains(keyword) || j.JobRequirements.Contains(keyword));
    }

    if (!string.IsNullOrWhiteSpace(location))
    {
        query = query.Where(j => j.Location.Contains(location));
    }

    if (!string.IsNullOrWhiteSpace(level))
    {
        query = query.Where(j => j.Level.Contains(level));
    }

    if (minSalary is not null)
    {
        query = query.Where(j => j.SalaryMax >= minSalary);
    }

    if (maxSalary is not null)
    {
        query = query.Where(j => j.SalaryMin <= maxSalary);
    }

    return await query.OrderByDescending(j => j.CreatedAt).ToListAsync();
});

app.MapGet("/api/jobs/{id:int}", async (int id, RmsDbContext db) =>
{
    var job = await db.JobPosts.FindAsync(id);
    return job is null ? Results.NotFound(new { message = "Job not found" }) : Results.Ok(job);
});

app.MapGet("/api/employer/jobs", async (int employerId, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, employerId, "Employer", "Employer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var jobs = await db.JobPosts
        .Where(j => j.EmployerId == employerId)
        .OrderByDescending(j => j.CreatedAt)
        .ToListAsync();

    return Results.Ok(jobs);
});

app.MapGet("/api/admin/jobs", async (int actorId, string actorRole, string? status, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, actorId, actorRole, "Admin");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var query = db.JobPosts.AsQueryable();
    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(j => j.PostStatus == status);
    }

    var jobs = await query.OrderByDescending(j => j.CreatedAt).ToListAsync();
    return Results.Ok(jobs);
});

app.MapPost("/api/jobs", async (JobPostRequest request, RmsDbContext db) =>
{
    var validation = RmsValidators.ValidateJobPost(request);
    if (validation is not null)
    {
        return Results.BadRequest(new { message = validation });
    }

    var actorError = await ValidateActorRole(db, request.EmployerId, "Employer", "Employer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var status = request.Action == "Save Draft" ? "Draft" : "Pending Approval";
    var job = new JobPost
    {
        EmployerId = request.EmployerId,
        Title = request.Title.Trim(),
        Department = request.Department?.Trim() ?? "",
        Location = request.Location?.Trim() ?? "",
        Level = request.Level?.Trim() ?? "",
        Quantity = request.Quantity!.Value,
        SalaryMin = request.SalaryMin,
        SalaryMax = request.SalaryMax,
        SalaryType = request.SalaryType?.Trim() ?? "Negotiable",
        JobDescription = request.JobDescription.Trim(),
        JobRequirements = request.JobRequirements?.Trim() ?? "",
        Deadline = request.Deadline!.Value.Date,
        PostStatus = status
    };

    db.JobPosts.Add(job);
    await AddAudit(db, request.EmployerId, "CREATE_JOB_POST", "JobPost", null, null, status);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = status == "Draft" ? "Saved as Draft" : "Saved as Pending Approval", job });
});

app.MapPatch("/api/admin/jobs/{id:int}/approval", async (int id, ApprovalRequest request, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, request.ActorId, request.ActorRole, "Admin");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var job = await db.JobPosts.FindAsync(id);
    if (job is null)
    {
        return Results.NotFound(new { message = "Job not found" });
    }

    if (job.PostStatus != "Pending Approval")
    {
        return Results.BadRequest(new { message = "Error: Only Pending Approval jobs can be reviewed" });
    }

    var oldStatus = job.PostStatus;
    job.PostStatus = request.Approved ? "Active" : "Rejected";
    job.ApprovedAt = request.Approved ? DateTime.UtcNow : null;
    await AddAudit(db, request.ActorId, "APPROVE_REJECT_JOB", "JobPost", job.Id, oldStatus, job.PostStatus);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = $"Job status updated to {job.PostStatus}", job });
});

app.MapPost("/api/applications", async (HttpRequest request, RmsDbContext db, IWebHostEnvironment env) =>
{
    var form = await request.ReadFormAsync();
    var jobId = int.TryParse(form["jobId"], out var parsedJobId) ? parsedJobId : 0;
    var fullName = form["fullName"].ToString();
    var email = form["email"].ToString();
    var phone = form["phone"].ToString();
    var coverLetter = form["coverLetter"].ToString();
    var file = form.Files.GetFile("cvFile");

    var job = await db.JobPosts.FindAsync(jobId);
    var isValidJob = job is not null && job.PostStatus == "Active" && job.Deadline.Date >= DateTime.UtcNow.Date;
    var validation = await RmsValidators.ValidateApplication(db, isValidJob, jobId, fullName, email, phone, file);
    if (validation is not null)
    {
        return Results.BadRequest(new { message = validation });
    }

    var uploadDir = Path.Combine(env.ContentRootPath, "uploads", "cv");
    Directory.CreateDirectory(uploadDir);
    var safeName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Path.GetFileName(file!.FileName)}";
    var savePath = Path.Combine(uploadDir, safeName);
    await using (var stream = File.Create(savePath))
    {
        await file.CopyToAsync(stream);
    }

    var application = new Application
    {
        JobId = jobId,
        CandidateEmail = email.Trim(),
        ApplicantName = fullName.Trim(),
        ApplicantPhone = phone.Trim(),
        CoverLetter = coverLetter,
        ApplicationStatus = "New Applied"
    };
    db.Applications.Add(application);
    await db.SaveChangesAsync();

    var cvFile = new CvFile
    {
        ApplicationId = application.Id,
        OriginalFileName = file.FileName,
        FileExtension = Path.GetExtension(file.FileName),
        FileSizeMb = Math.Round(file.Length / 1024m / 1024m, 2),
        StorageUrl = savePath
    };
    db.CvFiles.Add(cvFile);
    db.EmailNotifications.Add(new EmailNotification
    {
        RecipientEmail = email.Trim(),
        EmailType = "ApplicationConfirmation",
        Subject = "Application submitted",
        SendStatus = "MockSent",
        RelatedApplicationId = application.Id
    });
    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Application saved; status New Applied",
        application = ToApplicationResponse(application, job, cvFile)
    });
});

app.MapGet("/api/applications", async (
    int? jobId,
    int employerId,
    string? status,
    string? keyword,
    bool includeArchived,
    RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, employerId, "Employer", "Employer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var query = db.Applications.Include(a => a.Job).Include(a => a.CvFile).AsQueryable();

    query = query.Where(a => a.Job != null && a.Job.EmployerId == employerId);

    if (jobId is not null)
    {
        query = query.Where(a => a.JobId == jobId);
    }

    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(a => a.ApplicationStatus == status);
    }

    if (!string.IsNullOrWhiteSpace(keyword))
    {
        query = query.Where(a => a.ApplicantName.Contains(keyword) || a.CandidateEmail.Contains(keyword));
    }

    if (!includeArchived)
    {
        query = query.Where(a => !a.IsArchived);
    }

    var applications = await query
        .OrderByDescending(a => a.SubmittedAt)
        .Select(a => new
        {
            a.Id,
            a.JobId,
            a.CandidateEmail,
            a.ApplicantName,
            a.ApplicantPhone,
            a.CoverLetter,
            a.ApplicationStatus,
            a.IsArchived,
            a.SubmittedAt,
            a.UpdatedAt,
            Job = a.Job == null ? null : new
            {
                a.Job.Id,
                a.Job.Title,
                a.Job.Location,
                a.Job.Level
            },
            CvFile = a.CvFile == null ? null : new
            {
                a.CvFile.Id,
                a.CvFile.OriginalFileName,
                a.CvFile.FileExtension,
                a.CvFile.FileSizeMb
            }
        })
        .ToListAsync();

    return Results.Ok(applications);
});

app.MapGet("/api/candidate/applications", async (string email, RmsDbContext db) =>
    await db.Applications
        .Include(a => a.Job)
        .Where(a => a.CandidateEmail == email)
        .OrderByDescending(a => a.SubmittedAt)
        .Select(a => new
        {
            a.Id,
            JobTitle = a.Job == null ? "" : a.Job.Title,
            a.SubmittedAt,
            Status = a.ApplicationStatus == "New Applied"
                ? "Waiting for CV screening"
                : a.ApplicationStatus == "CV Passed"
                    ? "CV passed"
                    : a.ApplicationStatus == "Interview Scheduled"
                        ? "Interview scheduled"
                        : a.ApplicationStatus == "Interview Passed"
                            ? "Interview passed"
                            : a.ApplicationStatus == "Interview Failed"
                                ? "Not selected after interview"
                                : a.ApplicationStatus == "Offered"
                                    ? "Offer sent"
                                    : a.ApplicationStatus
        })
        .ToListAsync());

app.MapGet("/api/cv-files/{id:int}/download", async (int id, int employerId, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, employerId, "Employer", "Employer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var cvFile = await db.CvFiles
        .Include(c => c.Application)
        .ThenInclude(a => a!.Job)
        .FirstOrDefaultAsync(c => c.Id == id);

    if (cvFile?.Application?.Job is null)
    {
        return Results.NotFound(new { message = "CV file not found" });
    }

    if (cvFile.Application.Job.EmployerId != employerId)
    {
        return Results.BadRequest(new { message = "Error: CV file does not belong to this employer" });
    }

    if (!File.Exists(cvFile.StorageUrl))
    {
        return Results.NotFound(new { message = "CV file is missing from storage" });
    }

    var contentType = cvFile.FileExtension.ToLowerInvariant() switch
    {
        ".pdf" => "application/pdf",
        ".doc" => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        _ => "application/octet-stream"
    };

    return Results.File(cvFile.StorageUrl, contentType, cvFile.OriginalFileName, enableRangeProcessing: true);
});

app.MapPatch("/api/applications/{id:int}/status", async (int id, StatusUpdateRequest request, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, request.ActorId, "Employer", "Employer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var application = await db.Applications.Include(a => a.Job).FirstOrDefaultAsync(a => a.Id == id);
    if (application is null)
    {
        return Results.NotFound(new { message = "Application not found" });
    }

    if (application.Job?.EmployerId != request.ActorId)
    {
        return Results.BadRequest(new { message = "Error: Application does not belong to this employer" });
    }

    var oldStatus = application.ApplicationStatus;
    var validation = RmsValidators.ValidateApplicationTransition(oldStatus, request.NewStatus);
    if (validation is not null)
    {
        return Results.BadRequest(new { message = validation });
    }

    application.ApplicationStatus = request.NewStatus;
    application.IsArchived = request.NewStatus == "Rejected";
    db.ApplicationStatusHistories.Add(new ApplicationStatusHistory
    {
        ApplicationId = application.Id,
        ChangedByUserId = request.ActorId,
        OldStatus = oldStatus,
        NewStatus = request.NewStatus,
        Note = request.Note ?? ""
    });
    await AddAudit(db, request.ActorId, "UPDATE_APPLICATION_STATUS", "Application", application.Id, oldStatus, request.NewStatus);
    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = application.IsArchived ? "Status updated and application archived" : "Status updated",
        application = ToApplicationResponse(application, application.Job, null)
    });
});

app.MapPost("/api/interviews", async (InterviewRequest request, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, request.ScheduledByUserId, "Employer", "Employer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var application = await db.Applications.Include(a => a.Job).FirstOrDefaultAsync(a => a.Id == request.ApplicationId);
    if (application is null)
    {
        return Results.NotFound(new { message = "Application not found" });
    }

    if (application.Job?.EmployerId != request.ScheduledByUserId)
    {
        return Results.BadRequest(new { message = "Error: Application does not belong to this employer" });
    }

    var validation = await RmsValidators.ValidateInterview(db, application, request);
    if (validation is not null)
    {
        return Results.BadRequest(new { message = validation });
    }

    var interview = new Interview
    {
        ApplicationId = request.ApplicationId,
        ScheduledByUserId = request.ScheduledByUserId,
        InterviewTime = request.InterviewTime,
        InterviewMode = request.InterviewMode,
        LocationOrLink = request.LocationOrLink?.Trim() ?? "",
        InterviewStatus = "Scheduled",
        EmailSent = true
    };
    db.Interviews.Add(interview);
    await db.SaveChangesAsync();

    var oldStatus = application!.ApplicationStatus;
    application.ApplicationStatus = "Interview Scheduled";
    application.IsArchived = false;
    db.ApplicationStatusHistories.Add(new ApplicationStatusHistory
    {
        ApplicationId = application.Id,
        ChangedByUserId = request.ScheduledByUserId,
        OldStatus = oldStatus,
        NewStatus = application.ApplicationStatus,
        Note = "Interview scheduled"
    });

    foreach (var interviewerId in request.InterviewerUserIds.Distinct())
    {
        db.InterviewParticipants.Add(new InterviewParticipant
        {
            InterviewId = interview.Id,
            InterviewerUserId = interviewerId,
            ParticipantStatus = "Invited"
        });
    }

    var candidateEmail = application.CandidateEmail;
    db.EmailNotifications.Add(new EmailNotification
    {
        RecipientEmail = candidateEmail,
        EmailType = "InterviewInvitation",
        Subject = "Interview invitation",
        SendStatus = "MockSent",
        RelatedApplicationId = application.Id,
        RelatedInterviewId = interview.Id
    });
    await AddAudit(db, request.ScheduledByUserId, "SCHEDULE_INTERVIEW", "Interview", interview.Id, null, "Scheduled");
    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Interview schedule created; application moved to Interview Scheduled",
        interview = ToInterviewResponse(interview, application),
        application = ToApplicationResponse(application, application.Job, null)
    });
});

app.MapGet("/api/interviews", async (int employerId, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, employerId, "Employer", "Employer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var interviews = await db.Interviews
        .Include(i => i.Application)
        .ThenInclude(a => a!.Job)
        .Where(i => i.Application != null && i.Application.Job != null && i.Application.Job.EmployerId == employerId)
        .OrderByDescending(i => i.InterviewTime)
        .ToListAsync();

    return Results.Ok(await BuildInterviewList(db, interviews));
});

app.MapGet("/api/interviewer/interviews", async (int interviewerId, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, interviewerId, "Interviewer", "Interviewer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var interviewIds = await db.InterviewParticipants
        .Where(p => p.InterviewerUserId == interviewerId)
        .Select(p => p.InterviewId)
        .ToListAsync();

    var interviews = await db.Interviews
        .Include(i => i.Application)
        .ThenInclude(a => a!.Job)
        .Where(i => interviewIds.Contains(i.Id))
        .OrderBy(i => i.InterviewTime)
        .ToListAsync();

    return Results.Ok(await BuildInterviewList(db, interviews));
});

app.MapPatch("/api/interviews/{id:int}/result", async (int id, InterviewResultRequest request, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, request.ActorId, request.ActorRole, "Employer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    if (request.Result is not "Passed" and not "Failed")
    {
        return Results.BadRequest(new { message = "Error: Interview result invalid" });
    }

    var interview = await db.Interviews
        .Include(i => i.Application)
        .ThenInclude(a => a!.Job)
        .FirstOrDefaultAsync(i => i.Id == id);
    if (interview?.Application is null)
    {
        return Results.NotFound(new { message = "Interview not found" });
    }

    if (interview.Application.Job?.EmployerId != request.ActorId)
    {
        return Results.BadRequest(new { message = "Error: Interview does not belong to this employer" });
    }

    var newStatus = request.Result == "Passed" ? "Interview Passed" : "Interview Failed";
    var validation = RmsValidators.ValidateApplicationTransition(interview.Application.ApplicationStatus, newStatus);
    if (validation is not null)
    {
        return Results.BadRequest(new { message = validation });
    }

    var oldStatus = interview.Application.ApplicationStatus;
    interview.InterviewStatus = "Completed";
    interview.Application.ApplicationStatus = newStatus;
    interview.Application.IsArchived = false;
    db.ApplicationStatusHistories.Add(new ApplicationStatusHistory
    {
        ApplicationId = interview.Application.Id,
        ChangedByUserId = request.ActorId,
        OldStatus = oldStatus,
        NewStatus = newStatus,
        Note = $"Interview {request.Result.ToLowerInvariant()}"
    });
    await AddAudit(db, request.ActorId, "UPDATE_INTERVIEW_RESULT", "Interview", interview.Id, oldStatus, newStatus);
    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = $"Interview marked {request.Result.ToLowerInvariant()}",
        interview = ToInterviewResponse(interview, interview.Application),
        application = ToApplicationResponse(interview.Application, interview.Application.Job, null)
    });
});

app.MapPost("/api/admin/reset-demo-data", async (ResetDemoDataRequest request, RmsDbContext db, IWebHostEnvironment env) =>
{
    var actorError = await ValidateResetActor(db, request);
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    await ResetDemoData(db, env);
    var admin = await db.Users.FirstAsync(u => u.Email == "admin@company.com" && u.Role == "Admin");
    return Results.Ok(new
    {
        message = "Demo data reset successfully",
        user = new { admin.Id, admin.FullName, admin.Email, admin.Role, admin.AccountStatus }
    });
});

app.MapGet("/api/interviewers", async (int employerId, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, employerId, "Employer", "Employer");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var users = await db.Users
        .Where(u => u.Role == "Interviewer" && u.AccountStatus == "Active")
        .OrderBy(u => u.FullName)
        .ToListAsync();

    return Results.Ok(users);
});

app.MapGet("/api/admin/users", async (int actorId, string actorRole, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, actorId, actorRole, "Admin");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var users = await db.Users.OrderBy(u => u.Role).ThenBy(u => u.FullName).ToListAsync();
    return Results.Ok(users);
});

app.MapPost("/api/admin/users", async (CreateUserRequest request, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, request.ActorId, request.ActorRole, "Admin");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var allowedRoles = new[] { "Admin", "Employer", "Interviewer" };
    if (!allowedRoles.Contains(request.Role))
    {
        return Results.BadRequest(new { message = "Error: Invalid role" });
    }

    if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.EndsWith("@company.com", StringComparison.OrdinalIgnoreCase))
    {
        return Results.BadRequest(new { message = "Error: Company email required" });
    }

    var exists = await db.Users.AnyAsync(u => u.Email == request.Email);
    if (exists)
    {
        return Results.BadRequest(new { message = "Error: Email already exists" });
    }

    var user = new User
    {
        FullName = request.FullName.Trim(),
        Email = request.Email.Trim(),
        Phone = request.Phone?.Trim() ?? "",
        Role = request.Role,
        AccountStatus = "Active"
    };
    db.Users.Add(user);
    await db.SaveChangesAsync();

    db.EmailNotifications.Add(new EmailNotification
    {
        RecipientEmail = user.Email,
        EmailType = "PasswordSetup",
        Subject = "Setup your RMS password",
        SendStatus = "MockSent"
    });
    await AddAudit(db, request.ActorId, "CREATE_ACCOUNT", "User", user.Id, null, "Active");
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Account created; setup password email sent", user });
});

app.MapPatch("/api/admin/users/{id:int}", async (int id, UpdateUserRequest request, RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, request.ActorId, request.ActorRole, "Admin");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var user = await db.Users.FindAsync(id);
    if (user is null)
    {
        return Results.NotFound(new { message = "User not found" });
    }

    var oldValue = $"{user.Role}/{user.AccountStatus}";
    if (!string.IsNullOrWhiteSpace(request.Role))
    {
        var allowedRoles = new[] { "Admin", "Employer", "Interviewer", "Candidate" };
        if (!allowedRoles.Contains(request.Role))
        {
            return Results.BadRequest(new { message = "Error: Invalid role" });
        }
        if (user.Role == "Admin" && request.Role != "Admin")
        {
            return Results.BadRequest(new { message = "Error: Admin account role cannot be changed" });
        }
        user.Role = request.Role;
    }

    if (!string.IsNullOrWhiteSpace(request.AccountStatus))
    {
        var allowedStatuses = new[] { "Active", "Locked" };
        if (!allowedStatuses.Contains(request.AccountStatus))
        {
            return Results.BadRequest(new { message = "Error: Invalid account status" });
        }
        if (user.Role == "Admin" && request.AccountStatus == "Locked")
        {
            return Results.BadRequest(new { message = "Error: Admin account cannot be locked" });
        }
        user.AccountStatus = request.AccountStatus;
    }

    await AddAudit(db, request.ActorId, "UPDATE_ACCOUNT", "User", user.Id, oldValue, $"{user.Role}/{user.AccountStatus}");
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Account updated", user });
});

app.MapGet("/api/admin/audit-logs", async (
    int actorId,
    string actorRole,
    int? userId,
    string? actionType,
    DateTime? from,
    DateTime? to,
    RmsDbContext db) =>
{
    var actorError = await ValidateActorRole(db, actorId, actorRole, "Admin");
    if (actorError is not null)
    {
        return Results.BadRequest(new { message = actorError });
    }

    var query = db.AuditLogs.AsQueryable();

    if (userId is not null)
    {
        query = query.Where(l => l.UserId == userId);
    }

    if (!string.IsNullOrWhiteSpace(actionType))
    {
        query = query.Where(l => l.ActionType.Contains(actionType));
    }

    if (from is not null)
    {
        query = query.Where(l => l.CreatedAt >= from);
    }

    if (to is not null)
    {
        query = query.Where(l => l.CreatedAt <= to);
    }

    var logs = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();
    return Results.Ok(logs);
});

app.MapMethods("/api/admin/audit-logs/{id:int}", new[] { "PATCH", "DELETE" }, () =>
    Results.BadRequest(new { message = "Error: Audit logs are read-only" }));

app.Run();

static async Task<string?> ValidateActorRole(RmsDbContext db, int actorId, string actorRole, string requiredRole)
{
    if (actorId <= 0 || string.IsNullOrWhiteSpace(actorRole))
    {
        return "Error: Login required";
    }

    var actor = await db.Users.FindAsync(actorId);
    if (actor is null || actor.AccountStatus != "Active")
    {
        return "Error: Account not found or locked";
    }

    if (actor.Role != actorRole || actor.Role != requiredRole)
    {
        return "Error: Access denied";
    }

    return null;
}

static async Task<string?> ValidateResetActor(RmsDbContext db, ResetDemoDataRequest request)
{
    var actorError = await ValidateActorRole(db, request.ActorId, request.ActorRole, "Admin");
    if (actorError is null)
    {
        return null;
    }

    if (request.ActorRole != "Admin")
    {
        return actorError;
    }

    if (string.IsNullOrWhiteSpace(request.ActorEmail))
    {
        return null;
    }

    return null;
}

static async Task<List<InterviewListItem>> BuildInterviewList(RmsDbContext db, List<Interview> interviews)
{
    var interviewIds = interviews.Select(i => i.Id).ToList();
    var participants = await db.InterviewParticipants
        .Where(p => interviewIds.Contains(p.InterviewId))
        .Join(db.Users,
            participant => participant.InterviewerUserId,
            user => user.Id,
            (participant, user) => new { participant.InterviewId, user.FullName })
        .ToListAsync();

    return interviews.Select(interview => new InterviewListItem(
        interview.Id,
        interview.ApplicationId,
        interview.Application?.ApplicantName ?? "",
        interview.Application?.CandidateEmail ?? "",
        interview.Application?.Job?.Title ?? "",
        interview.InterviewTime,
        interview.InterviewMode,
        interview.LocationOrLink,
        interview.InterviewStatus,
        interview.Application?.ApplicationStatus ?? "",
        participants
            .Where(participant => participant.InterviewId == interview.Id)
            .Select(participant => participant.FullName)
            .ToList()
    )).ToList();
}

static object ToApplicationResponse(Application application, JobPost? job, CvFile? cvFile)
{
    return new
    {
        application.Id,
        application.JobId,
        application.CandidateEmail,
        application.ApplicantName,
        application.ApplicantPhone,
        application.CoverLetter,
        application.ApplicationStatus,
        application.IsArchived,
        application.SubmittedAt,
        application.UpdatedAt,
        Job = job is null ? null : new
        {
            job.Id,
            job.Title,
            job.Location,
            job.Level
        },
        CvFile = cvFile is null ? null : new
        {
            cvFile.Id,
            cvFile.OriginalFileName,
            cvFile.FileExtension,
            cvFile.FileSizeMb
        }
    };
}

static object ToInterviewResponse(Interview interview, Application? application)
{
    return new
    {
        interview.Id,
        interview.ApplicationId,
        interview.ScheduledByUserId,
        interview.InterviewTime,
        interview.InterviewMode,
        interview.LocationOrLink,
        interview.InterviewStatus,
        interview.EmailSent,
        interview.CreatedAt,
        Application = application is null ? null : new
        {
            application.Id,
            application.JobId,
            application.ApplicantName,
            application.CandidateEmail,
            application.ApplicationStatus
        }
    };
}

static async Task ResetDemoData(RmsDbContext db, IWebHostEnvironment env)
{
    db.InterviewParticipants.RemoveRange(db.InterviewParticipants);
    db.Interviews.RemoveRange(db.Interviews);
    db.ApplicationStatusHistories.RemoveRange(db.ApplicationStatusHistories);
    db.CvFiles.RemoveRange(db.CvFiles);
    db.Applications.RemoveRange(db.Applications);
    db.EmailNotifications.RemoveRange(db.EmailNotifications);
    db.AuditLogs.RemoveRange(db.AuditLogs);
    db.JobPosts.RemoveRange(db.JobPosts);
    db.Users.RemoveRange(db.Users);
    await db.SaveChangesAsync();

    var cvDir = Path.Combine(env.ContentRootPath, "uploads", "cv");
    if (Directory.Exists(cvDir))
    {
        Directory.Delete(cvDir, recursive: true);
    }

    db.ChangeTracker.Clear();
    SeedData.EnsureSeeded(db);
}

static async Task AddAudit(RmsDbContext db, int userId, string action, string entityType, int? entityId, string? oldValue, string? newValue)
{
    db.AuditLogs.Add(new AuditLog
    {
        UserId = userId,
        ActionType = action,
        EntityType = entityType,
        EntityId = entityId,
        OldValue = oldValue,
        NewValue = newValue,
        IpAddress = "127.0.0.1",
        ActionStatus = "Success"
    });
    await Task.CompletedTask;
}

public class RmsDbContext : DbContext
{
    public RmsDbContext(DbContextOptions<RmsDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<JobPost> JobPosts => Set<JobPost>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<CvFile> CvFiles => Set<CvFile>();
    public DbSet<ApplicationStatusHistory> ApplicationStatusHistories => Set<ApplicationStatusHistory>();
    public DbSet<Interview> Interviews => Set<Interview>();
    public DbSet<InterviewParticipant> InterviewParticipants => Set<InterviewParticipant>();
    public DbSet<EmailNotification> EmailNotifications => Set<EmailNotification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Application>()
            .HasOne(a => a.CvFile)
            .WithOne(c => c.Application)
            .HasForeignKey<CvFile>(c => c.ApplicationId);
    }
}

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Role { get; set; } = "Candidate";
    public string AccountStatus { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class JobPost
{
    public int Id { get; set; }
    public int EmployerId { get; set; }
    public string Title { get; set; } = "";
    public string Department { get; set; } = "";
    public string Location { get; set; } = "";
    public string Level { get; set; } = "";
    public int Quantity { get; set; }
    public decimal SalaryMin { get; set; }
    public decimal SalaryMax { get; set; }
    public string SalaryType { get; set; } = "Monthly";
    public string JobDescription { get; set; } = "";
    public string JobRequirements { get; set; } = "";
    public DateTime Deadline { get; set; }
    public string PostStatus { get; set; } = "Draft";
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Application
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public JobPost? Job { get; set; }
    public string CandidateEmail { get; set; } = "";
    public string ApplicantName { get; set; } = "";
    public string ApplicantPhone { get; set; } = "";
    public string CoverLetter { get; set; } = "";
    public string ApplicationStatus { get; set; } = "New Applied";
    public bool IsArchived { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public CvFile? CvFile { get; set; }
}

public class CvFile
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public Application? Application { get; set; }
    public string OriginalFileName { get; set; } = "";
    public string FileExtension { get; set; } = "";
    public decimal FileSizeMb { get; set; }
    public string StorageUrl { get; set; } = "";
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public class ApplicationStatusHistory
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int ChangedByUserId { get; set; }
    public string OldStatus { get; set; } = "";
    public string NewStatus { get; set; } = "";
    public string Note { get; set; } = "";
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}

public class Interview
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public Application? Application { get; set; }
    public int ScheduledByUserId { get; set; }
    public DateTime InterviewTime { get; set; }
    public string InterviewMode { get; set; } = "Online";
    public string LocationOrLink { get; set; } = "";
    public string InterviewStatus { get; set; } = "Scheduled";
    public bool EmailSent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class InterviewParticipant
{
    public int Id { get; set; }
    public int InterviewId { get; set; }
    public Interview? Interview { get; set; }
    public int InterviewerUserId { get; set; }
    public string ParticipantStatus { get; set; } = "Invited";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class EmailNotification
{
    public int Id { get; set; }
    public string RecipientEmail { get; set; } = "";
    public string EmailType { get; set; } = "";
    public string Subject { get; set; } = "";
    public string SendStatus { get; set; } = "MockSent";
    public int? RelatedApplicationId { get; set; }
    public int? RelatedInterviewId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ActionType { get; set; } = "";
    public string EntityType { get; set; } = "";
    public int? EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string IpAddress { get; set; } = "";
    public string ActionStatus { get; set; } = "Success";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public record LoginRequest(string Email, string Role);

public record JobPostRequest(
    int EmployerId,
    string Title,
    string? Department,
    string? Location,
    string? Level,
    int? Quantity,
    decimal SalaryMin,
    decimal SalaryMax,
    string? SalaryType,
    string JobDescription,
    string? JobRequirements,
    DateTime? Deadline,
    string Action);

public record ApprovalRequest(int ActorId, string ActorRole, bool Approved);

public record StatusUpdateRequest(int ActorId, string NewStatus, string? Note);

public record InterviewRequest(
    int ApplicationId,
    int ScheduledByUserId,
    DateTime InterviewTime,
    string InterviewMode,
    string LocationOrLink,
    List<int> InterviewerUserIds);

public record InterviewResultRequest(int ActorId, string ActorRole, string Result);

public record InterviewListItem(
    int Id,
    int ApplicationId,
    string ApplicantName,
    string CandidateEmail,
    string JobTitle,
    DateTime InterviewTime,
    string InterviewMode,
    string LocationOrLink,
    string InterviewStatus,
    string ApplicationStatus,
    List<string> InterviewerNames);

public record CreateUserRequest(int ActorId, string ActorRole, string FullName, string Email, string? Phone, string Role);

public record UpdateUserRequest(int ActorId, string ActorRole, string? Role, string? AccountStatus);

public record ResetDemoDataRequest(int ActorId, string ActorRole, string? ActorEmail);

public static class SeedData
{
    public static void EnsureSeeded(RmsDbContext db)
    {
        if (!db.Users.Any())
        {
            db.Users.AddRange(
                new User { FullName = "Admin Demo", Email = "admin@company.com", Role = "Admin" },
                new User { FullName = "Employer Demo", Email = "employer@company.com", Role = "Employer" },
                new User { FullName = "Interviewer Demo", Email = "interviewer@company.com", Role = "Interviewer" },
                new User { FullName = "Candidate Demo", Email = "candidate@example.com", Role = "Candidate" }
            );
            db.SaveChanges();
        }

        if (!db.JobPosts.Any())
        {
            var employer = db.Users.First(u => u.Role == "Employer");
            db.JobPosts.AddRange(
                new JobPost
                {
                    EmployerId = employer.Id,
                    Title = "Frontend React Intern",
                    Department = "Engineering",
                    Location = "Ho Chi Minh",
                    Level = "Intern",
                    Quantity = 3,
                    SalaryMin = 300,
                    SalaryMax = 500,
                    SalaryType = "Monthly",
                    JobDescription = "Build simple React screens and connect REST API.",
                    JobRequirements = "React, JavaScript, HTML/CSS",
                    Deadline = DateTime.UtcNow.Date.AddDays(14),
                    PostStatus = "Active",
                    ApprovedAt = DateTime.UtcNow
                },
                new JobPost
                {
                    EmployerId = employer.Id,
                    Title = ".NET Backend Intern",
                    Department = "Engineering",
                    Location = "Remote",
                    Level = "Intern",
                    Quantity = 2,
                    SalaryMin = 350,
                    SalaryMax = 600,
                    SalaryType = "Monthly",
                    JobDescription = "Develop REST API for RMS.",
                    JobRequirements = ".NET, SQL, REST API",
                    Deadline = DateTime.UtcNow.Date.AddDays(21),
                    PostStatus = "Active",
                    ApprovedAt = DateTime.UtcNow
                }
            );
            db.SaveChanges();
        }
    }
}
