"""whispermod.py

This is the cleaned, stable Flask voice agent - a copy of
whispermod_clean.py placed at the primary entrypoint path so
developers who run `python src/model/whispermod.py` get the
stable implementation.

Minor differences from the original messy file:
- Defensive imports for Whisper / Ollama / gTTS
- Returns `next_index` numeric field in start_agent and agent_step responses
- Simple in-memory session store (SESSIONS)
"""

import os
import json
import uuid
import base64
import tempfile
import asyncio
import re
from typing import Dict, Any, Optional, List

from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    import whisper
except Exception:
    whisper = None

try:
    from gtts import gTTS
except Exception:
    gTTS = None

try:
    from langchain_core.messages import SystemMessage, HumanMessage
    from langchain_ollama import ChatOllama
except Exception:
    SystemMessage = None
    HumanMessage = None
    ChatOllama = None

schemes: List[Dict[str, Any]] = [
    {
        "id": "tractor-loan",
        "name": "Tractor Loan Scheme",
        "nameTa": "டிராக்டர் கடன் திட்டம்",
        "description": "Government-backed tractor loan for small and medium farmers.",
        "descriptionTa": "சிறு மற்றும் நடுத்தர விவசாயிகளுக்கான அரசாங்க ஆதரவு டிராக்டர் கடன் திட்டம்.",
        "eligibility": ["Farmer", "Age 18-60", "Own Land"],
        "maxAmount": "₹5,00,000",
        "interestRate": "7.5% p.a.",
        "keywords": ["tractor", "farming", "agriculture", "விவசாயம்"],
        "formKey": "tractor-loan",
        "questions": [
            {"key": "land_size", "label": "நீங்கள் வைத்துள்ள நிலத்தின் அளவு என்ன?", "labelEn": "What is your land size?"},
            {"key": "tractor_model", "label": "டிராக்டர் மாடல் என்ன?", "labelEn": "What is the tractor model?"},
            {"key": "loan_amount", "label": "எவ்வளவு தொகை கடனாக வேண்டும்?", "labelEn": "How much loan amount do you need?"},
        ],
    },
    {
        "id": "kcc-farmer",
        "name": "KCC Farmer Finance Scheme",
        "nameTa": "விவசாயி நிதி திட்டம் (KCC)",
        "description": "Financial support for farmers under the Kisan Credit Card program.",
        "descriptionTa": "கிசான் கடன் அட்டையின் கீழ் விவசாயிகளுக்கான நிதி உதவி.",
        "eligibility": ["Age: 18-60", "Farmer", "Cultivator"],
        "maxAmount": "₹3,00,000",
        "interestRate": "4.0% p.a.",
        "keywords": ["kcc", "farmer finance", "விவசாயி", "credit card", "agriculture", "credit", "fertilizers"],
        "formKey": "kcc-farmer",
        "questions": [
            {"key": "farmSize", "label": "பண்ணையின் அளவு என்ன?", "labelEn": "What is your farm size?"},
            {"key": "cropType", "label": "நீங்கள் எந்த பயிரை வளர்க்கிறீர்கள்?", "labelEn": "What type of crop do you grow?"},
            {"key": "annualIncome", "label": "விவசாயத்திலிருந்து ஆண்டு வருமானம் என்ன?", "labelEn": "What is your annual income from farming?"},
            {"key": "loanAmount", "label": "தேவையான கடன் தொகை எவ்வளவு?", "labelEn": "What loan amount do you require?"},
        ],
    },
]


def get_matching_schemes(user_data: Dict[str, Any], situation_text: str) -> List[Dict[str, Any]]:
    text = (situation_text or "").lower().strip()
    try:
        age = int(user_data.get("age", 0) or 0)
    except (ValueError, TypeError):
        age = 0
    community = (user_data.get("community", "") or "").lower()

    matched: List[Dict[str, Any]] = []
    for scheme in schemes:
        keyword_match = any((kw or "").lower().replace("-", " ").replace("_", " ") in text for kw in scheme.get("keywords", []))
        age_match = 18 <= age <= 65
        eligibility_text = " ".join(scheme.get("eligibility", [])).lower()
        requires_disadvantaged = any(w in eligibility_text for w in ("sc", "st", "bc", "mbc", "oc", "obc"))
        community_match = True
        if requires_disadvantaged:
            community_match = bool(re.search(r"\b(sc|st|bc|mbc|oc|obc)\b", community, re.I))
        needs_kcc_keywords = ["fertilizer", "harvest", "crop", "seeds", "விவசாயம்"]
        is_kcc_relevant = any(kw in text for kw in needs_kcc_keywords) and scheme.get("id") == "kcc-farmer"
        if (keyword_match or is_kcc_relevant) and age_match and community_match:
            matched.append(scheme)
    return matched


OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "phi4-mini:latest")
WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "small")

SYSTEM_PROMPT = """
You are a structured Tamil voice intake assistant. Your ONLY job:
1) Extract a single short value requested by instruction from the user's reply.
2) If value cannot be extracted, return 'Not Found'.
3) Respond concisely (single value).
"""

FIELDS = [
    {"key": "name", "question_ta": "உங்கள் பெயர் என்ன?", "question_en": "What is your name?"},
    {"key": "age", "question_ta": "உங்கள் வயது என்ன?", "question_en": "What is your age?"},
    {"key": "address", "question_ta": "உங்கள் முகவரி என்ன?", "question_en": "What is your address?"},
    {"key": "earning", "question_ta": "உங்கள் ஆண்டு வருமானம் என்ன?", "question_en": "What is your yearly earning?"},
    {"key": "community", "question_ta": "உங்கள் சமூகத்தை (சாதி) குறிப்பிடுங்கள்.", "question_en": "What is your community?"},
    {"key": "situation", "question_ta": "இப்போது உங்கள் தற்போதைய நிதி நிலையை விளக்குங்கள்.", "question_en": "Describe your current financial situation."},
]

whisper_model = None
if whisper is not None:
    try:
        print(f"Loading Whisper model ({WHISPER_MODEL_SIZE})...")
        whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
        print("Whisper loaded successfully.")
    except Exception as e:
        print(f"Error loading Whisper: {e}. Continue without ASR for now.")

llm = None
if ChatOllama is not None:
    try:
        llm = ChatOllama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL, temperature=0)
        print("Connected to Ollama model.")
    except Exception as e:
        print(f"OLLAMA not available: {e}")

app = Flask(__name__)
CORS(app)
SESSIONS: Dict[str, Dict[str, Any]] = {}


def tts_to_data_uri(text: str, lang: str = "ta") -> str:
    if not text or gTTS is None:
        return ""
    try:
        fd, path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)
        tts = gTTS(text=text, lang=lang)
        tts.save(path)
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        os.remove(path)
        return f"data:audio/mpeg;base64,{b64}"
    except Exception as e:
        print(f"[TTS ERROR] {e}")
        return ""


def transcribe_file_translate_to_english_from_path(path: str) -> str:
    if whisper_model is None:
        return ""
    try:
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            print(f"[TRANSCRIBE] file missing or empty: {path}")
            return ""
        result = whisper_model.transcribe(path, task="translate", language="ta")
        return (result.get("text") or "").strip()
    except Exception as e:
        print("[WHISPER ERROR]", repr(e))
        return ""


async def extract_field_with_llm(instruction: str, user_text: str) -> str:
    if llm is None or SystemMessage is None:
        return "Not Found"
    try:
        messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=f"{instruction}\n\nUser reply:\n{user_text}" )]
        resp = await llm.ainvoke(messages)
        return (resp.content or "").strip()
    except Exception as e:
        print("[LLM ERROR]", e)
        return "Not Found"


def make_new_session(user_id: Optional[str] = None, language: str = "ta") -> Dict[str, Any]:
    if not user_id:
        user_id = str(uuid.uuid4())
    state = {"user_id": user_id, "language": language, "next_index": 0, "collected": {}}
    SESSIONS[user_id] = state
    return state


@app.route("/start_agent", methods=["POST"])
def start_agent():
    payload = request.get_json() or {}
    user_id = payload.get("user_id")
    language = payload.get("language", "ta")
    state = SESSIONS.get(user_id) or make_new_session(user_id=user_id, language=language)
    next_index = state["next_index"]
    field = FIELDS[next_index]
    agent_text = "வணக்கம்! சில அடிப்படை விவரங்களை கேட்கிறேன். தயார் தானே?" if language == "ta" else "Hello — I will ask some basic details. Ready?"
    prompt = f"{agent_text} {field['question_ta'] if language == 'ta' else field['question_en']}"
    audio_url = tts_to_data_uri(prompt, lang="ta" if language == "ta" else "en")
    return jsonify({
        "user_id": state["user_id"],
        "agent_text": prompt,
        "audio_url": audio_url,
        "next_index": next_index,
        "next_field_key": field["key"],
        "next_field_label": field["question_ta"] if language == "ta" else field["question_en"],
    })


@app.route("/agent_step", methods=["POST"])
def agent_step():
    language = request.form.get("language", "ta")
    user_id = request.form.get("user_id")
    state = SESSIONS.get(user_id)
    if not state or "file" not in request.files:
        return jsonify({"error": "Missing user_id or audio file. Please restart session."}), 400
    audio_file = request.files["file"]
    fd, tmp_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    try:
        audio_file.save(tmp_path)
        transcript_en = transcribe_file_translate_to_english_from_path(tmp_path)
        print(f"[TRANSCRIPT-EN] {transcript_en}")

        idx = state["next_index"]
        if idx >= len(FIELDS):
            return jsonify({"done": True, "final_state": state["collected"]})
        current_field = FIELDS[idx]
        field_key = current_field["key"]

        extracted = "Not Found"
        if transcript_en:
            instruction = f"Extract the {field_key} value from the user's reply. If you cannot find it, return exactly: Not Found"
            try:
                extracted = asyncio.run(extract_field_with_llm(instruction, transcript_en))
            except Exception:
                extracted = "Not Found"

        extracted = (extracted or "").strip() or "Not Found"
        stored_value = extracted if extracted != "Not Found" else transcript_en
        state["collected"][field_key] = stored_value
        state["next_index"] = idx + 1
        SESSIONS[state["user_id"]] = state

        done = state["next_index"] >= len(FIELDS)
        if not done:
            next_field = FIELDS[state["next_index"]]
            agent_text = next_field["question_ta"] if language == "ta" else next_field["question_en"]
        else:
            agent_text = "அனைத்து விவரங்களும் சேகரிக்கப்பட்டது. நன்றி! விவரங்கள் தயாரிப்பு முகவருக்கு அனுப்பப்பட்டது." if language == "ta" else "All details collected. Thank you! Data sent to the Product Agent."

        audio_data_uri = tts_to_data_uri(agent_text, lang="ta" if language == "ta" else "en")

        response = {
            "user_id": state["user_id"],
            "field_key": field_key,
            "user_transcript_en": transcript_en,
            "value_extracted": stored_value,
            "agent_text": agent_text,
            "audio_url": audio_data_uri,
            "done": done,
            "next_index": state["next_index"],
        }
        if done:
            response["final_state"] = state["collected"]
        return jsonify(response)
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception as e:
            print(f"[CLEANUP WARNING] {e}")


@app.route("/submit_and_match", methods=["POST"])
def submit_and_match():
    payload = request.get_json() or {}
    collected_data = payload.get("collected_data", {})
    user_id = payload.get("user_id")
    json_rpc_payload = {
        "jsonrpc": "2.0",
        "method": "scheme_recommendation",
        "id": user_id,
        "params": {
            "user_id": user_id,
            "user_metadata": {
                "name": collected_data.get("name"),
                "age": collected_data.get("age"),
                "community": collected_data.get("community"),
                "yearly_earning_proxy": collected_data.get("earning"),
            },
            "situational_context": collected_data.get("situation"),
        },
    }
    situation_gist = collected_data.get("situation", "")
    age = collected_data.get("age", 0)
    community = collected_data.get("community", "")
    matching_schemes = get_matching_schemes({"age": age, "community": community}, situation_gist)
    if not matching_schemes:
        return jsonify({"status": "error", "message": "No schemes matched the user's profile and situation.", "json_rpc_sent": json_rpc_payload}), 404
    return jsonify({"status": "success", "message": "Schemes matched and vetted.", "schemes": matching_schemes, "json_rpc_sent": json_rpc_payload})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "whisper_loaded": whisper_model is not None, "ollama_available": llm is not None})


if __name__ == "__main__":
    app.run(port=5001, debug=False)
# whispermod.py
'''import os
import tempfile
import base64
import uuid
from typing import Tuple
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import whisper
from gtts import gTTS
import io
import traceback
import time
import asyncio
# Optional: Ollama (used for extract/summarize)
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama
from typing import TypedDict
# -------------------------
# Config
# -------------------------
APP_PORT = 5001
WHISPER_MODEL_NAME = "small"   # change to "base"/"medium" if you want different size
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "phi4-mini:latest"

SYSTEM_PROMPT = """
You are a structured Tamil voice intake agent.
Your ONLY job is:
1) Collect these details in Tamil, one-by-one: name, age, address, earning per year, community (caste).
2) If unclear or missing, ask again politely in Tamil.
            # fallback
# Run

            transcript_en = transcribe_file_translate_to_english(tmp_path) or ""
"""whispermod.py

Cleaned and simplified single-file Flask voice agent used during development.
This file contains:
- a small in-memory mock of schemes
- a corrected `get_matching_schemes` matcher (no JS-style methods)
- safe model/LLM initialization (doesn't crash import if Ollama/Whisper missing)
- Flask endpoints for the agent flow described in your note.

If you prefer lazy model loading (no heavy imports during import-time), we can change
whisper/ollama initialization to happen on-demand inside endpoints.
"""

import os
import json
import uuid
import base64
import tempfile
import asyncio
import re
from typing import Dict, Any, Optional, List

from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    import whisper
except Exception:
    whisper = None

try:
    from gtts import gTTS
except Exception:
    gTTS = None

try:
    from langchain_core.messages import SystemMessage, HumanMessage
    from langchain_ollama import ChatOllama
except Exception:
    SystemMessage = None
    HumanMessage = None
    ChatOllama = None

# --------------------- START MOCK DATA & MATCHER (Self-Contained) ---------------------
schemes: List[Dict[str, Any]] = [
    {
        "id": "tractor-loan",
        "name": "Tractor Loan Scheme",
        "nameTa": "டிராக்டர் கடன் திட்டம்",
        "description": "Government-backed tractor loan for small and medium farmers.",
        "descriptionTa": "சிறு மற்றும் நடுத்தர விவசாயிகளுக்கான அரசாங்க ஆதரவு டிராக்டர் கடன் திட்டம்.",
        "eligibility": ["Farmer", "Age 18-60", "Own Land"],
        "maxAmount": "₹5,00,000",
        "interestRate": "7.5% p.a.",
        "keywords": ["tractor", "farming", "agriculture", "விவசாயம்"],
        "formKey": "tractor-loan",
        "questions": [
            {"key": "land_size", "label": "நீங்கள் வைத்துள்ள நிலத்தின் அளவு என்ன?", "labelEn": "What is your land size?"},
            {"key": "tractor_model", "label": "டிராக்டர் மாடல் என்ன?", "labelEn": "What is the tractor model?"},
            {"key": "loan_amount", "label": "எவ்வளவு தொகை கடனாக வேண்டும்?", "labelEn": "How much loan amount do you need?"},
        ],
    },
    {
        "id": "kcc-farmer",
        "name": "KCC Farmer Finance Scheme",
        "nameTa": "விவசாயி நிதி திட்டம் (KCC)",
        "description": "Financial support for farmers under the Kisan Credit Card program.",
        "descriptionTa": "கிசான் கடன் அட்டையின் கீழ் விவசாயிகளுக்கான நிதி உதவி.",
        "eligibility": ["Age: 18-60", "Farmer", "Cultivator"],
        "maxAmount": "₹3,00,000",
        "interestRate": "4.0% p.a.",
        "keywords": ["kcc", "farmer finance", "விவசாயி", "credit card", "agriculture", "credit", "fertilizers"],
        "formKey": "kcc-farmer",
        "questions": [
            {"key": "farmSize", "label": "பண்ணையின் அளவு என்ன?", "labelEn": "What is your farm size?"},
            {"key": "cropType", "label": "நீங்கள் எந்த பயிரை வளர்க்கிறீர்கள்?", "labelEn": "What type of crop do you grow?"},
            {"key": "annualIncome", "label": "விவசாயத்திலிருந்து ஆண்டு வருமானம் என்ன?", "labelEn": "What is your annual income from farming?"},
            {"key": "loanAmount", "label": "தேவையான கடன் தொகை எவ்வளவு?", "labelEn": "What loan amount do you require?"},
        ],
    },
]


def get_matching_schemes(user_data: Dict[str, Any], situation_text: str) -> List[Dict[str, Any]]:
    """Simple local matcher: keyword matching + basic age/community checks.

    This implementation avoids JS-style methods (no .includes) and is defensive so
    it won't throw on unexpected types.
    """
    text = (situation_text or "").lower().strip()
    try:
        age = int(user_data.get("age", 0) or 0)
    except (ValueError, TypeError):
        age = 0
    community = (user_data.get("community", "") or "").lower()

    matched: List[Dict[str, Any]] = []
    for scheme in schemes:
        # normalize keywords and test substring membership
        keyword_match = any((kw or "").lower().replace("-", " ").replace("_", " ") in text for kw in scheme.get("keywords", []))

        # age eligibility (simplified)
        age_match = 18 <= age <= 65

        # community requirement - check if scheme explicitly expects disadvantaged groups
        eligibility_text = " ".join(scheme.get("eligibility", [])).lower()
        requires_disadvantaged = any(w in eligibility_text for w in ("sc", "st", "bc", "mbc", "oc", "obc"))
        community_match = True
        if requires_disadvantaged:
            community_match = bool(re.search(r"\b(sc|st|bc|mbc|oc|obc)\b", community, re.I))

        # heuristic for kcc relevance
        needs_kcc_keywords = ["fertilizer", "harvest", "crop", "seeds", "விவசாயம்"]
        is_kcc_relevant = any(kw in text for kw in needs_kcc_keywords) and scheme.get("id") == "kcc-farmer"

        if (keyword_match or is_kcc_relevant) and age_match and community_match:
            matched.append(scheme)

    return matched

# --------------------- END MOCK DATA & MATCHER ---------------------


# ---------------------
# Configuration & models
# ---------------------
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "phi4-mini:latest")
WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "small")

SYSTEM_PROMPT = """
You are a structured Tamil voice intake assistant. Your ONLY job:
1) Extract a single short value requested by instruction from the user's reply.
2) If value cannot be extracted, return 'Not Found'.
3) Respond concisely (single value).
"""

FIELDS = [
    {"key": "name", "question_ta": "உங்கள் பெயர் என்ன?", "question_en": "What is your name?"},
    {"key": "age", "question_ta": "உங்கள் வயது என்ன?", "question_en": "What is your age?"},
    {"key": "address", "question_ta": "உங்கள் முகவரி என்ன?", "question_en": "What is your address?"},
    {"key": "earning", "question_ta": "உங்கள் ஆண்டு வருமானம் என்ன?", "question_en": "What is your yearly earning?"},
    {"key": "community", "question_ta": "உங்கள் சமூகத்தை (சாதி) குறிப்பிடுங்கள்.", "question_en": "What is your community?"},
    {"key": "situation", "question_ta": "இப்போது உங்கள் தற்போதைய நிதி நிலையை விளக்குங்கள்.", "question_en": "Describe your current financial situation."},
]


whisper_model = None
if whisper is not None:
    try:
        print(f"Loading Whisper model ({WHISPER_MODEL_SIZE})...")
        whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
        print("Whisper loaded successfully.")
    except Exception as e:
        print(f"Error loading Whisper: {e}. Continue without ASR for now.")

llm = None
if ChatOllama is not None:
    try:
        llm = ChatOllama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL, temperature=0)
        print("Connected to Ollama model.")
    except Exception as e:
        print(f"OLLAMA not available: {e}")

# ---------------------
# Flask setup
# ---------------------
app = Flask(__name__)
CORS(app)
SESSIONS: Dict[str, Dict[str, Any]] = {}


def tts_to_data_uri(text: str, lang: str = "ta") -> str:
    """Return a data URI for small TTS audio. If gTTS not available returns empty string."""
    if not text or gTTS is None:
        return ""
    try:
        fd, path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)
        tts = gTTS(text=text, lang=lang)
        tts.save(path)
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        os.remove(path)
        return f"data:audio/mpeg;base64,{b64}"
    except Exception as e:
        print(f"[TTS ERROR] {e}")
        return ""


def transcribe_file_translate_to_english_from_path(path: str) -> str:
    if whisper_model is None:
        return ""
    try:
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            print(f"[TRANSCRIBE] file missing or empty: {path}")
            return ""
        result = whisper_model.transcribe(path, task="translate", language="ta")
        return (result.get("text") or "").strip()
    except Exception as e:
        print("[WHISPER ERROR]", repr(e))
        return ""


async def extract_field_with_llm(instruction: str, user_text: str) -> str:
    if llm is None or SystemMessage is None:
        return "Not Found"
    try:
        messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=f"{instruction}\n\nUser reply:\n{user_text}" )]
        resp = await llm.ainvoke(messages)
        return (resp.content or "").strip()
    except Exception as e:
        print("[LLM ERROR]", e)
        return "Not Found"


def make_new_session(user_id: Optional[str] = None, language: str = "ta") -> Dict[str, Any]:
    if not user_id:
        user_id = str(uuid.uuid4())
    state = {"user_id": user_id, "language": language, "next_index": 0, "collected": {}}
    SESSIONS[user_id] = state
    return state


@app.route("/start_agent", methods=["POST"])
def start_agent():
    payload = request.get_json() or {}
    user_id = payload.get("user_id")
    language = payload.get("language", "ta")
    state = SESSIONS.get(user_id) or make_new_session(user_id=user_id, language=language)
    next_index = state["next_index"]
    field = FIELDS[next_index]
    agent_text = "வணக்கம்! சில அடிப்படை விவரங்களை கேட்கிறேன். தயார் தானே?" if language == "ta" else "Hello — I will ask some basic details. Ready?"
    prompt = f"{agent_text} {field['question_ta'] if language == 'ta' else field['question_en']}"
    audio_url = tts_to_data_uri(prompt, lang="ta" if language == "ta" else "en")
    return jsonify({
        "user_id": state["user_id"],
        "agent_text": prompt,
        "audio_url": audio_url,
        "next_field_key": field["key"],
        "next_field_label": field["question_ta"] if language == "ta" else field["question_en"],
    })


@app.route("/agent_step", methods=["POST"])
def agent_step():
    language = request.form.get("language", "ta")
    user_id = request.form.get("user_id")
    state = SESSIONS.get(user_id)
    if not state or "file" not in request.files:
        return jsonify({"error": "Missing user_id or audio file. Please restart session."}), 400
    audio_file = request.files["file"]
    fd, tmp_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    try:
        audio_file.save(tmp_path)
        transcript_en = transcribe_file_translate_to_english_from_path(tmp_path)
        print(f"[TRANSCRIPT-EN] {transcript_en}")

        idx = state["next_index"]
        if idx >= len(FIELDS):
            return jsonify({"done": True, "final_state": state["collected"]})
        current_field = FIELDS[idx]
        field_key = current_field["key"]

        extracted = "Not Found"
        if transcript_en:
            instruction = f"Extract the {field_key} value from the user's reply. If you cannot find it, return exactly: Not Found"
            try:
                extracted = asyncio.run(extract_field_with_llm(instruction, transcript_en))
            except Exception:
                extracted = "Not Found"

        extracted = (extracted or "").strip() or "Not Found"
        stored_value = extracted if extracted != "Not Found" else transcript_en
        state["collected"][field_key] = stored_value
        state["next_index"] = idx + 1
        SESSIONS[state["user_id"]] = state

        done = state["next_index"] >= len(FIELDS)
        if not done:
            next_field = FIELDS[state["next_index"]]
            agent_text = next_field["question_ta"] if language == "ta" else next_field["question_en"]
        else:
            agent_text = "அனைத்து விவரங்களும் சேகரிக்கப்பட்டது. நன்றி! விவரங்கள் தயாரிப்பு முகவருக்கு அனுப்பப்பட்டது." if language == "ta" else "All details collected. Thank you! Data sent to the Product Agent."

        audio_data_uri = tts_to_data_uri(agent_text, lang="ta" if language == "ta" else "en")

        response = {
            "user_id": state["user_id"],
            "field_key": field_key,
            "user_transcript_en": transcript_en,
            "value_extracted": stored_value,
            "agent_text": agent_text,
            "audio_url": audio_data_uri,
            "done": done,
        }
        if done:
            response["final_state"] = state["collected"]
        return jsonify(response)
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception as e:
            print(f"[CLEANUP WARNING] {e}")


@app.route("/submit_and_match", methods=["POST"])
def submit_and_match():
    payload = request.get_json() or {}
    collected_data = payload.get("collected_data", {})
    user_id = payload.get("user_id")
    json_rpc_payload = {
        "jsonrpc": "2.0",
        "method": "scheme_recommendation",
        "id": user_id,
        "params": {
            "user_id": user_id,
            "user_metadata": {
                "name": collected_data.get("name"),
                "age": collected_data.get("age"),
                "community": collected_data.get("community"),
                "yearly_earning_proxy": collected_data.get("earning"),
            },
            "situational_context": collected_data.get("situation"),
        },
    }
    situation_gist = collected_data.get("situation", "")
    age = collected_data.get("age", 0)
    community = collected_data.get("community", "")
    matching_schemes = get_matching_schemes({"age": age, "community": community}, situation_gist)
    if not matching_schemes:
        return (
            jsonify({
                "status": "error",
                "message": "No schemes matched the user's profile and situation.",
                "json_rpc_sent": json_rpc_payload,
            }),
            404,
        )
    return jsonify({
        "status": "success",
        "message": "Schemes matched and vetted.",
        "schemes": matching_schemes,
        "json_rpc_sent": json_rpc_payload,
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "whisper_loaded": whisper_model is not None, "ollama_available": llm is not None})


if __name__ == "__main__":
    app.run(port=5001, debug=False)
                extracted = loop.run_until_complete(extracted)
        except Exception as e:
            print(f"[LLM ERROR] {e}")
            extracted = "Not Found"

        extracted = (extracted or "").strip() or "Not Found"

        # ✅ Step 4: Store
        state["collected"][field_key] = (
            extracted if extracted != "Not Found" else transcript_en
        )
        state["next_index"] = idx + 1
        SESSIONS[state["user_id"]] = state

        # ✅ Step 5: Next prompt
        done = state["next_index"] >= len(FIELDS)
        if not done:
            next_field = FIELDS[state["next_index"]]
            agent_text = (
                next_field["question_ta"]
                if language == "ta"
                else next_field["question_en"]
            )
        else:
            agent_text = (
                "அனைத்து விவரங்களும் சேகரிக்கப்பட்டது. நன்றி!"
                if language == "ta"
                else "All details collected. Thank you!"
            )

        # ✅ Step 6: TTS
        try:
            audio_data_uri = tts_to_data_uri(agent_text, lang="ta" if language == "ta" else "en")
        except Exception as e:
            print(f"[TTS ERROR] {e}")
            audio_data_uri = None

        # ✅ Step 7: Build response
        response = {
            "user_id": state["user_id"],
            "field_key": field_key,
            "translated_field": field_key,
            "value": state["collected"][field_key],
            "agent_text": agent_text,
            "audio_url": audio_data_uri,
            "done": done,
        }
        if done:
            response["final_state"] = state["collected"]

        return jsonify(response)

    finally:
        # ✅ Clean up only after all ops
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception as e:
            print(f"[CLEANUP WARNING] {e}")'''

'''
@app.route("/agent_step", methods=["POST"])
def agent_step():
    """
    Accepts user audio for the current step and returns next agent instruction + audio.
    Expects multipart/form-data with:
      - file: audio blob (wav)
      - user_id: optional
      - language: "ta" or "en" (defaults to ta)
    Response JSON similar to the earlier spec.
    """
    language = request.form.get("language", "ta")
    user_id = request.form.get("user_id")
    state = SESSIONS.get(user_id) or make_new_session(user_id=user_id, language=language)

    if "file" not in request.files:
        return jsonify({"error": "Missing 'file' audio."}), 400

    audio_file = request.files["file"]

    # Save to fixed path (overwrite each time)
    try:
        # ensure directory exists
        input_dir = os.path.dirname(INPUT_WAV)
        os.makedirs(input_dir, exist_ok=True)

        # Save blob to INPUT_WAV (overwrite)
        audio_file.save(INPUT_WAV)
        # ensure filesystem flush (Windows)
        os.sync() if hasattr(os, "sync") else None
    except Exception as e:
        print("[SAVE ERROR] failed writing audio to INPUT_WAV:", e)
        return jsonify({"error": "Failed to save audio on server."}), 500

    try:
        # Step 1: Transcribe using fixed input file
        transcript_en = transcribe_file_translate_to_english_from_path(INPUT_WAV) or ""
        print(f"[TRANSCRIPT-EN] {transcript_en}")

        # Step 2: Determine current field
        idx = state["next_index"]
        if idx >= len(FIELDS):
            # Already finished
            return jsonify({"done": True, "final_state": state["collected"]})

        current_field = FIELDS[idx]
        field_key = current_field["key"]

        # Step 3: Use LLM to extract a short value (single-field)
        instruction = f"Extract the {field_key} value from the user's reply. If you cannot find it, return exactly: Not Found"
        try:
            # call async LLM in a safe sync wrapper
            extracted = asyncio.run(extract_field_with_llm(instruction, transcript_en))
        except Exception as e:
            print("[LLM ERROR]", repr(e))
            extracted = "Not Found"

        extracted = (extracted or "").strip()
        if not extracted:
            extracted = "Not Found"

        # Step 4: Store (fallback to transcript if Not Found)
        stored_value = extracted if extracted != "Not Found" else transcript_en
        state["collected"][field_key] = stored_value
        state["next_index"] = idx + 1
        SESSIONS[state["user_id"]] = state

        # Step 5: Next prompt (or finish)
        done = state["next_index"] >= len(FIELDS)
        if not done:
            next_field = FIELDS[state["next_index"]]
            agent_text = next_field["question_ta"] if language == "ta" else next_field["question_en"]
        else:
            agent_text = "அனைத்து விவரங்களும் சேகரிக்கப்பட்டது. நன்றி!" if language == "ta" else "All details collected. Thank you!"

        # Step 6: TTS -> data URI
        audio_data_uri = ""
        try:
            audio_data_uri = tts_to_data_uri(agent_text, lang="ta" if language == "ta" else "en")
        except Exception as e:
            print("[TTS ERROR]", e)
            audio_data_uri = ""

        # Step 7: prepare response
        response = {
            "user_id": state["user_id"],
            "field_key": field_key,
            "translated_field": field_key,
            "value": state["collected"][field_key],
            "agent_text": agent_text,
            "audio_url": audio_data_uri,
            "done": done,
        }
        if done:
            response["final_state"] = state["collected"]

        return jsonify(response)

    finally:
        # Do NOT delete INPUT_WAV here so it's available next time (user requested persistent input.wav)
        # If you want to remove between calls, uncomment the lines below:
        # try:
        #     if os.path.exists(INPUT_WAV):
        #         os.remove(INPUT_WAV)
        # except Exception:
        #     pass
        pass
@app.route("/stt", methods=["POST"])
def stt_endpoint():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    audio_file = request.files["file"]
    fd, tmp_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    audio_file.save(tmp_path)
    try:
        transcript = transcribe_file_translate_to_english_from_path(tmp_path)
        return jsonify({"transcript": transcript})
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

@app.route("/tts", methods=["POST"])
def tts_endpoint():
    data = request.get_json() or {}
    text = data.get("text", "")
    lang = data.get("lang", "ta")
    if not text:
        return jsonify({"error": "Missing text"}), 400
    audio_uri = tts_to_data_uri(text, lang=lang)
    return jsonify({"audio_url": audio_uri})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5001, debug=True)'''

import os
import json
import uuid
import base64
import tempfile
import asyncio
from typing import Dict, Any, Optional

from flask import Flask, request, jsonify
from flask_cors import CORS

import whisper
from gtts import gTTS
import re

# LLM imports (async)
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_ollama import ChatOllama

# --------------------- START MOCK DATA & MATCHER (Self-Contained) ---------------------
# This section contains the mock data and matching logic required by the submit_and_match route.
schemes = [
    {
        "id": "tractor-loan", "name": "Tractor Loan Scheme", "nameTa": "டிராக்டர் கடன் திட்டம்",
        "description": "Government-backed tractor loan for small and medium farmers.",
        "descriptionTa": "சிறு மற்றும் நடுத்தர விவசாயிகளுக்கான அரசாங்க ஆதரவு டிராக்டர் கடன் திட்டம்.",
        "eligibility": ["Farmer", "Age 18-60", "Own Land"], "maxAmount": "₹5,00,000",
        "interestRate": "7.5% p.a.", "keywords": ["tractor", "farming", "agriculture", "விவசாயம்"],
        "formKey": "tractor-loan",
        "questions": [
            {"key": "land_size", "label": "நீங்கள் வைத்துள்ள நிலத்தின் அளவு என்ன?", "labelEn": "What is your land size?"},
            {"key": "tractor_model", "label": "டிராக்டர் மாடல் என்ன?", "labelEn": "What is the tractor model?" },
            {"key": "loan_amount", "label": "எவ்வளவு தொகை கடனாக வேண்டும்?", "labelEn": "How much loan amount do you need?" }
        ],
    },
    {
        "id": "kcc-farmer", "name": "KCC Farmer Finance Scheme", "nameTa": "விவசாயி நிதி திட்டம் (KCC)",
        "description": "Financial support for farmers under the Kisan Credit Card program.",
        "descriptionTa": "கிசான் கடன் அட்டையின் கீழ் விவசாயிகளுக்கான நிதி உதவி.",
        "eligibility": ["Age: 18-60", "Farmer", "Cultivator"], "maxAmount": "₹3,00,000",
        "interestRate": "4.0% p.a.", 
        "keywords": ["kcc", "farmer finance", "விவசாயி", "credit card", "agriculture", "credit", "fertilizers"],
        "formKey": "kcc-farmer",
        "questions": [
            {"key": "farmSize", "label": "பண்ணையின் அளவு என்ன?", "labelEn": "What is your farm size?"},
            {"key": "cropType", "label": "நீங்கள் எந்த பயிரை வளர்க்கிறீர்கள்?", "labelEn": "What type of crop do you grow?" },
            {"key": "annualIncome", "label": "விவசாயத்திலிருந்து ஆண்டு வருமானம் என்ன?", "labelEn": "What is your annual income from farming?" },
            {"key": "loanAmount", "label": "தேவையான கடன் தொகை எவ்வளவு?", "labelEn": "What loan amount do you require?" }
        ],
    },
]

def get_matching_schemes(user_data, situation_text):
    """Mocks the RAG agent's scheme retrieval based on keywords and basic eligibility."""
    text = (situation_text or "").lower().strip()
    try:
        age = int(user_data.get("age", 0))
    except (ValueError, TypeError):
        age = 0 
    community = (user_data.get("community", "") or "").lower()

    matched_schemes = []
    for scheme in schemes:
        keyword_match = any(
            text.find(kw.lower().replace('-', ' ').replace('_', ' ')) != -1
            for kw in scheme["keywords"]
        )

        age_match = age >= 18 and age <= 65
        community_match = (
            not any(e.lower().includes("sc/st") for e in scheme["eligibility"])
            or bool(re.search(r"sc|st|bc|mbc|oc|obc", community, re.I))
        ) # Simplified community check for mock
        
        needs_kcc_keywords = ["fertilizer", "harvest", "crop", "seeds", "விவசாயம்"]
        is_kcc_relevant = any(kw in text for kw in needs_kcc_keywords) and "kcc-farmer" in scheme["id"]

        if (keyword_match or is_kcc_relevant) and age_match and community_match:
            matched_schemes.append(scheme)

    return matched_schemes

# --------------------- END MOCK DATA & MATCHER ---------------------

# --------------------- Configuration ---------------------
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "phi4-mini:latest" 
WHISPER_MODEL_SIZE = "medium"

SYSTEM_PROMPT = """
You are a structured Tamil voice intake assistant. Your ONLY job:
1) Extract a single short value requested by instruction from the user's reply.
2) If value cannot be extracted, return 'Not Found'.
3) Respond concisely (single value).
"""

FIELDS = [
    {"key": "name", "question_ta": "உங்கள் பெயர் என்ன?", "question_en": "What is your name?"},
    {"key": "age", "question_ta": "உங்கள் வயது என்ன?", "question_en": "What is your age?"},
    {"key": "address", "question_ta": "உங்கள் முகவரி என்ன?", "question_en": "What is your address?"},
    {"key": "earning", "question_ta": "உங்கள் ஆண்டு வருமானம் என்ன?", "question_en": "What is your yearly earning?"},
    {"key": "community", "question_ta": "உங்கள் சமூகத்தை (சாதி) குறிப்பிடுங்கள்.", "question_en": "What is your community?"},
    {"key": "situation", "question_ta": "இப்போது உங்கள் தற்போதைய நிதி நிலையை விளக்குங்கள்.", "question_en": "Describe your current financial situation."}
]

# --------------------- Initialize models and state ---------------------
try:
    print("Loading Whisper model (small)...")
    whisper_model = whisper.load_model(WHISPER_MODEL_SIZE, device='cpu') 
    print("Whisper loaded successfully.")
except Exception as e:
    print(f"Error loading Whisper: {e}. Ensure FFmpeg is installed.")
    whisper_model = None 

print(f"Connecting to Ollama model: {OLLAMA_MODEL}...")
llm = ChatOllama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL, temperature=0.0)

# --------------------- Flask setup ---------------------
app = Flask(__name__)
CORS(app)
SESSIONS: Dict[str, Dict[str, Any]] = {}

# --------------------- Helpers ---------------------
def tts_to_data_uri(text: str, lang: str = "ta") -> str:
    """Generate base64-encoded audio using gTTS."""
    if not text:
        return ""
    try:
        mp3_fp = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        path = mp3_fp.name
        mp3_fp.close()
        
        tts = gTTS(text=text, lang=lang)
        tts.save(path)
        
        with open(path, "rb") as f:
             b64 = base64.b64encode(f.read()).decode("utf-8")
        
        os.remove(path)
        return f"data:audio/mpeg;base64,{b64}"
    except Exception as e:
        print(f"[TTS ERROR] Failed to generate TTS for '{text[:30]}...': {e}")
        return ""


def transcribe_file_translate_to_english_from_path(path: str) -> str:
    """Transcribe the audio file at `path` using whisper with translation (Tamil -> English)."""
    if whisper_model is None:
        return "[ERROR: Whisper model failed to load]"
    try:
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            print(f"[TRANSCRIBE] file missing or empty: {path}")
            return ""
        
        result = whisper_model.transcribe(path, task="translate", language='ta')
        text = (result.get("text") or "").strip()
        return text
    except Exception as e:
        print("[WHISPER ERROR]", repr(e))
        return ""

async def extract_field_with_llm(instruction: str, user_text: str) -> str:
    """Async LLM extraction call using LangChain."""
    try:
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"{instruction}\n\nUser reply:\n{user_text}")
        ]
        resp = await llm.ainvoke(messages)
        return (resp.content or "").strip()
    except Exception as e:
        print("[LLM ERROR]", e)
        return "Not Found"

def make_new_session(user_id: Optional[str] = None, language: str = "ta") -> Dict[str, Any]:
    """Initialize or reset a new session."""
    if not user_id:
        user_id = str(uuid.uuid4())
    state = {
        "user_id": user_id,
        "language": language,
        "next_index": 0,
        "collected": {},
    }
    SESSIONS[user_id] = state
    return state

# ---------------------
# Routes
# ---------------------

@app.route("/start_agent", methods=["POST"])
def start_agent():
    """Initializes the session and returns the first question."""
    payload = request.get_json() or {}
    user_id = payload.get("user_id")
    language = payload.get("language", "ta")

    state = SESSIONS.get(user_id) or make_new_session(user_id=user_id, language=language)
    
    # Ensure state is reset if finished from last session
    if state["next_index"] >= len(FIELDS):
        state = make_new_session(user_id=user_id, language=language)

    next_index = state["next_index"]
    field = FIELDS[next_index]

    agent_text = (
        "வணக்கம்! சில அடிப்படை விவரங்களை கேட்கிறேன். தயார் தானே?"
        if language == "ta"
        else "Hello — I will ask some basic details. Ready?"
    )
    prompt = f"{agent_text} {field['question_ta'] if language=='ta' else field['question_en']}"
    audio_url = tts_to_data_uri(prompt, lang="ta" if language == "ta" else "en")

    return jsonify({
        "user_id": state["user_id"],
        "agent_text": prompt,
        "audio_url": audio_url,
        "next_field_key": field["key"],
        "next_field_label": field["question_ta"] if language == "ta" else field["question_en"],
        "collected_data": state["collected"]
    })

@app.route("/agent_step", methods=["POST"])
def agent_step():
    """Accepts user audio, processes it (Whisper + Ollama), and determines the next step/prompt."""
    
    language = request.form.get("language", "ta")
    user_id = request.form.get("user_id")
    state = SESSIONS.get(user_id)
    
    if not state or "file" not in request.files:
        return jsonify({"error": "Missing user_id or audio file. Please restart session."}), 400

    audio_file = request.files["file"]
    
    fd, tmp_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    
    try:
        # 2. Save audio
        audio_file.save(tmp_path)
        
        # 3. Step 1: Transcribe (Whisper ASR + Translation)
        transcript_en = transcribe_file_translate_to_english_from_path(tmp_path)
        print(f"[TRANSCRIPT-EN] {transcript_en}")

        # 4. Determine current field
        idx = state["next_index"]
        current_field = FIELDS[idx]
        field_key = current_field["key"]
        
        # 5. Step 2: Extract via LLM (Sync wrapper for async call)
        extracted = "Not Found"
        if transcript_en:
            # CORRECTED: Use field_key
            instruction = f"Extract the {field_key} value from the user's reply. If you cannot find it, return exactly: Not Found"
            extracted = asyncio.run(extract_field_with_llm(instruction, transcript_en))
            
        extracted = (extracted or "").strip()
        if not extracted: extracted = "Not Found"

        # 6. Step 3: Store result and advance index
        stored_value = extracted if extracted != "Not Found" else transcript_en
        state["collected"][field_key] = stored_value
        state["next_index"] = idx + 1
        SESSIONS[state["user_id"]] = state

        # 7. Step 4: Prepare next prompt
        done = state["next_index"] >= len(FIELDS)
        if not done:
            next_field = FIELDS[state["next_index"]]
            agent_text = next_field["question_ta"] if language == "ta" else next_field["question_en"]
        else:
            agent_text = "அனைத்து விவரங்களும் சேகரிக்கப்பட்டது. நன்றி! விவரங்கள் தயாரிப்பு முகவருக்கு அனுப்பப்பட்டது." if language == "ta" else "All details collected. Thank you! Data sent to the Product Agent."
        
        # 8. Step 5: TTS -> audio URI
        audio_data_uri = tts_to_data_uri(agent_text, lang="ta" if language == "ta" else "en")

        # 9. Build response
        response = {
            "user_id": state["user_id"],
            "field_key": field_key,
            "user_transcript_en": transcript_en,
            "value_extracted": stored_value,
            "agent_text": agent_text,
            "audio_url": audio_data_uri,
            "done": done,
        }
        if done:
            response["final_state"] = state["collected"]

        return jsonify(response)

    finally:
        # 10. Cleanup temporary audio file
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception as e:
            print(f"[CLEANUP WARNING] {e}")


@app.route("/submit_and_match", methods=["POST"])
def submit_and_match():
    """
    Final call: Structures the collected data into a JSON-RPC payload 
    and simulates the Product Agent call (using the client-side schemeMatcher logic for now).
    """
    payload = request.get_json() or {}
    collected_data = payload.get("collected_data", {})
    user_id = payload.get("user_id")

    # --- Step 1: Formalize JSON-RPC Payload (Core Output of User Agent) ---
    json_rpc_payload = {
        "jsonrpc": "2.0",
        "method": "scheme_recommendation",
        "id": user_id,
        "params": {
            "user_id": user_id,
            "user_metadata": {
                "name": collected_data.get("name"),
                "age": collected_data.get("age"),
                "community": collected_data.get("community"),
                "yearly_earning_proxy": collected_data.get("earning"),
            },
            "situational_context": collected_data.get("situation")
        }
    }
    
    # --- Step 2: Simulate Product Agent Interaction (Using Local Stub) ---
    # This simulates the RAG Agent receiving the request and sending the result.
    situation_gist = collected_data.get("situation", "")
    age = collected_data.get("age", 0)
    community = collected_data.get("community", "")
    
    # Run the client-side matching logic on the server to prove the flow
    matching_schemes = get_matching_schemes(
        {"age": age, "community": community},
        situation_gist
    )

    if not matching_schemes:
        return jsonify({
            "status": "error",
            "message": "No schemes matched the user's profile and situation.",
            "json_rpc_sent": json_rpc_payload
        }), 404
    
    # --- Step 3: Return the result (simulating Product Agent's response) ---
    return jsonify({
        "status": "success",
        "message": "Schemes matched and vetted.",
        "schemes": matching_schemes,
        "json_rpc_sent": json_rpc_payload
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "whisper_loaded": whisper_model is not None, "ollama_model": OLLAMA_MODEL})

if __name__ == "__main__":
    app.run(port=5000, debug=False)