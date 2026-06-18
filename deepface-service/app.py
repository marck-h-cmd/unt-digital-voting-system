from flask import Flask, request, jsonify
from deepface import DeepFace
import base64
import tempfile
import os

app = Flask(__name__)

def save_base64_to_temp(base64_str):
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    img_data = base64.b64decode(base64_str)
    fd, temp_path = tempfile.mkstemp(suffix=".jpg")
    with os.fdopen(fd, 'wb') as f:
        f.write(img_data)
    return temp_path

@app.route('/api/face/verify', methods=['POST'])
def verify_face():
    data = request.json
    if not data or 'img1_base64' not in data or 'img2_url' not in data:
        return jsonify({"error": "Missing img1_base64 or img2_url"}), 400
    
    img1_path = None
    try:
        img1_path = save_base64_to_temp(data['img1_base64'])
        
        result = DeepFace.verify(
            img1_path=img1_path,
            img2_path=data['img2_url'], 
            model_name="Facenet512",
            enforce_detection=True
        )
        
        return jsonify({
            "verified": result["verified"],
            "score": max(0.0, 1.0 - result["distance"])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if img1_path and os.path.exists(img1_path):
            os.remove(img1_path)

@app.route('/api/face/liveness', methods=['POST'])
def liveness():
    data = request.json
    if not data or 'img_base64' not in data:
        return jsonify({"error": "Missing img_base64"}), 400
    
    img_path = None
    try:
        img_path = save_base64_to_temp(data['img_base64'])
        faces = DeepFace.extract_faces(img_path=img_path, enforce_detection=True)
        if len(faces) > 0:
            return jsonify({"is_real": True, "faces": len(faces)})
        return jsonify({"is_real": False, "reason": "No face detected"})
    except Exception as e:
        return jsonify({"is_real": False, "error": str(e)})
    finally:
        if img_path and os.path.exists(img_path):
            os.remove(img_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
