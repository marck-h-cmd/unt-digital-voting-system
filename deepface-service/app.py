from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route("/api/face/verify", methods=["POST"])
def verify_face():
    # Mock DeepFace verification for demo purposes
    # In production, integrate with real DeepFace library
    data = request.json
    return jsonify({
        "verified": True,
        "score": 0.98,
        "distance": 0.02,
        "model": "Facenet512"
    })

@app.route("/api/face/liveness", methods=["POST"])
def check_liveness():
    # Mock liveness detection
    return jsonify({
        "is_live": True,
        "confidence": 0.97
    })

@app.route("/api/face/extract-embedding", methods=["POST"])
def extract_embedding():
    # Mock embedding extraction
    return jsonify({
        "embedding": [0.0] * 512,
        "model": "Facenet512"
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
