from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.database_url)

with engine.connect() as conn:
    result = conn.execute(
        text("""
            SELECT
                column_name,
                data_type,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'standards'
              AND character_maximum_length IS NOT NULL
            ORDER BY ordinal_position
        """)
    )

    for row in result:
        print(row)