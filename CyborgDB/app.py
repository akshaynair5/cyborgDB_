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

from google import genai
from huggingface_hub import InferenceClient

from load_demo_data import MOCK_DATA

# ================= CONFIG =================
dotenv.load_dotenv()

CONSORTIUM_KEY = os.environ.get(
    "CONSORTIUM_KEY",
    b'20siSj50fTPrCndwzj_Da45JlrN4vwDfT3GcsGYlYwQ='
)
cipher_suite = Fernet(CONSORTIUM_KEY)

INDEX_NAME = os.environ.get("INDEX_NAME", "medsec-final-v4")
CYBORG_API_KEY = os.environ.get("CYBORGDB_API_KEY")
CYBORGDB_URL = os.environ.get("CYBORGDB_URL")
REDIS_URL = os.environ.get("REDIS_URL")
HF_TOKEN = os.environ.get("HF_TOKEN")

if not all([CYBORG_API_KEY, CYBORGDB_URL, REDIS_URL, HF_TOKEN]):
    raise RuntimeError("❌ Missing required environment variables")

# ================= CLIENTS =================
vector_client = cyborgdb.Client(CYBORGDB_URL, api_key=CYBORG_API_KEY)
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

hf_client = InferenceClient(
    provider="hf-inference",
    api_key=HF_TOKEN
)

# Gemini
genai_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
GEMINI_MODEL_ID = "gemini-2.0-flash"

# Flask
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medsec")

# ================= EMBEDDINGS (ClinicalBERT Hosted) =================
logger.info("🌐 Using hosted ClinicalBERT via Hugging Face")

def get_embedding(text: str) -> list[float]:
    """
    ClinicalBERT embeddings using HF feature-extraction
    Output dimension: 768
    """
    vectors = hf_client.feature_extraction(
        model="medicalai/ClinicalBERT",
        text=text
    )

    # Mean pooling
    arr = np.array(vectors)
    pooled = arr.mean(axis=0)

    # Normalize for cosine similarity
    pooled /= np.linalg.norm(pooled)

    return pooled.tolist()

# ================= SECURITY =================
def encrypt_metadata(metadata):
    return cipher_suite.encrypt(json.dumps(metadata).encode()).decode()

def decrypt_metadata(token):
    try:
        return json.loads(cipher_suite.decrypt(token.encode()).decode())
    except Exception:
        return {}

# ================= DATABASE SETUP =================
logger.info("🔌 Initializing Vector Index...")

try:
    try:
        vector_client.delete_index(INDEX_NAME)
        time.sleep(1)
    except Exception:
        pass

    index_key_bytes = bytes.fromhex(
        "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
    )

    config = IndexIVFFlatModel(
        dimension=768,     # ClinicalBERT output
        n_lists=1,
        metric="cosine"
    )

    vector_index = vector_client.create_index(
        INDEX_NAME,
        index_key_bytes,
        config
    )
except Exception as e:
    logger.error(f"❌ Index init failed: {e}")
    raise

# ================= AUTO SEED =================
def seed_database():
    logger.info("🌱 Seeding clinical dataset...")
    for case in MOCK_DATA:
        text = f"{case['payload']['diagnosis']} {case['payload']['chief_complaint']}"
        vec = get_embedding(text)

        redis_client.set(
            f"encounter:{case['encounter_id']}",
            json.dumps(case["payload"])
        )

        vector_index.upsert([{
            "id": f"encounter:{case['encounter_id']}",
            "vector": vec,
            "metadata": {
                "secure_blob": encrypt_metadata({
                    "hospital_id": case["hospital_id"]
                })
            }
        }])

    logger.info("✅ Database seeded")

seed_database()

# ================= ROUTES =================
@app.route("/upsert-encounter", methods=["POST"])
def upsert():
    d = request.json
    text = f"{d['payload']['diagnosis']} {d['payload']['chief_complaint']}"

    vec = get_embedding(text)
    redis_client.set(f"encounter:{d['encounter_id']}", json.dumps(d["payload"]))

    vector_index.upsert([{
        "id": f"encounter:{d['encounter_id']}",
        "vector": vec,
        "metadata": {
            "secure_blob": encrypt_metadata({"hospital_id": d["hospital_id"]})
        }
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
        if d.get("scope") == "local" and meta["hospital_id"] != d["hospital_id"]:
            continue

        eid = r["id"].replace("encounter:", "")
        payload = redis_client.get(f"encounter:{eid}")

        if payload:
            matches.append({
                "encounter_id": eid,
                "hospital_id": meta["hospital_id"],
                "encounter": json.loads(payload),
                "score": r.get("score", r.get("distance", 0))
            })

    return jsonify({"matches": matches[:5]})