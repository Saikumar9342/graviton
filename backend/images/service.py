import httpx, os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api")

async def generateImage(prompt: str, model: str, api_key: str, api_base_url: str) -> str:
    base = api_base_url.rstrip('/')
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    # Fireworks AI — workflow endpoint, returns binary image
    if "fireworks.ai" in base:
        url = f"https://api.fireworks.ai/inference/v1/workflows/{model}/text_to_image"
        async with httpx.AsyncClient(timeout=120.0) as c:
            r = await c.post(
                url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "Accept": "image/jpeg",
                },
                json={"prompt": prompt, "aspect_ratio": "16:9"},
            )
            if r.status_code == 422:
                raise Exception(f"Fireworks validation error: {r.text[:300]}")
            if r.status_code == 404:
                raise Exception(f"Model '{model}' not found. Check the Model ID.")
            r.raise_for_status()
            import base64 as b64mod
            return f"data:image/jpeg;base64,{b64mod.b64encode(r.content).decode()}"

    # Together AI — uses /images/generations, returns URL
    if "together.xyz" in base or "together.ai" in base:
        async with httpx.AsyncClient(timeout=120.0) as c:
            r = await c.post(f"{base}/images/generations", headers=headers,
                json={"model": model, "prompt": prompt, "n": 1, "width": 1024, "height": 1024})
            if r.status_code == 404:
                raise Exception(f"Model '{model}' not found on the provider's server. Check the Model ID.")
            r.raise_for_status()
            data = r.json()
            images = data.get("data") or []
            if not images:
                raise Exception(f"No image returned: {data}")
            img = images[0]
            return img.get("url") or f"data:image/png;base64,{img.get('b64_json','')}"

    # Generic OpenAI-compatible fallback
    async with httpx.AsyncClient(timeout=120.0) as c:
        r = await c.post(f"{base}/images/generations", headers=headers,
            json={"model": model, "prompt": prompt, "n": 1, "size": "1024x1024"})
        if r.status_code == 404:
            raise Exception(f"Model '{model}' not found on the provider's server. Check the Model ID.")
        r.raise_for_status()
        data = r.json()
        images = data.get("data") or []
        if not images:
            raise Exception(f"No image returned: {data}")
        img = images[0]
        return img.get("url") or f"data:image/png;base64,{img.get('b64_json','')}"

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
