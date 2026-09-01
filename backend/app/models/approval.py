from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    authority = Column(String, nullable=False)

    category = Column(String, nullable=False)

    description = Column(Text, nullable=True)

    reason = Column(Text, nullable=True)

    priority = Column(String, nullable=False, default="Medium")

    status = Column(
        String,
        nullable=False,
        default="Required"
    )