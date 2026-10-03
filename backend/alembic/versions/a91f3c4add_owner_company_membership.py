"""add owner membership role and backfill company owners

Revision ID: a91f3c4add
Revises: c50bf423120b
Create Date: 2026-10-04
"""

from uuid import uuid4

from alembic import op
import sqlalchemy as sa

revision = "a91f3c4add"
down_revision = "c50bf423120b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL requires the new enum value to be committed before it is used.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE membership_role ADD VALUE IF NOT EXISTS 'OWNER'")

    connection = op.get_bind()
    connection.execute(sa.text("""
        UPDATE company_memberships AS membership
        SET role = 'OWNER', updated_at = CURRENT_TIMESTAMP
        FROM companies AS company
        WHERE membership.company_id = company.id
          AND membership.user_id = company.owner_id
          AND membership.is_active IS TRUE
    """))

    missing_owners = connection.execute(sa.text("""
        SELECT company.id AS company_id, company.owner_id
        FROM companies AS company
        WHERE NOT EXISTS (
            SELECT 1
            FROM company_memberships AS membership
            WHERE membership.company_id = company.id
              AND membership.user_id = company.owner_id
        )
    """)).mappings()
    for row in missing_owners:
        connection.execute(sa.text("""
            INSERT INTO company_memberships
                (id, company_id, user_id, role, is_active, created_at, updated_at)
            VALUES
                (:id, :company_id, :user_id, 'OWNER', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """), {
            "id": uuid4(),
            "company_id": row["company_id"],
            "user_id": row["owner_id"],
        })


def downgrade() -> None:
    op.execute("UPDATE company_memberships SET role = 'HR' WHERE role = 'OWNER'")
    op.execute("CREATE TYPE membership_role_without_owner AS ENUM ('HR', 'RECRUITER')")
    op.execute("""
        ALTER TABLE company_memberships
        ALTER COLUMN role TYPE membership_role_without_owner
        USING role::text::membership_role_without_owner
    """)
    op.execute("DROP TYPE membership_role")
    op.execute("ALTER TYPE membership_role_without_owner RENAME TO membership_role")
