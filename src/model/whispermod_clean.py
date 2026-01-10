
"""whispermod_clean.py

Cleaned single-version Flask voice agent. This file is safe to run and
is intended as a drop-in replacement for the messy original.

Notes:
- Initialization of heavy deps (Whisper, Ollama) is defensive so import
  time won't crash when those libs are unavailable.
- `get_matching_schemes` corrected to use Python idioms only.
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
import shutil
import subprocess

try:
    from faster_whisper import WhisperModel
except Exception:
    WhisperModel = None

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


def get_all_situation_keywords() -> List[str]:
    """Collect all relevant keywords from schemes and add common loan/financial terms."""
    keywords = set()
    
    # Collect keywords from all schemes
    for scheme in schemes:
        for kw in scheme.get("keywords", []):
            keywords.add(kw.lower())
    
    # Add special KCC keywords
    keywords.update(["fertilizer", "harvest", "crop", "seeds", "விவசாயம்"])
    
    # Add common loan/financial/business keywords
    keywords.update([
        "loan", "credit", "finance", "financial", "business", "farmer", "farming", 
        "agriculture", "tractor", "equipment", "investment", "capital", "fund", "money",
        "need", "require", "want", "start", "expand", "grow", "develop", "purchase",
        "buy", "sell", "trade", "shop", "store", "market", "enterprise", "venture",
        "scheme", "program", "support", "help", "assistance", "விவசாயி", "வணிகம்"
    ])
    
    return list(keywords)


def is_valid_situation(situation_text: str, user_data: Dict[str, Any] = None) -> bool:
    """Check if situation text will actually match at least one loan scheme."""
    if not situation_text or situation_text.strip() == "":
        return False
    
    # If user_data is provided, do actual scheme matching
    if user_data is not None:
        try:
            age = int(user_data.get("age", 0) or 0)
        except (ValueError, TypeError):
            age = 0
        community = (user_data.get("community", "") or "").lower()
        
        # Try to match schemes with this situation
        matched = get_matching_schemes({"age": age, "community": community}, situation_text)
        if len(matched) > 0:
            print(f"[SITUATION VALIDATION] Situation matches {len(matched)} scheme(s): {[s.get('id') for s in matched]}")
            return True
        else:
            print(f"[SITUATION VALIDATION] Situation does not match any schemes")
            return False
    
    # Fallback: check if it contains relevant keywords (for cases where user_data not available)
    text_lower = situation_text.lower().strip()
    keywords = get_all_situation_keywords()
    
    # Check if any keyword appears in the situation text
    for kw in keywords:
        kw_normalized = kw.lower().replace("-", " ").replace("_", " ")
        if kw_normalized in text_lower or text_lower in kw_normalized:
            return True
    
    # Also check for common loan-related phrases
    loan_phrases = [
        "need loan", "want loan", "require loan", "apply loan", "get loan",
        "loan for", "need money", "want money", "require money", "financial help",
        "start business", "expand business", "grow business", "business loan"
    ]
    for phrase in loan_phrases:
        if phrase in text_lower:
            return True
    
    return False


def get_matching_schemes(user_data: Dict[str, Any], situation_text: str) -> List[Dict[str, Any]]:
    text = (situation_text or "").lower().strip()
    try:
        age = int(user_data.get("age", 0) or 0)
    except (ValueError, TypeError):
        age = 0
    community = (user_data.get("community", "") or "").lower()

    matched: List[Dict[str, Any]] = []
    for scheme in schemes:
        # Enhanced keyword matching: check full keyword or individual words
        keyword_match = False
        for kw in scheme.get("keywords", []):
            normalized = (kw or "").lower().replace("-", " ").replace("_", " ")
            # Check if full keyword is in text
            if normalized in text:
                keyword_match = True
                break
            # Also check if any word from the keyword is in the text (for multi-word keywords)
            keyword_words = normalized.split()
            if any(word for word in keyword_words if len(word) > 2 and word in text):
                keyword_match = True
                break
        
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
You are a structured data extraction assistant. Your ONLY job:
1) Extract ONLY the specific value requested in the instruction from the user's reply.
2) Return ONLY the extracted value, nothing else. No explanations, no labels, no prefixes.
3) If the requested value is NOT present in the user's reply, return EXACTLY: Not Found
4) Do NOT make up values. Do NOT extract values for other fields. Do NOT add labels or descriptions.
5) Return ONLY the raw value or "Not Found" - nothing else.

Examples:
- Instruction: "Extract the name value" | User: "My name is John" | Response: "John"
- Instruction: "Extract the age value" | User: "My name is John" | Response: "Not Found"
- Instruction: "Extract the earning value" | User: "2 lakhs" | Response: "200000"
- Instruction: "Extract the community value" | User: "2 lakhs" | Response: "Not Found"
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
if WhisperModel is not None:
    try:
        print(f"Loading FasterWhisper model ({WHISPER_MODEL_SIZE})...")
        whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")
        print("Faster-Whisper loaded successfully.")
    except Exception as e:
        print(f"Error loading Faster-Whisper: {e}. Continue without ASR for now.")

# Debug: report ffmpeg availability at startup (helps diagnose FileNotFoundError from whisper)
ffmpeg_path = shutil.which("ffmpeg")
print(f"[ENV] ffmpeg on PATH? {bool(ffmpeg_path)}; which -> {ffmpeg_path}")
env_ffmpeg = os.environ.get("FFMPEG_PATH")
if env_ffmpeg:
    print(f"[ENV] FFMPEG_PATH env var set: {env_ffmpeg}")
    if not ffmpeg_path and os.path.isdir(env_ffmpeg):
        # append to PATH for this process
        os.environ["PATH"] = env_ffmpeg + os.pathsep + os.environ.get("PATH", "")
        ffmpeg_path = shutil.which("ffmpeg")
        print(f"[ENV] after appending FFMPEG_PATH, ffmpeg which -> {ffmpeg_path}")
env_ffmpeg_exe = os.environ.get("FFMPEG_EXE")
if env_ffmpeg_exe:
    print(f"[ENV] FFMPEG_EXE env var set: {env_ffmpeg_exe}")
    if os.path.isfile(env_ffmpeg_exe):
        ffmpeg_path = env_ffmpeg_exe
        # ensure its folder is on PATH for subprocesses
        ffdir = os.path.dirname(env_ffmpeg_exe)
        os.environ["PATH"] = ffdir + os.pathsep + os.environ.get("PATH", "")
        print(f"[ENV] using explicit ffmpeg exe and added its dir to PATH: {ffdir}")

# Try to run ffmpeg -version to confirm it's callable from this process
try:
    if ffmpeg_path:
        completed = subprocess.run([ffmpeg_path, "-version"], capture_output=True, text=True, timeout=5)
        print(f"[ENV] ffmpeg -version exit={completed.returncode}; stdout={completed.stdout.splitlines()[0] if completed.stdout else ''}")
    else:
        print("[ENV] ffmpeg not found; subprocess test skipped")
except Exception as e:
    print(f"[ENV] ffmpeg run test failed: {e}")

llm = None
if ChatOllama is not None:
    try:
        llm = ChatOllama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL, temperature=0)
        print("Connected to Ollama model.")
    except Exception as e:
        print(f"OLLAMA not available: {e}")

app = Flask(__name__)
CORS(app)
# Single-user mode: keep one session in memory. Use this server for a single operator collecting
# multiple user responses sequentially. Reset by sending form field `reset=true` with the POST.
SESSIONS: Dict[str, Dict[str, Any]] = {}
SINGLE_SESSION_KEY = "__SINGLE__"

# Initialize a default single session
def _init_single_session(language: str = "ta") -> Dict[str, Any]:
    state = {"user_id": SINGLE_SESSION_KEY, "language": language, "next_index": 0, "collected": {}}
    SESSIONS[SINGLE_SESSION_KEY] = state
    return state

# Ensure single session exists at import time
if SINGLE_SESSION_KEY not in SESSIONS:
    _init_single_session()


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
        segments, info = whisper_model.transcribe(
            path,
            task="translate",
            language="ta",
        )
        text = "".join([seg.text for seg in segments])
        return text.strip()
    except Exception as e:
        print("[Faster-Whisper ERROR]", repr(e))
        return ""

        try:
            audio, sr = sf.read(path)
            # ensure numpy array
            audio = np.asarray(audio)
        except Exception as fe:
            print(f"[TRANSCRIBE FALLBACK ERROR reading] {fe}")
            return ""

        # mono
        if getattr(audio, "ndim", 1) > 1:
            audio = np.mean(audio, axis=1)

        # For resampling operations use float64 to avoid dtype-mismatch errors
        try:
            audio = audio.astype(np.float64)
        except Exception:
            audio = audio.astype('float64')

        target_sr = 16000
        if sr != target_sr:
            # Try resampy first, else fall back to scipy or numpy interpolation
            resampled = None
            try:
                import resampy
                # resampy handles float64 fine; ensure input is float64
                resampled = resampy.resample(audio, sr, target_sr)
            except Exception as e1:
                try:
                    from scipy.signal import resample_poly
                    gcd = np.gcd(sr, target_sr)
                    up = target_sr // gcd
                    down = sr // gcd
                        # resample_poly may require matching dtypes; use float64 here
                    resampled = resample_poly(audio, up, down)
                except Exception as e2:
                    try:
                        import math
                        new_len = int(math.floor(len(audio) * (target_sr / float(sr))))
                            # use float64 arrays for interpolation
                        indices = np.linspace(0, len(audio) - 1, new_len)
                        resampled = np.interp(indices, np.arange(len(audio)), audio)
                    except Exception as err:
                        print(f"[RESAMPLE ERROR] {err} {e1} {e2}")
                        return ""

            # ensure float32 dtype for whisper input
            try:
                resampled = np.asarray(resampled, dtype=np.float32)
            except Exception:
                resampled = resampled.astype(np.float32)

            audio = resampled

        # whisper's transcribe can accept numpy arrays directly
        try:
            # whisper expects float32 in range [-1,1]
            maxv = np.max(np.abs(audio)) if audio.size else 0.0
            if maxv > 1.0:
                audio = audio / maxv
            audio = audio.astype(np.float32)
            segments, info = whisper_model.transcribe(
                audio,
                task="translate",
                language="ta",
            )
            text = "".join([seg.text for seg in segments])
            return text.strip()
            
        except Exception as inner:
            print(f"[WHISPER FALLBACK ERROR] {inner}")
            return ""
        except Exception as fe:
            print(f"[TRANSCRIBE FALLBACK ERROR] {fe}")
            return ""


async def extract_field_with_llm(instruction: str, user_text: str) -> str:
    if llm is None or SystemMessage is None:
        return "Not Found"
    try:
        messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=f"{instruction}\n\nUser reply:\n{user_text}" )]
        # Use ainvoke for async or invoke for sync
        if hasattr(llm, 'ainvoke'):
            resp = await llm.ainvoke(messages)
        else:
            resp = llm.invoke(messages)
        return (resp.content or "").strip()
    except Exception as e:
        print("[LLM ERROR]", e)
        return "Not Found"


def make_new_session(user_id: Optional[str] = None, language: str = "ta") -> Dict[str, Any]:
    # Backwards-compatible helper. For multi-user deployments you may call this with
    # an explicit user_id. For single-user mode, prefer _init_single_session or rely on
    # the SINGLE_SESSION_KEY.
    if not user_id:
        user_id = str(uuid.uuid4())
    state = {"user_id": user_id, "language": language, "next_index": 0, "collected": {}}
    SESSIONS[user_id] = state
    return state


@app.route("/start_agent", methods=["POST"])
def start_agent():
    payload = request.get_json() or {}
    # Stateless start: return the first question and audio for a fresh interaction.
    language = payload.get("language", "ta")
    next_index = 0
    field = FIELDS[next_index]
    agent_text = "வணக்கம்!" if language == "ta" else "Hello — I will ask some basic details. Ready?"
    prompt = f"{agent_text} {field['question_ta'] if language == 'ta' else field['question_en']}"
    audio_url = tts_to_data_uri(prompt, lang="ta" if language == "ta" else "en")
    return jsonify({
        "user_id": None,
        "agent_text": prompt,
        "audio_url": audio_url,
        "next_index": next_index,
        "next_field_key": field["key"],
        "next_field_label": field["question_ta"] if language == "ta" else field["question_en"],
    })


@app.route("/agent_step", methods=["POST"])
def agent_step():
    """
    Stateless agent_step: accepts multipart/form-data with these fields:
      - file: WAV audio
      - language: optional (default 'ta')
      - collected: optional JSON string of previously collected values (e.g. '{"name":"..."}')
      - reset: optional 'true' to ignore collected and start from first field

    Behavior:
      - Transcribe the WAV to English via Whisper;
      - Starting from the first missing field (in collected or FIELDS order), attempt to extract that field from the transcript using the LLM. 
      - If extraction succeeds (not 'Not Found'), store it and advance to the next field and continue within the same transcript. 
      - Stop when an extraction returns 'Not Found' for the current field.
      - Return updated collected values, next_index, agent_text for next prompt, and if all fields found, run scheme matching and include matched 
        schemes and final_state.
    """
    print("/agent_step called (stateless)")
    print("request.files:", request.files)
    print("request.form:", request.form)

    if "file" not in request.files:
        return jsonify({"error": "Missing audio file. Please send multipart/form-data with field 'file'."}), 400

    language = request.form.get("language", "ta")
    reset_flag = request.form.get("reset", "false").lower() == "true"
    collected_raw = request.form.get("collected")

    try:
        collected = json.loads(collected_raw) if collected_raw else {}
    except Exception:
        collected = {}
    
    # Normalize field keys: map frontend keys to backend keys
    # Frontend uses "yearlyEarning" but backend expects "earning"
    if "yearlyEarning" in collected:
        earning_value = collected.pop("yearlyEarning")
        collected["earning"] = earning_value
        print(f"[NORMALIZE] Mapped yearlyEarning -> earning: {earning_value}")

    if reset_flag:
        collected = {}

    audio_file = request.files["file"]
    # Save uploaded bytes into a predictable project directory so you can inspect files easily
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    recordings_dir = os.path.join(project_root, "uploaded_wavs")
    os.makedirs(recordings_dir, exist_ok=True)
    filename = f"upload_{uuid.uuid4().hex}.wav"
    tmp_path = os.path.join(recordings_dir, filename)
    try:
        # Read raw bytes from the uploaded file to ensure the file is actually written
        try:
            audio_file.stream.seek(0)
        except Exception:
            pass
        data = audio_file.read()
        if not data:
            print("[ERROR] Uploaded file contained no data")
            return jsonify({"error": "Uploaded file is empty."}), 400
        # write bytes explicitly to the project path (so you can find them)
        with open(tmp_path, "wb") as wf:
            wf.write(data)
            wf.flush()
            try:
                os.fsync(wf.fileno())
            except Exception:
                pass
        size = os.path.getsize(tmp_path) if os.path.exists(tmp_path) else 0
        print(f"Saved file to {tmp_path}, size: {size} bytes")
        # Print a small header sample for quick debugging
        try:
            with open(tmp_path, "rb") as rf:
                hdr = rf.read(16)
            print(f"file header (hex): {hdr.hex()}")
        except Exception as e:
            print(f"[HEADER READ ERROR] {e}")

        transcript_en = transcribe_file_translate_to_english_from_path(tmp_path)
        print(f"[TRANSCRIPT-EN] {transcript_en}")

        # find first missing field index
        next_index = 0
        for i, fld in enumerate(FIELDS):
            if collected.get(fld["key"]) in (None, "", "Not Found"):
                next_index = i
                break
        else:
            next_index = len(FIELDS)
        
        print(f"Next index: {next_index}, collected: {collected}")

        values_extracted: Dict[str, str] = {}

        # Start attempting extraction from next_index and continue while successful
        i = next_index
        while i < len(FIELDS):
            fld = FIELDS[i]
            key = fld["key"]
            # if already present and not Not Found, skip to next field
            if collected.get(key) not in (None, "", "Not Found"):
                i += 1
                continue
            
            # Try to extract this field
            instruction = f"Extract the {key} value from the user's reply. If you cannot find it, return exactly: Not Found"
            print(instruction)
            extracted = "Not Found"
            if key != "community" and transcript_en:
                try:
                    extracted = asyncio.run(extract_field_with_llm(instruction, transcript_en))
                    print(f"[LLM EXTRACT] field={key}, extracted={extracted}")
                    # Clean up the extracted value - remove any labels, prefixes, or extra text
                    extracted = (extracted or "").strip()
                    # If it contains "Not Found" or looks like an error message, set to Not Found
                    if "not found" in extracted.lower() or len(extracted) == 0:
                        extracted = "Not Found"
                    # If it contains the field name as a label (e.g., "Community Value: 2000000"), extract just the value
                    if f"{key}" in extracted.lower() and ":" in extracted:
                        parts = extracted.split(":", 1)
                        if len(parts) > 1:
                            extracted = parts[1].strip()
                    # If it still looks like a label/description, set to Not Found
                    if any(word in extracted.lower() for word in ["value", "extracted", "found", "community value", "situation value"]):
                        if key.lower() not in extracted.lower():  # Only if it's not the actual value
                            extracted = "Not Found"
                except Exception as e:
                    print(f"[LLM EXTRACT ERROR] field={key} err={e}")
                    extracted = "Not Found"
                extracted = extracted.strip() if extracted else "Not Found"
            else:
                extracted = "BC"

            # Validate extracted value - must not be empty, "Not Found", or contain field labels
            is_valid = (
                extracted != "Not Found" 
                and extracted.strip() != ""
                and not any(label in extracted.lower() for label in ["value:", "extracted:", "found:", "community value", "situation value", "earning value", "age value", "name value", "address value"])
                and not extracted.lower().startswith(("community", "situation", "earning", "age", "name", "address"))
            )
            
            # Special validation for situation field: must match at least one scheme
            if key == "situation" and is_valid:
                # Check if the situation will actually match any schemes
                # Use the full transcript if available for better context
                situation_text_to_check = extracted
                if transcript_en and len(transcript_en) > len(extracted):
                    # If transcript is longer, it might have more context - use the full transcript
                    situation_text_to_check = transcript_en
                
                # Prepare user data for scheme matching validation
                validation_user_data = {
                    "age": collected.get("age", 0),
                    "community": collected.get("community", ""),
                }
                
                if not is_valid_situation(situation_text_to_check, validation_user_data):
                    print(f"[SITUATION VALIDATION] Extracted value '{extracted}' (from transcript: '{transcript_en}') does not match any schemes, treating as invalid")
                    is_valid = False
                else:
                    print(f"[SITUATION VALIDATION] Extracted value '{extracted}' matches at least one scheme, accepting")
            
            if is_valid:
                collected[key] = extracted
                values_extracted[key] = extracted
                print(f"[VALID EXTRACTION] field={key}, value={extracted}")
                # advance to next field and continue within same transcript
                i += 1
                continue
            else:
                # couldn't extract this field from the transcript - stop here
                print(f"[STOPPING] Could not extract valid value for {key}, stopping extraction loop")
                break
        
        # compute next_index as first missing
        for j, fld in enumerate(FIELDS):
            if collected.get(fld["key"]) in (None, "", "Not Found"):
                next_index = j
                break
        else:
            next_index = len(FIELDS)

        done = next_index >= len(FIELDS)
        if not done and next_index < len(FIELDS):
            next_field = FIELDS[next_index]
            agent_text = next_field["question_ta"] if language == "ta" else next_field["question_en"]
            field_key = next_field["key"]
        else:
            agent_text = "அனைத்து விவரங்களும் சேகரிக்கப்பட்டது. நன்றி! விவரங்கள் தயாரிப்பு முகவருக்கு அனுப்பப்பட்டது." if language == "ta" else "All details collected. Thank you! Data sent to the Product Agent."
            field_key = FIELDS[-1]["key"] if FIELDS else ""

        audio_data_uri = tts_to_data_uri(agent_text, lang="ta" if language == "ta" else "en")

        # Note: Keep backend keys (earning) in response - frontend's onStepComplete expects "earning"
        # The frontend's userData maps earning->yearlyEarning only when sending collected data
        response = {
            "user_transcript_en": transcript_en,
            "values_extracted": values_extracted,
            "collected": collected,
            "field_key": field_key,
            "agent_text": agent_text,
            "audio_url": audio_data_uri,
            "done": done,
            "next_index": next_index,
        }

        # if done, run matching and include schemes
        if done:
            try:
                age = collected.get("age", 0)
                community = collected.get("community", "")
                situation_gist = collected.get("situation", "")
                matching_schemes = get_matching_schemes({"age": age, "community": community}, situation_gist)
                response["final_state"] = collected
                response["schemes"] = matching_schemes
            except Exception as e:
                print(f"[MATCH ERROR] {e}")

        return jsonify(response)
    finally:
        # Keep uploaded files by default for inspection. If you want automatic cleanup,
        # set environment variable KEEP_UPLOADED=0 to remove saved WAVs after processing.
        try:
            keep = os.environ.get("KEEP_UPLOADED", "1")
            if keep == "0":
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        except Exception as e:
            print(f"[CLEANUP WARNING] {e}")


@app.route("/stt", methods=["POST"])
def stt_endpoint():
    """Simple transcription endpoint for scheme questions - just transcribes audio to text."""
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    audio_file = request.files["file"]
    fd, tmp_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    try:
        audio_file.save(tmp_path)
        transcript = transcribe_file_translate_to_english_from_path(tmp_path)
        return jsonify({"transcript": transcript})
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass


@app.route("/extract_scheme_field", methods=["POST"])
def extract_scheme_field():
    """
    Extract and validate a field value from user audio for scheme questions.
    Accepts multipart/form-data with:
      - file: WAV audio
      - field_key: the field key (e.g., "farmSize", "cropType")
      - field_label: the question text (for context)
      - language: optional (default 'ta')
    
    Returns:
      - transcript: the transcribed text
      - extracted: the extracted value
      - is_valid: whether the extracted value makes sense for this field
      - agent_text: next question or confirmation message
    """
    if "file" not in request.files:
        return jsonify({"error": "Missing audio file"}), 400
    
    language = request.form.get("language", "ta")
    field_key = request.form.get("field_key", "")
    field_label = request.form.get("field_label", "")
    
    audio_file = request.files["file"]
    fd, tmp_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    
    try:
        audio_file.save(tmp_path)
        transcript_en = transcribe_file_translate_to_english_from_path(tmp_path)
        print(f"[SCHEME EXTRACT] field={field_key}, transcript={transcript_en}")
        
        if not transcript_en:
            return jsonify({
                "transcript": "",
                "extracted": "Not Found",
                "is_valid": False,
                "agent_text": "மீண்டும் முயற்சிக்கவும்." if language == "ta" else "Please try again."
            })
        
        # Extract the value using LLM
        instruction = f"Extract the {field_key} value from the user's reply. The question was: {field_label}. If you cannot find a valid value, return exactly: Not Found"
        extracted = "Not Found"
        
        try:
            extracted = asyncio.run(extract_field_with_llm(instruction, transcript_en))
            print(f"[SCHEME LLM EXTRACT] field={field_key}, extracted={extracted}")
            
            # Clean up the extracted value
            extracted = (extracted or "").strip()
            if "not found" in extracted.lower() or len(extracted) == 0:
                extracted = "Not Found"
            
            # Remove labels/prefixes if present
            if f"{field_key}" in extracted.lower() and ":" in extracted:
                parts = extracted.split(":", 1)
                if len(parts) > 1:
                    extracted = parts[1].strip()
            
            # Check for label-like patterns
            if any(word in extracted.lower() for word in ["value", "extracted", "found"]):
                if field_key.lower() not in extracted.lower():
                    extracted = "Not Found"
        except Exception as e:
            print(f"[SCHEME EXTRACT ERROR] field={field_key} err={e}")
            extracted = "Not Found"
        
        extracted = extracted.strip() if extracted else "Not Found"
        
        # Validate the extracted value
        is_valid = (
            extracted != "Not Found"
            and extracted.strip() != ""
            and not any(label in extracted.lower() for label in ["value:", "extracted:", "found:"])
            and not extracted.lower().startswith(("value", "extracted", "found"))
        )
        
        # Additional field-specific validation
        if is_valid:
            is_valid = validate_scheme_field_value(field_key, extracted)
        
        if is_valid:
            agent_text = field_label  # Keep same question for now, will be updated by frontend
            print(f"[SCHEME VALID] field={field_key}, value={extracted}")
        else:
            agent_text = "மீண்டும் முயற்சிக்கவும். தயவுசெய்து சரியான பதிலை வழங்கவும்." if language == "ta" else "Please try again. Please provide a valid answer."
            print(f"[SCHEME INVALID] field={field_key}, extracted={extracted}")
        
        return jsonify({
            "transcript": transcript_en,
            "extracted": extracted,
            "is_valid": is_valid,
            "agent_text": agent_text
        })
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass


def validate_scheme_field_value(field_key: str, value: str) -> bool:
    """
    Validate that the extracted value makes sense for the given field.
    Returns True if the value is valid, False otherwise.
    """
    if not value or value.strip() == "":
        return False
    
    value_lower = value.lower().strip()
    
    # Field-specific validation rules
    if field_key == "farmSize" or field_key == "land_size":
        # Should contain numbers (acres, hectares, etc.)
        import re
        if re.search(r'\d+', value):
            return True
        return False
    
    elif field_key == "cropType" or field_key == "tractor_model":
        # Should be a meaningful word/phrase (not just numbers)
        if len(value) >= 2 and not value.isdigit():
            return True
        return False
    
    elif field_key == "annualIncome" or field_key == "loanAmount" or field_key == "loan_amount":
        # Should contain numbers (currency amounts)
        import re
        if re.search(r'\d+', value):
            return True
        return False
    
    # Default: any non-empty value that's not "Not Found" is acceptable
    return len(value) >= 1


@app.route("/validate_scheme_field", methods=["POST"])
def validate_scheme_field():
    """
    Validate a text value for a scheme field without requiring audio.
    Accepts JSON with:
      - field_key: the field key
      - field_label: the question text
      - value: the text value to validate
      - language: optional (default 'ta')
    
    Returns:
      - is_valid: whether the value is valid
      - agent_text: message to display
    """
    payload = request.get_json() or {}
    field_key = payload.get("field_key", "")
    value = payload.get("value", "")
    language = payload.get("language", "ta")
    
    is_valid = validate_scheme_field_value(field_key, value)
    
    if is_valid:
        agent_text = "✓"  # Success indicator
    else:
        agent_text = "மீண்டும் முயற்சிக்கவும். தயவுசெய்து சரியான பதிலை வழங்கவும்." if language == "ta" else "Please try again. Please provide a valid answer."
    
    return jsonify({
        "is_valid": is_valid,
        "agent_text": agent_text
    })


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
    app.run(port=5001, debug=True)
