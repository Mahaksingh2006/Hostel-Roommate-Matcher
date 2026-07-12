from fastapi import FastAPI
from sqlalchemy.orm import Session

from app.schemas import Student
from app.database import SessionLocal
from app.models import Student as StudentModel

app = FastAPI()


@app.get("/")
def home():
    return {"message": "Welcome to Hostel Roommate Matcher API!"}


@app.post("/students")
def add_student(student: Student):

    db: Session = SessionLocal()

    new_student = StudentModel(
        name=student.name,
        gender=student.gender,
        branch=student.branch,
        year=student.year,
        sleepTime=student.sleepTime,
        cleanliness=student.cleanliness,
        foodHabit=student.foodHabit,
        studyPreference=student.studyPreference,
        roomType=student.roomType,
        hobbies=",".join(student.hobbies)
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
        return {"error": "Student not found"}

    best_match = None
    best_score = -1

    for s in students:

        if s.id == target.id:
            continue

        score = 0

        if s.branch == target.branch:
            score += 2

        if s.year == target.year:
            score += 2

        if s.studyPreference == target.studyPreference:
            score += 1

        if s.foodHabit == target.foodHabit:
            score += 1

        if s.sleepTime == target.sleepTime:
            score += 1

        if s.cleanliness == target.cleanliness:
            score += 1

        if s.roomType == target.roomType:
            score += 1

        if score > best_score:
            best_score = score
            best_match = s

    db.close()

    if best_match is None:
        return {"message": "No roommate found"}

    return {
        "student_id": target.id,
        "student": target.name,
        "best_match_id": best_match.id,
        "best_match": best_match.name,
        "compatibility_score": best_score,
        "compatibility_percentage": round((best_score / 9) * 100, 2)
    }
@app.delete("/students/{student_id}")
def delete_student(student_id: int):

    db = SessionLocal()

    student = db.query(StudentModel).filter(
        StudentModel.id == student_id
    ).first()

    if not student:
        db.close()
        return {"error": "Student not found"}

    db.delete(student)
    db.commit()
    db.close()

    return {"message": "Student deleted successfully"}
@app.put("/students/{student_id}")
def update_student(student_id: int, student: Student):

    db = SessionLocal()

    existing = db.query(StudentModel).filter(
        StudentModel.id == student_id
    ).first()

    if not existing:
        db.close()
        return {"error": "Student not found"}

    existing.name = student.name
    existing.gender = student.gender
    existing.branch = student.branch
    existing.year = student.year
    existing.sleepTime = student.sleepTime
    existing.cleanliness = student.cleanliness
    existing.foodHabit = student.foodHabit
    existing.studyPreference = student.studyPreference
    existing.roomType = student.roomType
    existing.hobbies = ",".join(student.hobbies)

    db.commit()
    db.close()

    return {"message": "Student updated successfully"}