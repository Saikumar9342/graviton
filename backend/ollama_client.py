import httpx
import json
import os
from typing import List, Dict, Any, AsyncGenerator

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api")

async def chat_with_ollama(model: str, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
    async with httpx.AsyncClient(timeout=None) as client:
        payload = {
            "model": model,
            "messages": messages,
            "stream": True
        }
        
        async with client.stream("POST", f"{OLLAMA_URL}/chat", json=payload) as response:
            if response.status_code != 200:
                error_detail = await response.aread()
                raise Exception(f"Ollama error: {error_detail.decode()}")
                
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    if "message" in data and "content" in data["message"]:
                        yield data["message"]["content"]
                    if data.get("done"):
                        break
                except json.JSONDecodeError:
                    continue

async def get_ollama_models() -> List[str]:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{OLLAMA_URL}/tags")
        if response.status_code == 200:
            data = response.json()
            return [m["name"] for m in data.get("models", [])]
        return []
