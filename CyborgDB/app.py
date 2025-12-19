"""
MedSec: Real Encrypted Vector Search (Auto-Seeding Version) - Optimized for Python 3.13 with MiniLM
"""
import os
import json
import time
import logging
import dotenv
import numpy as np
import redis
from flask import Flask, request, jsonify
from flask_cors import CORS
from cryptography.fernet import Fernet
import cyborgdb 
from cyborgdb.openapi_client.models import IndexIVFFlatModel
from google import genai  # Modern Python 3.13 SDK
from load_demo_data import MOCK_DATA
from sentence_transformers import SentenceTransformer

# ================= CONFIG & ENV =================
dotenv.load_dotenv()

CONSORTIUM_KEY = os.environ.get(
    "CONSORTIUM_KEY",
    b'20siSj50fTPrCndwzj_Da45JlrN4vwDfT3GcsGYlYwQ='
)
cipher_suite = Fernet(CONSORTIUM_KEY)

INDEX_NAME = os.environ.get("INDEX_NAME", "medsec-final-v4")
CYBORG_API_KEY = os.environ.get("CYBORGDB_API_KEY")
CYBORGDB_URL = os.environ.get("CYBORGDB_URL")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# Vector DB Setup
vector_client = cyborgdb.Client(CYBORGDB_URL, api_key=CYBORG_API_KEY)
index_key_bytes = bytes.fromhex("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f")

# Redis Setup
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# --- MODERN GEMINI SETUP ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL_ID = "gemini-2.0-flash" 
genai_client = genai.Client(api_key=GEMINI_API_KEY)

# Flask App
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medsec-bio")

# ================= LOAD LIGHTWEIGHT EMBEDDING MODEL =================
logger.info("⏳ Loading sentence-transformers MiniLM model (lightweight)...")
try:
    embed_model = SentenceTransformer("all-MiniLM-L6-v2")  # ~90MB
    logger.info("✅ MiniLM model ready for embeddings.")
except Exception as e:
    logger.error(f"❌ Failed to load MiniLM: {e}")
    exit(1)

# ================= HELPERS =================
def get_embedding(text: str):
    vec = embed_model.encode(text, normalize_embeddings=True)
    return vec.tolist()

def encrypt_metadata(metadata):
    return cipher_suite.encrypt(json.dumps(metadata).encode()).decode()

def decrypt_metadata(token):
    try:
        return json.loads(cipher_suite.decrypt(token.encode()).decode())
    except Exception:
        return {}

# ================= AUTO-SEED DATABASE =================
def seed_database(v_index):
    logger.info("🌱 Seeding database with FULL Clinical Dataset...")
    count = 0
    for case in MOCK_DATA:
        try:
            redis_client.set(f"encounter:{case['encounter_id']}", json.dumps(case["payload"]))
            text = f"{case['payload']['diagnosis']} {case['payload']['chief_complaint']}"
            vec = get_embedding(text)
            meta = encrypt_metadata({"hospital_id": case["hospital_id"]})
            v_index.upsert([{
                "id": f"encounter:{case['encounter_id']}", 
                "vector": vec, 
                "metadata": {"secure_blob": meta}
            }])
            count += 1
        except Exception as e:
            logger.error(f"❌ Failed to seed {case['encounter_id']}: {e}")
    logger.info(f"✨ Successfully seeded {count} patients.")

# ================= DATABASE INITIALIZATION =================
logger.info(f"🔌 Connecting to Index: {INDEX_NAME}...")
try:
    try:
        vector_client.delete_index(INDEX_NAME)
        time.sleep(1)
    except Exception:
        pass

    config = IndexIVFFlatModel(dimension=384, n_lists=1, metric="cosine")  # MiniLM outputs 384-dim
    vector_index = vector_client.create_index(INDEX_NAME, index_key_bytes, config)
    seed_database(vector_index)
except Exception as e:
    logger.error(f"❌ CRITICAL DATABASE ERROR: {e}")
    exit(1)

# ================= REASONING ENGINE =================
def synthesize_answer(query, encounters):
    if not encounters:
        return {
            "clinical_insights": "No similar cases found in the encrypted database.",
            "management_outcomes": "N/A",
            "suggested_next_steps": "Expand search parameters or check local records."
        }

    evidence_text = "\n".join([
        f"Case {i+1}: [Diagnosis: {e['encounter'].get('diagnosis')}] [Treatment: {e['encounter'].get('treatment')}] [Outcome: {e['encounter'].get('outcome')}]"
        for i, e in enumerate(encounters)
    ])

    prompt = f"""You are a Senior Clinical AI.
Doctor's Search Query: "{query}"

--- EVIDENCE FROM SIMILAR CASES ---
{evidence_text}

INSTRUCTIONS:
Analyze the evidence ABOVE cumulatively. Identify common patterns.
Structure your response EXACTLY into these three sections:

[INSIGHTS]
(Synthesize common diagnoses/symptoms)

[MANAGEMENT]
(Summarize treatments with positive outcomes)

[NEXT_STEPS]
(Provide 3 specific clinical recommendations)"""

    try:
        response = genai_client.models.generate_content(
            model=GEMINI_MODEL_ID,
            contents=prompt
        )
        full_text = response.text
        insights, management, next_steps = "Analysis pending.", "N/A", "Review cases."

        if "[INSIGHTS]" in full_text:
            insights = full_text.split("[INSIGHTS]")[1].split("[MANAGEMENT]")[0].strip()
        if "[MANAGEMENT]" in full_text:
            management = full_text.split("[MANAGEMENT]")[1].split("[NEXT_STEPS]")[0].strip()
        if "[NEXT_STEPS]" in full_text:
            next_steps = full_text.split("[NEXT_STEPS]")[1].strip()

        def clean(text): return text.replace("**", "").replace("##", "").strip()
        return {
            "clinical_insights": clean(insights),
            "management_outcomes": clean(management),
            "suggested_next_steps": clean(next_steps)
        }
    except Exception as e:
        logger.error(f"LLM Error: {e}")
        return {"clinical_insights": "Error connecting to AI.", "management_outcomes": "N/A", "suggested_next_steps": "N/A"}

# ================= ROUTES =================
@app.route("/upsert-encounter", methods=["POST"])
def upsert():
    try:
        d = request.json
        redis_client.set(f"encounter:{d['encounter_id']}", json.dumps(d["payload"]))
        vec = get_embedding(f"{d['payload']['diagnosis']} {d['payload']['chief_complaint']}")
        meta = encrypt_metadata({"hospital_id": d["hospital_id"]})
        vector_index.upsert([{"id": f"encounter:{d['encounter_id']}", "vector": vec, "metadata": {"secure_blob": meta}}])
        return jsonify({"status": "stored"})
    except Exception as e: 
        return jsonify({"error": str(e)}), 500

@app.route("/search-advanced", methods=["POST"])
def search():
    try:
        d = request.json
        q_vec = get_embedding(d.get("query"))
        results = vector_index.query(q_vec, top_k=10)
        matches = []
        for r in results:
            secure_blob = r.get('metadata', {}).get("secure_blob")
            meta = decrypt_metadata(secure_blob)
            if d.get("scope") == "local" and meta.get("hospital_id") != d.get("hospital_id"):
                continue
            eid = r['id'].replace("encounter:", "")
            full_data = redis_client.get(f"encounter:{eid}")
            if full_data:
                matches.append({
                    "encounter_id": eid,
                    "hospital_id": meta.get("hospital_id"),
                    "encounter": json.loads(full_data),
                    "score": float(r.get('score', r.get('distance', 0.0)))
                })
        final_matches = matches[:5]
        synthesis = synthesize_answer(d.get("query"), final_matches)
        return jsonify({"matches": final_matches, "synthesis": synthesis})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================= ENTRYPOINT =================
if __name__ == "__main__":
    app.run(port=5000, debug=False)