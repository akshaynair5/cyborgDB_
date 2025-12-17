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
CYBORG_API_KEY = "cyborg_093ee86b4ec04fcca20a9c6fca66a368"
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
# ROBUST INITIALIZATION
# ==================================================

# Try to connect to or create the index globally
try:
    # Attempt load
    vector_index = vector_client.load_index(INDEX_NAME, index_key=index_key_bytes)
    print(f"[MedSec] ✅ Connected to existing index: {INDEX_NAME}")
except Exception:
    print(f"[MedSec] ⚠️ Index not found. Creating new one...")
    try:
        # We try passing the config as a dictionary structured for the API
        config = {
            "ivfflat": {
                "dimension": 768,
                "n_lists": 100,
                "metric": "cosine"
            }
        }
        vector_index = vector_client.create_index(INDEX_NAME, index_key_bytes, config)
        print(f"[MedSec] ✅ Successfully created NEW index: {INDEX_NAME}")

    except Exception as e:
        print(f"CRITICAL: Index creation failed. Error: {e}")
        # Fallback to simple creation if complex config fails
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
    except Exception:
        return {}

def call_local_llm(prompt, expect_json=False):
    try:
        payload = {"model": LOCAL_MODEL, "prompt": prompt, "stream": False, "format": "json" if expect_json else ""}
        res = requests.post(OLLAMA_URL, json=payload)
        text = res.json().get("response", "")
        if expect_json:
            text = text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        return text
    except Exception:
        return {} if expect_json else "Error generating insight."

def synthesize_answer(query, encounters):
    prompt = f"""Doctor asked: "{query}". Similar cases: {json.dumps(encounters)}. Return JSON (summary, clinical_insights, management_outcomes, suggested_next_steps, similar_cases)."""
    return call_local_llm(prompt, expect_json=True)

# ==================================================
# ROUTES
# ==================================================

@app.route("/search-advanced", methods=["POST"])
def search():
    try:
        # Get parameters from Frontend
        data = request.json
        query = data.get("query")
        scope = data.get("scope", "global")          # "local" or "global"
        requester_hospital = data.get("hospital_id") # The doctor's hospital ID
        
        # 1. Fetch MORE results (top_k=20) so we have enough left after filtering
        results = vector_index.query([0.001]*768, top_k=20)
        
        matches = []
        for r in results:
            # Decrypt Metadata
            meta = r.get('metadata', {})
            blob = meta.get("secure_blob")
            decrypted_meta = {}
            
            if blob: 
                decrypted_meta = decrypt_metadata(blob)
            
            # --- FILTERING LOGIC (The Missing Piece) ---
            record_hospital = decrypted_meta.get("hospital_id")
            
            # If Scope is LOCAL, skip records from other hospitals
            if scope == "local" and record_hospital != requester_hospital:
                continue
            # -------------------------------------------

            eid = r['id'].replace("encounter:", "")
            full_data = redis_client.get(f"encounter:{eid}")
            
            if full_data: 
                matches.append({
                    "encounter_id": eid, 
                    "hospital_id": record_hospital, # IMPORTANT: Send this to UI for button color
                    "encounter": json.loads(full_data), 
                    "score": r.get('score', 0.0)
                })
                
        # Slice to top 5 AFTER filtering
        final_matches = matches[:5]
        
        synthesis = synthesize_answer(query, final_matches)
        return jsonify({
            "matches": final_matches, 
            "synthesis": synthesis
        })

    except Exception as e:
        logger.error(str(e))
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(port=7000)