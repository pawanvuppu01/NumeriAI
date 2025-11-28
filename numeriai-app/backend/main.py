from fastapi import FastAPI
from pydantic import BaseModel
from inference import generate_answer

app = FastAPI()

class Query(BaseModel):
    prompt: str

@app.post("/predict")
def predict(input: Query):
    return {"result": generate_answer(input.prompt)}
