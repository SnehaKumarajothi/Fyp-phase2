from argostranslate import translate

def translate_to_tamil(text:str)->str:
    return translate.translate(text, "en", "ta")