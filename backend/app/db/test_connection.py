from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import engine

try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        print("✅ Database connected successfully!")
except SQLAlchemyError as e:
    print("❌ Connection failed")
    print(e)
