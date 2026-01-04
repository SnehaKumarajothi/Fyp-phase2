from gtts import gTTS
import uuid
from pathlib import Path
AUDIO_DIR= Path(__file__).parent / "audio"
AUDIO_DIR.mkdir(exist_ok=True)
def text_to_speech(text:str,language:str)->str:
    lang_code="ta" if language=="ta" else "en"
    filename=f"{uuid.uuid4()}.mp3"
    filepath=AUDIO_DIR / filename
    tts=gTTS(text=text,lang=lang_code)
    tts.save(filepath)
    return filename