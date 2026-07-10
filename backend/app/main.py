from fastapi import FastAPI
from sqlalchemy.orm import Session

from app.schemas import Student
from app.database import SessionLocal
from app.models import Student as StudentModel

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Welcome to Hostel Roommate Matcher API!"
    }


@app.post("/students")
def add_student(student: Student):

    db: Session = SessionLocal()

    new_student = StudentModel(
        name=student.name,
        gender=student.gender,
        department=student.department,
        year=student.year,
        study_time=student.study_time,
        food_preference=student.food_preference,
        sleep_time=student.sleep_time,
        cleanliness=student.cleanliness,
        personality=student.personality
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    student_id = new_student.id

    db.close()

    return {
        "message": "Student added successfully",
        "id": student_id
    }


@app.get("/students")
def get_students():

    db: Session = SessionLocal()

    students = db.query(StudentModel).all()

    db.close()

    return students


@app.get("/match/{student_id}")
def match_student(student_id: int):

    db: Session = SessionLocal()

    students = db.query(StudentModel).all()

    target = None

    for s in students:
        if s.id == student_id:
            target = s
            break

    if target is None:
        db.close()
        return {
            "error": "Student not found"
        }

    best_match = None
    best_score = -1

    for s in students:

        if s.id == target.id:
            continue

        score = 0

        if s.department == target.department:
            score += 2

        if s.year == target.year:
            score += 2

        if s.study_time == target.study_time:
            score += 1

        if s.food_preference == target.food_preference:
            score += 1

        if s.sleep_time == target.sleep_time:
            score += 1

        if s.cleanliness == target.cleanliness:
            score += 1

        if s.personality == target.personality:
            score += 1

        if score > best_score:
            best_score = score
            best_match = s

    db.close()

    if best_match is None:
        return {
            "message": "No roommate found"
        }

    return {
        "student_id": target.id,
        "student": target.name,
        "best_match_id": best_match.id,
        "best_match": best_match.name,
        "compatibility_score": best_score,
        "compatibility_percentage": round((best_score / 9) * 100, 2)
    }