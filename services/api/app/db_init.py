import logging
from app.auth_models import User
from app.database import Base, SessionLocal, engine
from app.security import hash_password, utc_now

logger = logging.getLogger("procureai.db")


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            logger.info("Seeding initial administrator and role accounts into ProcureAI database...")

            seed_users = [
                User(
                    username="admin",
                    email="admin@procureai.internal",
                    password_hash=hash_password("AdminPassword123!"),
                    full_name="System Administrator",
                    role="Administrator",
                    account_status="ACTIVE",
                    created_at=utc_now(),
                    updated_at=utc_now(),
                ),
                User(
                    username="proc_manager",
                    email="manager@procureai.internal",
                    password_hash=hash_password("Manager123!"),
                    full_name="Sarah Jenkins (Procurement Manager)",
                    role="Procurement Manager",
                    account_status="ACTIVE",
                    created_at=utc_now(),
                    updated_at=utc_now(),
                ),
                User(
                    username="buyer_john",
                    email="buyer@procureai.internal",
                    password_hash=hash_password("Buyer123!"),
                    full_name="John Doe (Senior Buyer)",
                    role="Buyer",
                    account_status="ACTIVE",
                    created_at=utc_now(),
                    updated_at=utc_now(),
                ),
                User(
                    username="finance_amy",
                    email="finance@procureai.internal",
                    password_hash=hash_password("Finance123!"),
                    full_name="Amy Vance (Finance Reviewer)",
                    role="Finance Reviewer",
                    account_status="ACTIVE",
                    created_at=utc_now(),
                    updated_at=utc_now(),
                ),
            ]
            db.add_all(seed_users)
            db.commit()
            logger.info("ProcureAI initial accounts seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
