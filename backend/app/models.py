from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    gender = Column(String(20))
    department = Column(String(50))
    year = Column(Integer)
    study_time = Column(String(50))
    food_preference = Column(String(50))
    sleep_time = Column(String(50))
    cleanliness = Column(String(50))
    personality = Column(String(50))