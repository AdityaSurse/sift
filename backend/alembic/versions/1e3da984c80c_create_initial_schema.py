"""create_initial_schema

Revision ID: 1e3da984c80c
Revises: 
Create Date: 2026-10-24 13:31:11.997026

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector.sqlalchemy

# revision identifiers, used by Alembic.
revision: str = '1e3da984c80c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Ensure vector extension is installed on PostgreSQL/Supabase
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    op.create_table('companies',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('slug', sa.String(length=255), nullable=False),
    sa.Column('careers_url', sa.String(length=1024), nullable=False),
    sa.Column('ats_type', sa.Enum('GREENHOUSE', 'LEVER', 'ASHBY', 'WORKABLE', 'SMARTRECRUITERS', 'CUSTOM', 'UNKNOWN', name='ats_type_enum'), nullable=False),
    sa.Column('ats_token', sa.String(length=255), nullable=True),
    sa.Column('industry', sa.String(length=100), nullable=True),
    sa.Column('hq_country', sa.String(length=10), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('last_crawled_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_companies_slug'), 'companies', ['slug'], unique=True)
    op.create_table('crawl_runs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.Enum('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', name='crawl_status_enum'), nullable=False),
    sa.Column('jobs_found', sa.Integer(), nullable=False),
    sa.Column('jobs_new', sa.Integer(), nullable=False),
    sa.Column('jobs_closed', sa.Integer(), nullable=False),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_crawl_runs_company_id'), 'crawl_runs', ['company_id'], unique=False)
    op.create_table('jobs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('external_id', sa.String(length=255), nullable=False),
    sa.Column('title', sa.String(length=512), nullable=False),
    sa.Column('description_text', sa.Text(), nullable=False),
    sa.Column('apply_url', sa.String(length=2048), nullable=False),
    sa.Column('location_raw', sa.String(length=255), nullable=True),
    sa.Column('location_city', sa.String(length=100), nullable=True),
    sa.Column('location_country', sa.String(length=50), nullable=True),
    sa.Column('remote_type', sa.Enum('ONSITE', 'HYBRID', 'REMOTE', name='remote_type_enum'), nullable=True),
    sa.Column('employment_type', sa.Enum('INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT', name='employment_type_enum'), nullable=True),
    sa.Column('duration_months', sa.Integer(), nullable=True),
    sa.Column('experience_level', sa.Enum('INTERN', 'ENTRY', 'MID', 'SENIOR', name='experience_level_enum'), nullable=True),
    sa.Column('role_category', sa.String(length=100), nullable=True),
    sa.Column('skills', postgresql.ARRAY(sa.Text()), nullable=True),
    sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('first_seen_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_open', sa.Boolean(), nullable=False),
    sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=768), nullable=True),
    sa.Column('raw_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('search_vector', postgresql.TSVECTOR(), sa.Computed("to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description_text, ''))", persisted=True), nullable=True),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('company_id', 'external_id', name='uq_jobs_company_external_id')
    )
    op.create_index('idx_jobs_embedding_hnsw', 'jobs', ['embedding'], unique=False, postgresql_using='hnsw', postgresql_with={'m': 16, 'ef_construction': 64}, postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.create_index('idx_jobs_is_open_employment_type', 'jobs', ['is_open', 'employment_type'], unique=False)
    op.create_index('idx_jobs_search_vector_gin', 'jobs', ['search_vector'], unique=False, postgresql_using='gin')
    op.create_index('idx_jobs_skills_gin', 'jobs', ['skills'], unique=False, postgresql_using='gin')
    op.create_index(op.f('ix_jobs_company_id'), 'jobs', ['company_id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_jobs_company_id'), table_name='jobs')
    op.drop_index('idx_jobs_skills_gin', table_name='jobs', postgresql_using='gin')
    op.drop_index('idx_jobs_search_vector_gin', table_name='jobs', postgresql_using='gin')
    op.drop_index('idx_jobs_is_open_employment_type', table_name='jobs')
    op.drop_index('idx_jobs_embedding_hnsw', table_name='jobs', postgresql_using='hnsw', postgresql_with={'m': 16, 'ef_construction': 64}, postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.drop_table('jobs')
    op.drop_index(op.f('ix_crawl_runs_company_id'), table_name='crawl_runs')
    op.drop_table('crawl_runs')
    op.drop_index(op.f('ix_companies_slug'), table_name='companies')
    op.drop_table('companies')
    # ### end Alembic commands ###
