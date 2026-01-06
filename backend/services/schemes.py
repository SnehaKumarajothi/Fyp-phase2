from pathlib import Path 
SCHEME_DIR=Path("schemes")
def load_scheme_text(scheme_id:str)->str:
    file_path=SCHEME_DIR/f"{scheme_id}.txt"
    if not file_path.exists():
        raise FileNotFoundError(f"Scheme text not found: {scheme_id}")
    return file_path.read_text(encoding="utf-8")
    '''if language == "ta":
        text_ta=extract_section(text, "TA")
        return text_ta[:1200]
    else:
        text_en=extract_section(text, "EN")
        return text_en[:1200]

def extract_section(text: str, section: str) -> str:
    start_tag = f"[{section}]"
    sections = text.split(start_tag)
    if len(sections) < 2:
        raise ValueError(f"Section [{section}] not found")

    content = sections[1]
    content = content.split("[", 1)[0]
    return content.strip()'''