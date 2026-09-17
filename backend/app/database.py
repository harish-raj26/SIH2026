from pathlib import Path
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parents[1]
DATABASE_URL = f"sqlite:///{BASE_DIR / 'bizclear.db'}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_db():
    """Ensure newly added tables and columns exist in SQLite database without losing data."""
    # Ensure all declared tables exist
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    columns_to_ensure = {
        "businesses": [
            ("state", "VARCHAR DEFAULT 'Tamil Nadu'"),
            ("district", "VARCHAR"),
            ("sub_sector", "VARCHAR"),
            ("business_activity", "VARCHAR"),
            ("products", "TEXT"),
            ("factory", "BOOLEAN DEFAULT 0"),
            ("production_capacity", "VARCHAR"),
            ("land_type", "VARCHAR"),
            ("hazardous_materials", "BOOLEAN DEFAULT 0"),
            ("hazardous_details", "VARCHAR"),
            ("water_usage", "VARCHAR"),
            ("waste_generation", "VARCHAR"),
            ("power_requirement", "VARCHAR"),
            ("import_export", "BOOLEAN DEFAULT 0"),
            ("boiler", "BOOLEAN DEFAULT 0"),
            ("boiler_details", "VARCHAR"),
        ],
        "approvals": [
            ("approval_name", "VARCHAR"),
            ("jurisdiction", "VARCHAR DEFAULT 'State'"),
            ("state", "VARCHAR DEFAULT 'Tamil Nadu'"),
            ("district", "VARCHAR DEFAULT 'All'"),
            ("sector", "VARCHAR DEFAULT 'All'"),
            ("sub_sector", "VARCHAR DEFAULT 'All'"),
            ("level", "VARCHAR DEFAULT 'State'"),
            ("stage", "VARCHAR DEFAULT 'Pre-Operation'"),
            ("mandatory", "BOOLEAN DEFAULT 1"),
            ("conditions", "TEXT"),
            ("documents_required", "TEXT"),
            ("fees", "VARCHAR"),
            ("validity", "VARCHAR"),
            ("timeline", "VARCHAR"),
            ("application_url", "VARCHAR"),
            ("source_url", "VARCHAR"),
            ("source_type", "VARCHAR DEFAULT 'Official Government Source'"),
            ("dependencies", "TEXT"),
            ("last_verified", "VARCHAR"),
            ("active", "BOOLEAN DEFAULT 1"),
        ],
        "approval_requirements": [
            ("approval_status", "VARCHAR DEFAULT 'REQUIRED'"),
            ("jurisdiction", "VARCHAR DEFAULT 'State'"),
            ("stage", "VARCHAR DEFAULT 'Pre-Operation'"),
            ("documents_required", "TEXT"),
            ("fees", "VARCHAR"),
            ("validity", "VARCHAR"),
            ("timeline", "VARCHAR"),
            ("source_url", "VARCHAR"),
            ("source_type", "VARCHAR DEFAULT 'Official Government Source'"),
            ("regulatory_evidence", "TEXT"),
            ("dependencies", "TEXT"),
            ("condition_trigger", "TEXT"),
            ("last_verified", "VARCHAR"),
        ],
        "applications": [
            ("government_service_code", "VARCHAR"),
            ("government_app_id", "VARCHAR"),
            ("government_reference_no", "VARCHAR"),
            ("submission_mode", "VARCHAR DEFAULT 'PORTAL_ASSISTED'"),
            ("normalized_status", "VARCHAR DEFAULT 'DRAFT'"),
            ("government_status", "VARCHAR"),
            ("submission_response_raw", "TEXT"),
            ("portal_submission_url", "VARCHAR"),
            ("last_synced_at", "DATETIME"),
        ],
        "application_fields": [
            ("field_key", "VARCHAR"),
            ("source", "VARCHAR DEFAULT 'user_input'"),
            ("source_field_path", "VARCHAR"),
            ("validation_error", "TEXT"),
        ],
        "application_documents": [
            ("file_hash", "VARCHAR"),
            ("file_size", "INTEGER"),
            ("expiry_date", "VARCHAR"),
            ("verified_at", "DATETIME"),
        ],
    }

    with engine.connect() as conn:
        for table_name, cols in columns_to_ensure.items():
            if table_name in existing_tables:
                existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
                for col_name, col_type in cols:
                    if col_name not in existing_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                        except Exception as e:
                            print(f"Migration note for {table_name}.{col_name}: {e}")

