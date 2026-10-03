"""add candidate saved jobs

Revision ID: e730efc2a920
Revises: dd1cceb2ecb7
Create Date: 2026-10-04
"""

from alembic import op
import sqlalchemy as sa

revision = "e730efc2a920"
down_revision = "dd1cceb2ecb7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saved_jobs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("candidate_id", sa.Uuid(), nullable=False),
        sa.Column("job_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["candidate_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("candidate_id", "job_id", name="uq_saved_job_candidate_job"),
    )


def downgrade() -> None:
    op.drop_table("saved_jobs")
