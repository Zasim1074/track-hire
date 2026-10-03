from app.models.application import ApplicationStatus

VALID_TRANSITIONS = {
    ApplicationStatus.APPLIED: {
        ApplicationStatus.SCREENING,
        ApplicationStatus.REJECTED,
    },
    ApplicationStatus.SCREENING: {
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
    },
    ApplicationStatus.SHORTLISTED: {
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.REJECTED,
    },
    ApplicationStatus.INTERVIEW: {
        ApplicationStatus.SELECTED,
        ApplicationStatus.REJECTED,
    },
    ApplicationStatus.SELECTED: set(),
    ApplicationStatus.REJECTED: set(),
    ApplicationStatus.WITHDRAWN: set(),
}
