from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)
    gender = Column(String)
    branch = Column(String)
    year = Column(Integer)

    sleepTime = Column(String)
    cleanliness = Column(String)
    foodHabit = Column(String)
    studyPreference = Column(String)

    roomType = Column(String)
    hobbies = Column(String)