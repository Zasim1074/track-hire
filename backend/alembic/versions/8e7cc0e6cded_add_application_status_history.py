"""add application status history

Revision ID: 8e7cc0e6cded
Revises: 905e55bfb475
Create Date: 2026-08-31 02:38:35.255578

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '8e7cc0e6cded'
down_revision: Union[str, Sequence[str], None] = '905e55bfb475'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create ENUM type if it doesn't already exist
    op.execute("DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN CREATE TYPE application_status AS ENUM ('APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'); END IF; END $$;")
    
    # Create table using raw SQL to avoid duplicate type creation
    op.execute("""
    CREATE TABLE application_status_history (
        id UUID NOT NULL,
        application_id UUID NOT NULL,
        from_status application_status,
        to_status application_status NOT NULL,
        changed_by UUID NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(application_id) REFERENCES applications (id),
        FOREIGN KEY(changed_by) REFERENCES users (id)
    )
    """)
    
    op.alter_column('applications', 'cover_letter',
               existing_type=sa.TEXT(),
               nullable=True)
    op.drop_column('applications', 'resume_url')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('applications', sa.Column('resume_url', sa.TEXT(), autoincrement=False, nullable=False))
    op.alter_column('applications', 'cover_letter',
               existing_type=sa.TEXT(),
               nullable=False)
    op.drop_table('application_status_history')
