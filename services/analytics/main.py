from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Advanced Analytics Service")

class TestResult(BaseModel):
    student_id: int
    score: float
    difficulty: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Advanced Analytics Service (FastAPI)"}

@app.post("/analyze")
def analyze_results(results: List[TestResult]):
    total_score = sum(r.score for r in results)
    avg_score = total_score / len(results) if results else 0
    return {
        "average_score": avg_score,
        "total_tests": len(results),
        "status": "Calculated using FastAPI"
    }
