from flask import Flask, request, jsonify
import redis
import json
import logging
import numpy as np
import time
from cryptography.fernet import Fernet
import cyborgdb
from flask_cors import CORS
from cyborgdb.openapi_client.models import IndexIVFFlatModel
import dotenv
import google.generativeai as genai
from load_demo_data import MOCK_DATA
import os
from huggingface_hub import InferenceClient

# -------------------------------------------
dotenv.load_dotenv()

# =========================
# LOGGING (MUST COME EARLY)
# =========================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medsec-hf")

# =========================
# CONFIG
# =========================
CONSORTIUM_KEY = b'20siSj50fTPrCndwzj_Da45JlrN4vwDfT3GcsGYlYwQ='
cipher_suite = Fernet(CONSORTIUM_KEY)

BERT_MODEL_NAME = "emilyalsentzer/Bio_ClinicalBERT"

HF_TOKEN = os.getenv("HF_TOKEN")

hf_client = InferenceClient(
    provider="hf-inference",
    api_key=HF_TOKEN
)

logger.info("✅ Hugging Face InferenceClient initialized")

INDEX_NAME = os.getenv("INDEX_NAME", "medsec-final-v4")
index_key_bytes = bytes.fromhex(
    "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
)

# =========================
# CLIENTS
# =========================
CYBORG_API_KEY = os.getenv("CYBORGDB_API_KEY")
CYBORGDB_URL = os.getenv("CYBORGDB_URL")
vector_client = cyborgdb.Client(CYBORGDB_URL, api_key=CYBORG_API_KEY)

REDIS_URL = os.getenv("REDIS_URL")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# =========================
# GEMINI
# =========================
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel(GEMINI_MODEL)

# =========================
# APP
# =========================
app = Flask(__name__)
CORS(app)

logger.info("✅ Using Hugging Face Hosted ClinicalBERT")

# =========================
# HELPERS
# =========================
def get_embedding(text: str):
    """
    Hugging Face Hosted Bio_ClinicalBERT
    Returns normalized 768-d vector
    """
    embeddings = hf_client.feature_extraction(
        model=BERT_MODEL_NAME,
        text=text
    )

    embeddings = np.array(embeddings)

    # HF returns [tokens, hidden] or [1, tokens, hidden]
    if embeddings.ndim == 3:
        embeddings = embeddings.mean(axis=1)[0]
    elif embeddings.ndim == 2:
        embeddings = embeddings.mean(axis=0)

    # Normalize
    norm = np.linalg.norm(embeddings)
    if norm > 0:
        embeddings = embeddings / norm

    return embeddings.tolist()


def encrypt_metadata(metadata):
    return cipher_suite.encrypt(json.dumps(metadata).encode()).decode()


def decrypt_metadata(token):
    try:
        return json.loads(cipher_suite.decrypt(token.encode()).decode())
    except Exception:
        return {}

# =========================
# AUTO SEED
# =========================
def seed_database():
    logger.info("🌱 Seeding database with Clinical demo data...")
    count = 0

    for case in MOCK_DATA:
        try:
            redis_client.set(
                f"encounter:{case['encounter_id']}",
                json.dumps(case["payload"])
            )

            text = f"{case['payload']['diagnosis']} {case['payload']['chief_complaint']}"
            vec = get_embedding(text)
            meta = encrypt_metadata({"hospital_id": case["hospital_id"]})

            vector_index.upsert([{
                "id": f"encounter:{case['encounter_id']}",
                "vector": vec,
                "metadata": {"secure_blob": meta}
            }])

            count += 1

        except Exception as e:
            logger.error(f"❌ Seed failed {case['encounter_id']}: {e}")

    logger.info(f"✨ Seeded {count} encounters.")

# =========================
# DB SETUP
# =========================
logger.info(f"🔌 Initializing index {INDEX_NAME}")

try:
    vector_client.delete_index(INDEX_NAME)
    time.sleep(1)
except Exception:
    pass

config = IndexIVFFlatModel(dimension=768, n_lists=1, metric="cosine")
vector_index = vector_client.create_index(INDEX_NAME, index_key_bytes, config)
seed_database()

# =========================
# REASONING
# =========================
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
You are a senior clinical AI.

Doctor Query: "{query}"

EVIDENCE:
{evidence}

Return exactly:
[INSIGHTS]
[MANAGEMENT]
[NEXT_STEPS]
"""

    try:
        response = gemini_model.generate_content(prompt)
        text = response.text

        def extract(tag):
            if tag in text:
                return text.split(tag)[1].split("[", 1)[0].strip()
            return "N/A"

        return {
            "clinical_insights": extract("[INSIGHTS]"),
            "management_outcomes": extract("[MANAGEMENT]"),
            "suggested_next_steps": extract("[NEXT_STEPS]")
        }

    except Exception as e:
        logger.error(e)
        return {}

# =========================
# ROUTES
# =========================
@app.route("/upsert-encounter", methods=["POST"])
def upsert():
    d = request.json
    redis_client.set(f"encounter:{d['encounter_id']}", json.dumps(d["payload"]))

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
        if d.get("scope") == "local" and meta.get("hospital_id") != d.get("hospital_id"):
            continue

        eid = r["id"].replace("encounter:", "")
        data = redis_client.get(f"encounter:{eid}")

        if data:
            matches.append({
                "encounter_id": eid,
                "hospital_id": meta.get("hospital_id"),
                "encounter": json.loads(data),
                "score": float(r.get("score", 0))
            })

    final = matches[:5]
    return jsonify({
        "matches": final,
        "synthesis": synthesize_answer(d["query"], final)
    })


if __name__ == "__main__":
    app.run(port=7000)