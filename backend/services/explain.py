import requests
from pathlib import Path
PROMPT_PATH=Path(__file__).parent.parent / "prompts" / "scheme_explain.txt"
PROMPT_TEMPLATE=PROMPT_PATH.read_text(encoding="utf-8")
def explain_scheme(context_text:str,language:str)->str:
    lang_text="Tamil" if language =="ta" else "English"
    prompt = PROMPT_TEMPLATE.replace("{{context}}", context_text).replace("{{language}}", lang_text)

    payload = {
        "model": "qwen2.5:1.5b",
        "prompt": prompt,
        "stream": False,
    }

    response = requests.post(
        "http://localhost:11434/api/generate",
        json=payload,
        timeout=300
    )
    response.raise_for_status()
    return response.json()["response"].strip()
    
    '''prompt=PROMPT_TEMPLATE.replace("{{context}}",context_text)
    response=requests.post("http://localhost:11434/api/generate",json={
        "model":"phi4-mini:latest",
        "prompt":prompt,
        "stream":False,
    },
    timeout=60
    )
    return response.json()['response']
'''