import httpx, base64, os
from typing import Optional

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api")

async def generateImage(prompt: str) -> str:
    # Placeholder for DALL-E 3 / Stability / Fal.ai
    # In a real scenario, you would call an external API here.
    # For now, we return a high-quality simulated neural art placeholder.
    # To use a real provider, swap this return with an API call.
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"

async def analyzeImage(image_b64: str, question: str = "Describe this image", model: str = "llava") -> str:
    async with httpx.AsyncClient(timeout=60) as c:
        try:
            r = await c.post(f"{OLLAMA_URL}/chat", json={
                "model": model,
                "messages": [{"role":"user","content":question,"images":[image_b64]}],
                "stream": False
            })
            r.raise_for_status()
            return r.json()["message"]["content"]
        except Exception as e:
            return f"Vision Analysis Error: {str(e)}. (Ensure '{model}' is pulled in Ollama)"
