from flask import Flask, request, jsonify
from deepface import DeepFace
import base64
import tempfile
import os
import json
import numpy as np
from scipy.spatial import distance

app = Flask(__name__)

def save_base64_to_temp(base64_str):
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    img_data = base64.b64decode(base64_str)
    fd, temp_path = tempfile.mkstemp(suffix=".jpg")
    with os.fdopen(fd, 'wb') as f:
        f.write(img_data)
    return temp_path

def get_embedding_from_base64(base64_str, model_name="Facenet512", detector_backends=None):
    if detector_backends is None:
        detector_backends = ['opencv', 'retinaface', 'mtcnn']
    
    img_path = None
    try:
        img_path = save_base64_to_temp(base64_str)
        last_exc = None
        for backend in detector_backends:
            try:
                objs = DeepFace.represent(img_path=img_path, model_name=model_name, enforce_detection=True, detector_backend=backend)
                if objs and len(objs) > 0 and 'embedding' in objs[0]:
                    return objs[0]['embedding']
            except Exception as e:
                last_exc = e
                continue
        if last_exc:
            print(f"get_embedding errors: {last_exc}")
        return None
    finally:
        if img_path and os.path.exists(img_path):
            os.remove(img_path)

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

@app.route('/api/face/extract-embedding', methods=['POST'])
def extract_embedding():
    data = request.json
    if not data or 'img_base64' not in data:
        return jsonify({"error": "Missing img_base64"}), 400
    
    embedding = get_embedding_from_base64(data['img_base64'])
    if embedding is None:
        return jsonify({"error": "No face detected in image"}), 400
    
    return jsonify({"embedding": embedding})

@app.route('/api/face/identify', methods=['POST'])
def identify_face():
    data = request.json
    if not data or 'img_base64' not in data or 'registered_embeddings' not in data:
        return jsonify({"error": "Missing img_base64 or registered_embeddings"}), 400
    
    embedding_actual = get_embedding_from_base64(data['img_base64'])
    if embedding_actual is None:
        return jsonify({"error": "No face detected in image"}), 400
    
    embedding_actual = np.array(embedding_actual, dtype=float)
    registered = data['registered_embeddings']
    
    mejor_match_id = None
    best_distance = float('inf')
    comparisons = 0
    DIST_THRESHOLD = 0.55
    
    for reg in registered:
        patrones = reg.get('embeddings')
        if not patrones:
            continue
        
        for pat in patrones:
            try:
                pat_arr = np.array(pat, dtype=float)
            except Exception:
                continue
            
            if pat_arr.shape != embedding_actual.shape:
                continue
            
            dist = distance.cosine(embedding_actual, pat_arr)
            comparisons += 1
            
            if dist < best_distance:
                best_distance = dist
                mejor_match_id = reg.get('id')
    
    if mejor_match_id is None or best_distance > DIST_THRESHOLD:
        return jsonify({
            "status": "error",
            "message": "No match found",
            "best_distance": best_distance,
            "comparisons": comparisons
        })
    
    return jsonify({
        "status": "success",
        "best_distance": best_distance,
        "comparisons": comparisons,
        "matched_id": mejor_match_id
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
