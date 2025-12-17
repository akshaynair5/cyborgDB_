"""
MedSec: Real Secure Clinical Search (Production Ready)
------------------------------------------------------
1. Real CyborgDB (Docker)
2. Local DeepSeek AI (Ollama)
3. Double-Encrypted Metadata (Consortium Key)
"""

from flask import Flask, request, jsonify
import redis
import json
import logging
import requests
from cryptography.fernet import Fernet
import cyborgdb 
import secrets
from flask_cors import CORS
import dotenv
import hashlib
dotenv.load_dotenv()

# ==================================================
# CONFIGURATION
# ==================================================

# 1. SECURITY: Your Consortium Key
CONSORTIUM_KEY = b'20siSj50fTPrCndwzj_Da45JlrN4vwDfT3GcsGYlYwQ=' 
cipher_suite = Fernet(CONSORTIUM_KEY)

# 2. LOCAL AI (Ollama)
OLLAMA_URL = "http://localhost:11434/api/generate"
LOCAL_MODEL = "deepseek-r1:1.5b"

# 3. REAL CYBORG DB CONNECTION (Docker)
CYBORG_API_KEY = dotenv.get_key(dotenv.find_dotenv(), "CYBORGDB_API_KEY")
vector_client = cyborgdb.Client("http://localhost:8000", api_key=CYBORG_API_KEY)

# Index Setup
INDEX_NAME = "medsec-encounters"
FIXED_INDEX_KEY_HEX = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
index_key_bytes = bytes.fromhex(FIXED_INDEX_KEY_HEX)

# 4. REDIS (Host)
redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medsec-real")

# ==================================================
# LOAD OR CREATE INDEX
# ==================================================

try:
    vector_index = vector_client.load_index(INDEX_NAME, index_key=index_key_bytes)
    logger.info(f"[MedSec] ✅ Connected to existing index: {INDEX_NAME}")
except Exception:
    logger.warning(f"[MedSec] ⚠️ Index not found. Creating new one...")
    try:
        config = {
            "ivfflat": {
                "dimension": 768,
                "n_lists": 100,
                "metric": "cosine"
            }
        }
        vector_index = vector_client.create_index(INDEX_NAME, index_key_bytes, config)
        logger.info(f"[MedSec] ✅ Successfully created NEW index: {INDEX_NAME}")
    except Exception as e:
        logger.critical(f"Index creation failed. Error: {e}")
        vector_index = vector_client.create_index(INDEX_NAME, index_key_bytes, {"dimension": 768})

# ==================================================
# HELPERS
# ==================================================

def encrypt_metadata(metadata: dict) -> str:
    json_str = json.dumps(metadata)
    return cipher_suite.encrypt(json_str.encode()).decode()

def decrypt_metadata(token: str) -> dict:
    try:
        json_str = cipher_suite.decrypt(token.encode()).decode()
        return json.loads(json_str)
    except Exception as e:
        logger.warning(f"Metadata decryption failed: {e}")
        return {}

def call_local_llm(prompt, expect_json=False):
    try:
        payload = {"model": LOCAL_MODEL, "prompt": prompt, "stream": False, "format": "json" if expect_json else ""}
        res = requests.post(OLLAMA_URL, json=payload, timeout=20)
        res.raise_for_status()
        text = res.json().get("response", "")
        if expect_json:
            text = text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        return text
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return {} if expect_json else "Error generating insight."

def synthesize_answer(query, encounters):
    # Cache synthesis to reduce repeated LLM calls
    cache_key = f"synthesis:{hashlib.sha256(query.encode()).hexdigest()}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    prompt = (
        f"Doctor asked: \"{query}\".\n"
        f"Consider these similar encounters:\n{json.dumps(encounters, indent=2)}\n\n"
        "Return a JSON with fields: summary, clinical_insights, management_outcomes, suggested_next_steps, similar_cases."
    )
    result = call_local_llm(prompt, expect_json=True)
    
    if result:
        redis_client.setex(cache_key, 3600, json.dumps(result))  # cache for 1 hour
    return result

def embed_query(query: str):
    """
    Generate vector embedding for the query using DeepSeek API
    """
    try:
        payload = {"model": LOCAL_MODEL, "prompt": query, "stream": False, "format": "vector"}
        res = requests.post(OLLAMA_URL, json=payload, timeout=10)
        res.raise_for_status()
        vector = res.json().get("response", [0.001]*768)
        if len(vector) != 768:
            vector = [0.001]*768
        return vector
    except Exception as e:
        logger.warning(f"Query embedding failed: {e}")
        return [0.001]*768

# ==================================================
# ROUTES
# ==================================================

@app.route("/search-advanced", methods=["POST"])
def search():
    try:
        data = request.json
        query = data.get("query")
        scope = data.get("scope", "global")
        requester_hospital = data.get("hospital_id")

        query_vector = embed_query(query)
        results = vector_index.query(query_vector, top_k=20)

        matches = []
        for r in results:
            meta = r.get('metadata', {})
            blob = meta.get("secure_blob")
            decrypted_meta = decrypt_metadata(blob) if blob else {}
            record_hospital = decrypted_meta.get("hospital_id")

            if scope == "local" and record_hospital != requester_hospital:
                continue

            eid = r['id'].replace("encounter:", "")
            full_data = redis_client.get(f"encounter:{eid}")
            if full_data:
                matches.append({
                    "encounter_id": eid,
                    "hospital_id": record_hospital,
                    "encounter": json.loads(full_data),
                    "score": float(r.get('score', 0.0))
                })

        final_matches = matches[:5]
        synthesis = synthesize_answer(query, final_matches)
        return jsonify({"matches": final_matches, "synthesis": synthesis})

    except Exception as e:
        logger.error(str(e))
        return jsonify({"error": str(e)}), 500

# ==================================================
# RUN SERVER
# ==================================================

if __name__ == "__main__":
    app.run(port=7000)