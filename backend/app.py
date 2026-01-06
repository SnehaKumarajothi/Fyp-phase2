from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from services.explain import explain_scheme
from services.tts import text_to_speech
from services.schemes import load_scheme_text
import uuid
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
if __name__=="__main__":
    app.run(port=5070,debug=True,threaded=True,use_reloader=False)