class AppException(Exception):
    status_code: int = 500
    detail: str = "An unexpected application error occurred."


class EmailAlreadyExistsError(AppException):
    status_code = 409
    detail = "Email is already registered."


class InvalidCredentialsError(AppException):
    status_code = 401
    detail = "Invalid credentials."


class InactiveUserError(AppException):
    status_code = 403
    detail = "User is inactive."


class ForbiddenError(AppException):
    status_code = 403
    detail = "You don't have enough permissions."


class CompanyAlreadyExistsError(AppException):
    status_code = 409
    detail = "Company with this website already exists."


class CompanyNotFoundError(AppException):
    status_code = 404
    detail = "Company doesn't exist."


class CannotDeleteCompanyError(AppException):
    status_code = 409
    detail = "Company can't be deleted because there are jobs listed."


class JobNotFoundError(AppException):
    status_code = 404
    detail = "Job doesn't exist."


class ApplicationNotFoundError(AppException):
    status_code = 404
    detail = "Application doesn't exist."


class ApplicationAlreadyExistsError(AppException):
    status_code = 409
    detail = "Application already exists."


class StatusCannotBeSameError(AppException):
    status_code = 409
    detail = "Please update the status. The new status can't be the same."


class MembershipAlreadyExistsError(AppException):
    status_code = 409
    detail = "You already have a membership."


class MembershipNotFoundError(AppException):
    status_code = 404
    detail = "Membership doesn't exist."


class CandidateProfileAlreadyExistsError(AppException):
    status_code = 409
    detail = "Candidate profile already exists."


class CandidateProfileNotFoundError(AppException):
    status_code = 404
    detail = "Profile doesn't exist."


class ResumeNotFoundError(AppException):
    status_code = 404
    detail = "Resume doesn't exist."


class InvalidResumeFileError(AppException):
    status_code = 400
    detail = "Invalid resume file."


class AlreadyAppliedError(AppException):
    status_code = 409
    detail = "You have already applied for this job."


class JobNotAcceptingApplicationsError(AppException):
    status_code = 400
    detail = "This job is not accepting applications."


class InvalidApplicationStatusTransitionError(AppException):
    status_code = 400
    detail = "Invalid application status transition."


class InterviewConflictError(AppException):
    status_code = 409
    detail = "Interviewer already has an interview scheduled during this time."


class InterviewerNotFoundError(AppException):
    status_code = 404
    detail = "Interviewer not found."


class InterviewerNotEligibleError(AppException):
    status_code = 403
    detail = "The selected interviewer is not eligible."


class InterviewNotAllowedError(AppException):
    status_code = 403
    detail = "You are not allowed to perform this interview operation."


class InterviewNotFoundError(AppException):
    status_code = 404
    detail = "Interview not found."


class InvalidInterviewStatusTransitionError(AppException):
    status_code = 400
    detail = "Invalid interview status transition."


class FeedbackAlreadyExistsError(AppException):
    status_code = 409
    detail = "Feedback already exists for this interview."


class FeedbackNotFoundError(AppException):
    status_code = 404
    detail = "Feedback not found."


class FeedbackNotAllowedError(AppException):
    status_code = 403
    detail = "You are not allowed to access or submit this feedback."


class ApplicationDecisionNotAllowedError(AppException):
    status_code = 400
    detail = "This application cannot be accepted or rejected in its current state."
