"""add production integrity constraints and query indexes

Revision ID: 7f4b8d2a61ce
Revises: a91f3c4add
Create Date: 2026-11-20
"""

from alembic import op
import sqlalchemy as sa


revision = "7f4b8d2a61ce"
down_revision = "a91f3c4add"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)
    op.add_column("jobs", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE jobs SET published_at = created_at WHERE status = 'PUBLISHED'")
    op.alter_column(
        "interviews",
        "scheduled_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        postgresql_using="scheduled_at AT TIME ZONE 'UTC'",
        existing_nullable=False,
    )
    op.create_check_constraint("ck_jobs_min_experience_nonnegative", "jobs", "min_experience >= 0")
    op.create_check_constraint("ck_jobs_experience_range", "jobs", "max_experience IS NULL OR max_experience >= min_experience")
    op.create_check_constraint("ck_jobs_min_salary_nonnegative", "jobs", "min_salary IS NULL OR min_salary >= 0")
    op.create_check_constraint("ck_jobs_max_salary_nonnegative", "jobs", "max_salary IS NULL OR max_salary >= 0")
    op.create_check_constraint("ck_jobs_salary_range", "jobs", "min_salary IS NULL OR max_salary IS NULL OR max_salary >= min_salary")
    op.create_index("ix_jobs_public_listing", "jobs", ["status", "is_active", "created_at"])
    op.create_index("ix_jobs_company_status", "jobs", ["company_id", "status"])
    op.create_index("ix_applications_candidate_status", "applications", ["candidate_id", "status"])
    op.create_index("ix_applications_job_status", "applications", ["job_id", "status"])
    op.create_check_constraint("ck_interviews_round_positive", "interviews", "round_number > 0")
    op.create_check_constraint("ck_interviews_duration", "interviews", "duration_minutes > 0 AND duration_minutes <= 480")
    op.create_index("ix_interviews_interviewer_schedule", "interviews", ["interviewer_id", "scheduled_at", "status"])
    op.create_check_constraint("ck_feedback_rating", "interview_feedback", "rating >= 1 AND rating <= 5")


def downgrade() -> None:
    op.drop_constraint("ck_feedback_rating", "interview_feedback", type_="check")
    op.drop_index("ix_interviews_interviewer_schedule", table_name="interviews")
    op.drop_constraint("ck_interviews_duration", "interviews", type_="check")
    op.drop_constraint("ck_interviews_round_positive", "interviews", type_="check")
    op.alter_column(
        "interviews",
        "scheduled_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        postgresql_using="scheduled_at AT TIME ZONE 'UTC'",
        existing_nullable=False,
    )
    op.drop_index("ix_applications_job_status", table_name="applications")
    op.drop_index("ix_applications_candidate_status", table_name="applications")
    op.drop_index("ix_jobs_company_status", table_name="jobs")
    op.drop_index("ix_jobs_public_listing", table_name="jobs")
    op.drop_constraint("ck_jobs_salary_range", "jobs", type_="check")
    op.drop_constraint("ck_jobs_max_salary_nonnegative", "jobs", type_="check")
    op.drop_constraint("ck_jobs_min_salary_nonnegative", "jobs", type_="check")
    op.drop_constraint("ck_jobs_experience_range", "jobs", type_="check")
    op.drop_constraint("ck_jobs_min_experience_nonnegative", "jobs", type_="check")
    op.drop_column("jobs", "published_at")
    op.drop_index("uq_users_email_lower", table_name="users")
