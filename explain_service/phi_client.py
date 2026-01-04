import requests
from pathlib import Path
OLLAMA_URL="http://localhost:11434/api/generate"
MODEL_NAME="phi4-mini:latest"
PROMPT_PATH=Path(__file__).parent / "prompts" / "explain.txt"

def generate_explanation(topic: str, language: str)->str:
    template=PROMPT_PATH.read_text(encoding="utf-8")
    lang_text="Tamil" if language =="ta" else "English"
    prompt=template.format(
        topic=topic,
        language=lang_text
    )
    payload={
        "model":MODEL_NAME,
        "prompt":prompt,
        "stream":False,
    }
    response=requests.post(OLLAMA_URL,json=payload)
    response.raise_for_status()
    return response.json()['response'].strip()