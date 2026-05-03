from fastapi import APIRouter
from pydantic import BaseModel
from .service import generateImage, analyzeImage

router = APIRouter(prefix="/api/image")

class GenReq(BaseModel):
    prompt: str

class AnalyzeReq(BaseModel):
    image_b64: str
    question: str = "Describe this image"
    model: str = "llava"

@router.post("/generate")
async def generate(body: GenReq):
    return {"image": await generateImage(body.prompt)}

@router.post("/analyze")
async def analyze(body: AnalyzeReq):
    return {"result": await analyzeImage(body.image_b64, body.question, body.model)}
