import requests
from pathlib import Path
PROMPT_TEMPLATE=Path("prompts/scheme_explain.txt").read_text()
def explain_scheme(context_text:str)->str:
    prompt=PROMPT_TEMPLATE.replace("{{context}}",context_text)
    response=requests.post("http://localhost:11434/api/generate",json={
        "model":"phi4-mini:latest",
        "prompt":prompt,
        "stream":False,
    },
    timeout=60
    )
    return response.json()['response']