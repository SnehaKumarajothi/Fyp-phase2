from gtts import gTTS
import uuid
import os
AUDIO_DIR="scheme_explanation"
os.makedirs(AUDIO_DIR,exist_ok=True)

def text_to_speech(text:str,language:str)->str:
    lang_code="ta" if language=="ta" else "en"
    filename=f"{uuid.uuid4()}.mp3"
    path=os.path.join(AUDIO_DIR,filename)
    tts=gTTS(text=text,lang=lang_code)
    tts.save(path)
    return filename