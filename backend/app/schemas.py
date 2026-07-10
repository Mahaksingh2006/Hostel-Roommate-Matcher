from pydantic import BaseModel

class Student(BaseModel):
    name: str
    gender: str
    department: str
    year: int
    study_time: str
    food_preference: str
    sleep_time: str
    cleanliness: str
    personality: str

class StudentResponse(Student):
    id: int

    class Config:
        from_attributes = True