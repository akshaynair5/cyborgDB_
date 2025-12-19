"""
MedSec: Real Encrypted Vector Search (Auto-Seeding Version) - Optimized for Python 3.13
"""
import os
import json
import time
import logging
import dotenv
import numpy as np
import torch
import redis
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModel
from cryptography.fernet import Fernet
import cyborgdb 
from cyborgdb.openapi_client.models import IndexIVFFlatModel
from google import genai  # Modern Python 3.13 SDK
from load_demo_data import MOCK_DATA

# ================= CONFIG & ENV =================
dotenv.load_dotenv()

CONSORTIUM_KEY = os.environ.get(
    "CONSORTIUM_KEY",
    b'20siSj50fTPrCndwzj_Da45JlrN4vwDfT3GcsGYlYwQ='
)
cipher_suite = Fernet(CONSORTIUM_KEY)

BERT_MODEL_NAME = "emilyalsentzer/Bio_ClinicalBERT"
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
# Using 2.0-Flash (Stable and fast for clinical reasoning)
GEMINI_MODEL_ID = "gemini-2.0-flash" 
genai_client = genai.Client(api_key=GEMINI_API_KEY)

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medsec-bio")

# 1. AI MODEL LOADING (BERT)
logger.info("⏳ Loading Bio_ClinicalBERT...")
try:
    tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL_NAME)
    bert_model = AutoModel.from_pretrained(BERT_MODEL_NAME)
    bert_model.eval()
    logger.info("✅ Bio_ClinicalBERT Ready.")
except Exception as e:
    logger.error(f"❌ Failed to load BERT: {e}")
    exit(1)

# 2. HELPER FUNCTIONS
def get_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = bert_model(**inputs)
    embeddings = outputs.last_hidden_state
    mask = inputs['attention_mask'].unsqueeze(-1).expand(embeddings.size()).float()
    mean_pooled = torch.sum(embeddings * mask, 1) / torch.clamp(mask.sum(1), min=1e-9)
    
    vector_np = mean_pooled[0].numpy()
    norm = np.linalg.norm(vector_np)
    if norm > 0: vector_np = vector_np / norm
    return vector_np.tolist()

def encrypt_metadata(metadata):
    return cipher_suite.encrypt(json.dumps(metadata).encode()).decode()

def decrypt_metadata(token):
    try: 
        return json.loads(cipher_suite.decrypt(token.encode()).decode())
    except Exception: 
        return {}

# 3. AUTO-SEEDING FUNCTION
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

# 4. DATABASE INITIALIZATION
logger.info(f"🔌 Connecting to Index: {INDEX_NAME}...")
try:
    # Fresh start for demo purposes
    try:
        vector_client.delete_index(INDEX_NAME)
        time.sleep(1)
    except Exception: pass

    config = IndexIVFFlatModel(dimension=768, n_lists=1, metric="cosine")
    vector_index = vector_client.create_index(INDEX_NAME, index_key_bytes, config)
    seed_database(vector_index)
except Exception as e:
    logger.error(f"❌ CRITICAL DATABASE ERROR: {e}")
    exit(1)

# 5. REASONING ENGINE
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
        # Modern SDK Call
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

# 6. ROUTES
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
            
            # Scope filtering
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

if __name__ == "__main__":
    app.run(port=5000, debug=False)