"""
MedSec: Real Encrypted Vector Search (Auto-Seeding Version)
Render / Production Safe
"""

from flask import Flask, request, jsonify
import os
import json
import logging
import time
import redis
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
from cryptography.fernet import Fernet
from flask_cors import CORS
import google.generativeai as genai
import cyborgdb
from cyborgdb.openapi_client.models import IndexIVFFlatModel
from load_demo_data import MOCK_DATA

# ==========================================================
# ENV + CONFIG
# ==========================================================
CONSORTIUM_KEY = os.environ.get(
    "CONSORTIUM_KEY",
    b"20siSj50fTPrCndwzj_Da45JlrN4vwDfT3GcsGYlYwQ="
)
cipher_suite = Fernet(CONSORTIUM_KEY)

BERT_MODEL_NAME = "emilyalsentzer/Bio_ClinicalBERT"
INDEX_NAME = os.environ.get("INDEX_NAME", "medsec-final-v4")

CYBORG_API_KEY = os.environ.get("CYBORGDB_API_KEY")
CYBORGDB_URL = os.environ.get("CYBORGDB_URL")
REDIS_URL = os.environ.get("REDIS_URL")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash"

if not all([CYBORG_API_KEY, CYBORGDB_URL, REDIS_URL, GEMINI_API_KEY]):
    raise RuntimeError("❌ Missing required environment variables")

# ==========================================================
# CLIENTS
# ==========================================================
vector_client = cyborgdb.Client(CYBORGDB_URL, api_key=CYBORG_API_KEY)
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel(GEMINI_MODEL)

# ==========================================================
# APP SETUP
# ==========================================================
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medsec")

# ==========================================================
# LOAD BERT (COLD START)
# ==========================================================
logger.info("⏳ Loading Bio_ClinicalBERT...")
tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL_NAME)
bert_model = AutoModel.from_pretrained(BERT_MODEL_NAME)
bert_model.eval()
logger.info("✅ Bio_ClinicalBERT loaded")

# ==========================================================
# HELPERS
# ==========================================================
def get_embedding(text: str):
    inputs = tokenizer(
        text,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=512
    )
    with torch.no_grad():
        outputs = bert_model(**inputs)

    embeddings = outputs.last_hidden_state
    mask = inputs["attention_mask"].unsqueeze(-1).float()
    pooled = (embeddings * mask).sum(1) / mask.sum(1).clamp(min=1e-9)

    vec = pooled[0].numpy()
    norm = np.linalg.norm(vec)
    return (vec / norm).tolist() if norm > 0 else vec.tolist()


def encrypt_metadata(meta: dict) -> str:
    return cipher_suite.encrypt(json.dumps(meta).encode()).decode()


def decrypt_metadata(token: str) -> dict:
    try:
        return json.loads(cipher_suite.decrypt(token.encode()).decode())
    except Exception:
        return {}

# ==========================================================
# DATABASE SETUP (SAFE)
# ==========================================================
INDEX_KEY_BYTES = bytes.fromhex(
    "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
)

logger.info(f"🔌 Connecting to index: {INDEX_NAME}")

try:
    vector_index = vector_client.get_index(INDEX_NAME)
    logger.info("✅ Existing index loaded")
except Exception:
    logger.info("⚠️ Index not found — creating & seeding")
    config = IndexIVFFlatModel(dimension=768, n_lists=1, metric="cosine")
    vector_index = vector_client.create_index(
        INDEX_NAME,
        INDEX_KEY_BYTES,
        config
    )

    for case in MOCK_DATA:
        redis_client.set(
            f"encounter:{case['encounter_id']}",
            json.dumps(case["payload"])
        )

        vec = get_embedding(
            f"{case['payload']['diagnosis']} {case['payload']['chief_complaint']}"
        )
        meta = encrypt_metadata({"hospital_id": case["hospital_id"]})

        vector_index.upsert([{
            "id": f"encounter:{case['encounter_id']}",
            "vector": vec,
            "metadata": {"secure_blob": meta}
        }])

    logger.info(f"🌱 Seeded {len(MOCK_DATA)} records")

# ==========================================================
# AI REASONING
# ==========================================================
def synthesize_answer(query, encounters):
    evidence = ""
    for i, e in enumerate(encounters):
        d = e["encounter"]
        evidence += (
            f"Case {i+1}: Diagnosis={d.get('diagnosis')} "
            f"Treatment={d.get('treatment')} "
            f"Outcome={d.get('outcome')} "
            f"Complaint={d.get('chief_complaint')}\n"
        )

    prompt = f"""
You are a Senior Clinical AI.

Doctor Query: "{query}"

Evidence:
{evidence}

Respond in exactly three sections:
[INSIGHTS]
[MANAGEMENT]
[NEXT_STEPS]
"""

    response = gemini_model.generate_content(prompt).text

    def extract(tag):
        return response.split(tag)[1].split("[", 1)[0].strip()

    return {
        "clinical_insights": extract("[INSIGHTS]"),
        "management_outcomes": extract("[MANAGEMENT]"),
        "suggested_next_steps": extract("[NEXT_STEPS]")
    }

# ==========================================================
# ROUTES
# ==========================================================
@app.route("/health")
def health():
    return {"status": "ok"}

@app.route("/upsert-encounter", methods=["POST"])
def upsert():
    d = request.json
    redis_client.set(
        f"encounter:{d['encounter_id']}",
        json.dumps(d["payload"])
    )

    vec = get_embedding(
        f"{d['payload']['diagnosis']} {d['payload']['chief_complaint']}"
    )
    meta = encrypt_metadata({"hospital_id": d["hospital_id"]})

    vector_index.upsert([{
        "id": f"encounter:{d['encounter_id']}",
        "vector": vec,
        "metadata": {"secure_blob": meta}
    }])

    return jsonify({"status": "stored"})

@app.route("/search-advanced", methods=["POST"])
def search():
    d = request.json
    q_vec = get_embedding(d["query"])
    results = vector_index.query(q_vec, top_k=10)

    matches = []
    for r in results:
        meta = decrypt_metadata(r["metadata"]["secure_blob"])
        eid = r["id"].replace("encounter:", "")
        payload = redis_client.get(f"encounter:{eid}")
        if payload:
            matches.append({
                "encounter_id": eid,
                "hospital_id": meta.get("hospital_id"),
                "encounter": json.loads(payload),
                "score": float(r.get("score", 0.0))
            })

    return jsonify({
        "matches": matches[:5],
        "synthesis": synthesize_answer(d["query"], matches[:5])
    })

# ==========================================================
# ENTRYPOINT
# ==========================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7000)
