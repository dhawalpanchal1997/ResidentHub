"""Add user_id foreign key to committee_members table

Revision ID: 002_add_user_id_to_committee_members
Revises: 001_add_vector_and_indexes
Create Date: 2026-08-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_user_id_to_committee_members'
down_revision: Union[str, None] = '001_add_vector_and_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add user_id column to committee_members
    op.add_column('committee_members', sa.Column('user_id', sa.String(36), nullable=True))
    
    # Add foreign key constraint (PostgreSQL only)
    conn = op.get_bind()
    if conn.dialect.name == 'postgresql':
        op.create_foreign_key(
            'fk_committee_members_user_id',
            'committee_members',
            'users',
            ['user_id'],
            ['id']
        )
    else:
        # For SQLite, we add the column but FK is not enforced
        pass
    
    # Create index for better query performance
    op.create_index('ix_committee_members_user_id', 'committee_members', ['user_id'])


def downgrade() -> None:
    from alembic import op
    conn = op.get_bind()
    
    # Drop foreign key constraint (PostgreSQL only)
    if conn.dialect.name == 'postgresql':
        op.drop_constraint('fk_committee_members_user_id', 'committee_members', type_='foreignkey')
    
    # Drop index
    op.drop_index('ix_committee_members_user_id', 'committee_members')
    
    # Drop column
    op.drop_column('committee_members', 'user_id')