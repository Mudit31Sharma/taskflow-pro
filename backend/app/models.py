from datetime import date, datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from .database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    workflow_status = Column(String(50), nullable=False, default="Backlog")
    position = Column(Integer, nullable=False, default=0)
    start_date = Column(Date, nullable=False, default=date.today)
    duration = Column(Integer, nullable=False, default=1)  # Duration in days (>= 1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    # Outgoing dependencies where this task is precursor
    downstream_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.precursor_id",
        back_populates="precursor",
        cascade="all, delete-orphan",
    )
    # Incoming dependencies where this task is dependent
    upstream_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.dependent_id",
        back_populates="dependent",
        cascade="all, delete-orphan",
    )


class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(Integer, primary_key=True, index=True)
    precursor_id = Column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    dependent_id = Column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )

    precursor = relationship(
        "Task", foreign_keys=[precursor_id], back_populates="downstream_dependencies"
    )
    dependent = relationship(
        "Task", foreign_keys=[dependent_id], back_populates="upstream_dependencies"
    )

    __table_args__ = (
        UniqueConstraint("precursor_id", "dependent_id", name="uq_precursor_dependent"),
    )
