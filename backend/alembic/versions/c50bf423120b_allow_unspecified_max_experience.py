"""allow jobs without a maximum experience

Revision ID: c50bf423120b
Revises: e730efc2a920
Create Date: 2026-10-04
"""

from alembic import op
import sqlalchemy as sa

revision = "c50bf423120b"
down_revision = "e730efc2a920"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("jobs", "max_experience", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.execute("UPDATE jobs SET max_experience = min_experience WHERE max_experience IS NULL")
    op.alter_column("jobs", "max_experience", existing_type=sa.Integer(), nullable=False)
