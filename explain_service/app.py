from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from phi_client import generate_explanation
from tts import text_to_speech
app=Flask(__name__)
CORS(app)
print("APP started")
print("press enter to exit")

@app.route("/explain",methods=["POST"])
def explain():
    data=request.json
    topic=data.get("topic")
    language=data.get("language","ta")
    if not topic:
        return jsonify({"error":"Topic is required"}),400
    explanation_text=generate_explanation(topic,language)
    audio_file=text_to_speech(explanation_text,language)
    return jsonify({
        "text":explanation_text,
        "audio":f"/audio/{audio_file}"
    })
@app.route("/audio/<filename>")
def serve_audio(filename):
    return send_from_directory("audio",filename)

if __name__=="__main__":
    app.run(port=5050,debug=True)