from pydantic import BaseModel

class Student(BaseModel):
    name: str
    gender: str
    branch: str
    year: int
    sleepTime: str
    cleanliness: str
    foodHabit: str
    studyPreference: str
    roomType: str
    hobbies: list[str] = []