from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS
from services.explain import explain_scheme
from services.tts import text_to_speech
from services.schemes import load_scheme_text
from services.schemes import load_scheme_text
import uuid
import os
import sys

# Add root directory to path to access document_verification
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from document_verification.aadhar_name_verfication import verify_aadhaar_name
from document_verification.aadhar_photo_verification import aadhaar_face_verification
from document_verification.cibil_verification import extract_cibil_score
app=Flask(__name__)
CORS(app)
@app.route("/scheme/explain",methods=['POST'])
def explain_scheme_api():
    data=request.json
    #context=data.get("context")
    scheme_id=data.get("schemeId")
    language=data.get("language","ta")
    if not scheme_id:
        return jsonify({"error":"schemeId is required"})
    context=load_scheme_text(scheme_id)
    explanation=explain_scheme(context,language)
    audio_f=text_to_speech(explanation,language)
    return jsonify({
        "text":explanation,
        "audio":f"/scheme_explanation/{audio_f}"
    })
@app.route("/scheme_explanation/<filename>")
def serve_scheme_elaboration(filename):
    return send_from_directory("scheme_explanation",filename)

@app.route("/verify_documents", methods=['POST'])
def verify_documents():
    data = request.form
    user_name = data.get("user_name")
    language = data.get("language", "ta")
    
    if 'aadhar_pdf' not in request.files or 'selfie_image' not in request.files:
        return jsonify({
            "verified": False,
            "message": "Missing files" if language == "en" else "கோப்புகள் காணவில்லை"
        }), 400
        
    aadhar_file = request.files['aadhar_pdf']
    selfie_file = request.files['selfie_image']
    
    # Save files temporarily
    temp_dir = os.path.join(os.path.dirname(__file__), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    
    aadhar_path = os.path.join(temp_dir, f"{uuid.uuid4()}_aadhar.pdf")
    selfie_path = os.path.join(temp_dir, f"{uuid.uuid4()}_selfie.png")
    
    aadhar_file.save(aadhar_path)
    selfie_file.save(selfie_path)
    
    try:
        # 1. Verify Name
        name_matched = verify_aadhaar_name(user_name, aadhar_path)
        
        if not name_matched:
            return jsonify({
                "verified": False,
                "message": (
                    f"Name '{user_name}' not found in Aadhaar." 
                    if language == "en" 
                    else f"ஆதாரில் '{user_name}' என்ற பெயர் இல்லை."
                )
            })
            
        # 2. Verify Photo
        photo_result = aadhaar_face_verification(aadhar_path, selfie_path)
        
        if photo_result.get("verified"):
            return jsonify({
                "verified": True,
                "message": "Verification Successful" if language == "en" else "சரிபார்ப்பு வெற்றிகரமாக முடிந்தது"
            })
        else:
            return jsonify({
                "verified": False,
                "message": "Photo verification failed. Face mismatch." if language == "en" else "புகைப்பட சரிபார்ப்பு தோல்வியடைந்தது. முகம் பொருந்தவில்லை."
            })
            
    except Exception as e:
        print(f"Verification Error: {e}")
        return jsonify({
            "verified": False,
            "message": f"Server Error: {str(e)}"
        }), 500
        
    finally:
        # Cleanup
        if os.path.exists(aadhar_path):
            os.remove(aadhar_path)
        if os.path.exists(selfie_path):
            os.remove(selfie_path)

@app.route("/verify_cibil", methods=['POST'])
def verify_cibil():
    if 'cibil_file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['cibil_file']
    filename = secure_filename(file.filename)
    
    # Save temporarily
    temp_dir = os.path.join(os.path.dirname(__file__), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{filename}")
    
    try:
        file.save(temp_path)
        result = extract_cibil_score(temp_path)
        
        if "error" in result:
            return jsonify({"success": False, "message": result["error"]}), 400
        
        return jsonify({
            "success": True,
            "score": result["score"],
            "classification": result["classification"],
            "is_eligible": result["is_eligible"]
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
if __name__=="__main__":
    app.run(port=5070,debug=True,threaded=True,use_reloader=False)