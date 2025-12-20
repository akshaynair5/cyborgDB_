from flask import Flask, request, jsonify
import redis
import json
import logging
import time
from cryptography.fernet import Fernet
import cyborgdb
from flask_cors import CORS
from cyborgdb.openapi_client.models import IndexIVFFlatModel
import dotenv
from google import genai
from load_demo_data import MOCK_DATA
import os
import requests

# -------------------------------------------
dotenv.load_dotenv()

# =========================
# LOGGING
# =========================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medsec-autoembed")

# =========================
# CONFIG
# =========================
CONSORTIUM_KEY = b'20siSj50fTPrCndwzj_Da45JlrN4vwDfT3GcsGYlYwQ='
cipher_suite = Fernet(CONSORTIUM_KEY)

INDEX_NAME = os.getenv("INDEX_NAME", "medsec-final-v4")
INDEX_KEY_BYTES = bytes.fromhex(
    "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
)

CYBORG_API_KEY = os.getenv("CYBORGDB_API_KEY")
CYBORGDB_URL = os.getenv("CYBORGDB_URL")

REDIS_URL = os.getenv("REDIS_URL")

# =========================
# CLIENTS
# =========================
vector_client = cyborgdb.Client(CYBORGDB_URL, api_key=CYBORG_API_KEY)
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# =========================
# GEMINI
# =========================
genai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# =========================
# APP
# =========================
app = Flask(__name__)
CORS(app)

# =========================
# CYBORGDB REST
# =========================
HEADERS = {
    "X-API-Key": CYBORG_API_KEY,
    "Content-Type": "application/json"
}

def cyborgdb_upsert(items):
    payload = {
        "index_name": INDEX_NAME,
        "index_key": INDEX_KEY_BYTES.hex(),
        "items": items
    }

    headers = {
        "X-API-Key": CYBORG_API_KEY,
        "Content-Type": "application/json"
    }

    resp = requests.post(
        f"{CYBORGDB_URL}/v1/vectors/upsert",
        headers=headers,
        json=payload,
        timeout=120
    )

    if resp.status_code != 200:
        raise RuntimeError(resp.text)

    return resp.json()

def delete_index_rest(index_name: str, index_key: str):
    url = f"{CYBORGDB_URL}/v1/indexes/delete"

    resp = requests.post(
        url,
        headers=HEADERS,
        json={
            "index_name": index_name,
            "index_key": INDEX_KEY_BYTES.hex()
        },
        timeout=120
    )

    if resp.status_code == 200:
        logger.info("   - Cleared existing index")
    elif resp.status_code == 404:
        logger.info("   - No index to delete")
    else:
        raise RuntimeError(f"Delete index failed: {resp.text}")

def create_index_rest(index_name: str, index_key: str):
    url = f"{CYBORGDB_URL}/v1/indexes/create"

    resp = requests.post(
        url,
        headers=HEADERS,
        json={
            "index_name": index_name,
            "index_key": INDEX_KEY_BYTES.hex(),
            "embedding_model": "all-MiniLM-L6-v2",
            "index_config": {
                "type": "ivfflat"   
            }
        },
        timeout=120
    )

    if resp.status_code == 200:
        logger.info("✅ Index ready with auto-embedding")
    elif resp.status_code == 409:
        logger.info("✅ Index already exists")
    else:
        raise RuntimeError(f"Create index failed: {resp.text}")


# =========================
# SECURITY HELPERS
# =========================
def encrypt_metadata(metadata):
    return cipher_suite.encrypt(json.dumps(metadata).encode()).decode()

def decrypt_metadata(token):
    try:
        return json.loads(cipher_suite.decrypt(token.encode()).decode())
    except Exception:
        return {}

# =========================
# DB SETUP
# =========================
logger.info(f"🔌 Connecting to index: {INDEX_NAME}")

try:
    delete_index_rest(INDEX_NAME, INDEX_KEY_BYTES)
    time.sleep(1)
    logger.info("   - Cleared existing index")
except Exception:
    logger.info("   - No index to delete")

try:
    config = IndexIVFFlatModel(
        dimension=768,
        metric="cosine",
        embedding_model="sentence-transformers/all-mpnet-base-v2"
    )
    create_index_rest(INDEX_NAME, INDEX_KEY_BYTES)
    logger.info("✅ Index ready with auto-embedding")
except Exception as e:
    if "already exists" in str(e):
        logger.info("✅ Index already exists")
    else:
        raise

# =========================
# AUTO SEED
# =========================
def seed_database():
    logger.info("🌱 Seeding demo encounters...")
    batch = []

    for case in MOCK_DATA:
        text = f"{case['payload']['diagnosis']} {case['payload']['chief_complaint']}"
        meta = encrypt_metadata({"hospital_id": case["hospital_id"]})

        redis_client.set(
            f"encounter:{case['encounter_id']}",
            json.dumps(case["payload"])
        )

        batch.append({
            "id": f"encounter:{case['encounter_id']}",
            "contents": text,
            "metadata": {"secure_blob": meta}
        })

    cyborgdb_upsert(batch)
    logger.info(f"✨ Seeded {len(batch)} encounters")

seed_database()

# =========================
# REASONING
# =========================
def stringify_object_ids(obj):
    if isinstance(obj, dict):
        return {k: stringify_object_ids(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [stringify_object_ids(i) for i in obj]
    elif hasattr(obj, "__class__") and obj.__class__.__name__ == "ObjectId":
        return str(obj)
    else:
        return obj

def synthesize_answer(query, encounters):
    evidence = ""
    for i, e in enumerate(encounters):
        enc_data = e["encounter"]

        # Check if summary exists (new format)
        summary = enc_data.get("summary", {})
        raw = enc_data.get("raw_encounter", enc_data)  # fallback for old format

        # Use normalized summary if available, else fallback
        diagnosis = summary.get("diagnoses") or raw.get("diagnoses")
        treatment = raw.get("treatment") or "N/A"
        outcome = raw.get("outcome") or "N/A"
        chief_complaint = summary.get("chief_complaint") or raw.get("chief_complaint") or "-"

        # Convert diagnoses list to string if it's a list
        if isinstance(diagnosis, list):
            diagnosis = ", ".join(diagnosis)
        elif diagnosis is None:
            diagnosis = "N/A"

        evidence += (
            f"Case {i+1}: Diagnosis={diagnosis} "
            f"Treatment={treatment} "
            f"Outcome={outcome} "
            f"Complaint={chief_complaint}\n"
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
        res = genai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        text = res.text

        def extract(tag):
            return text.split(tag)[1].split("[", 1)[0].strip() if tag in text else "N/A"

        return {
            "clinical_insights": extract("[INSIGHTS]"),
            "management_outcomes": extract("[MANAGEMENT]"),
            "suggested_next_steps": extract("[NEXT_STEPS]")
        }

    except Exception as e:
        logger.error(e)
        return {
            "clinical_insights": "Unavailable",
            "management_outcomes": "N/A",
            "suggested_next_steps": "Manual review required"
        }

def normalize_encounter_with_gemini(encounter: dict) -> dict:
    prompt = f"""
You are a clinical data normalization engine.

Return ONLY valid JSON.
Do NOT include markdown.
Do NOT include explanations.

Required keys:
- narrative_summary
- diagnoses
- chief_complaint
- key_findings
- medications
- abnormal_labs
- imaging_findings
- plan_and_outcome

Encounter JSON:
{json.dumps(encounter, indent=2)}
"""

    try:
        res = genai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        text = res.text

        if not text:
            raise RuntimeError("Empty Gemini response")

        text = text.strip()

        if text.startswith("```"):
            text = text.split("```")[1]

        start = text.find("{")
        end = text.rfind("}")

        if start == -1 or end == -1:
            raise RuntimeError("No JSON object found")

        clean_json = text[start:end + 1]

        return json.loads(clean_json)

    except Exception as e:
        logger.error("Gemini normalization failed: %s", e)

        return {
            "narrative_summary": "",
            "diagnoses": [],
            "chief_complaint": encounter.get("chief_complaint", ""),
            "key_findings": "",
            "medications": [],
            "abnormal_labs": [],
            "imaging_findings": [],
            "plan_and_outcome": ""
        }
    
# =========================
# ROUTES
# =========================
@app.route("/upsert-encounter", methods=["POST"])
def upsert_encounter():
    raw_encounter = request.json

    encounter = stringify_object_ids(raw_encounter)

    encounter_id = encounter.get("_id") or encounter.get("encounter_id")
    hospital_id = encounter.get("hospital")

    if not encounter_id or not hospital_id:
        return jsonify({"error": "encounter_id or hospital_id missing"}), 400

    encounter["_id"] = str(encounter_id)
    encounter["hospital"] = str(hospital_id)

    # 1. Normalize using Gemini
    normalized = normalize_encounter_with_gemini(encounter)

    # 2. Store structured summary in Redis
    redis_client.set(
        f"encounter:{encounter_id}",
        json.dumps({
            "raw_encounter": encounter,
            "summary": normalized
        })
    )

    # 3. Build semantic text
    semantic_text = f"""
Chief Complaint:
{normalized.get('chief_complaint', '-')}

Diagnoses:
{", ".join(normalized.get("diagnoses", []))}

Key Findings:
{normalized.get("key_findings", "-")}

Medications:
{json.dumps(normalized.get("medications", []), indent=2)}

Abnormal Labs:
{json.dumps(normalized.get("abnormal_labs", []), indent=2)}

Imaging:
{json.dumps(normalized.get("imaging_findings", []), indent=2)}

Plan & Outcome:
{normalized.get("plan_and_outcome", "-")}
"""

    # 4. Encrypt metadata (🔥 FIXED)
    meta = encrypt_metadata({
        "hospital_id": hospital_id,
        "encounter_id": encounter_id
    })

    # 5. Upsert into CyborgDB (AUTO EMBEDDING)
    cyborgdb_upsert([{
        "id": f"encounter:{encounter_id}",
        "contents": semantic_text,
        "metadata": {
            "secure_blob": meta
        }
    }])

    return jsonify({
        "status": "stored",
        "encounter_id": encounter_id
    })

@app.route("/search-advanced", methods=["POST"])
def search():
    d = request.json
    query_text = d.get("query", "")

    # 1️⃣ Call CyborgDB REST API (AUTO-EMBED)
    resp = requests.post(
        f"{CYBORGDB_URL}/v1/vectors/query",
        headers={
            "Content-Type": "application/json",
            "X-API-Key": CYBORG_API_KEY
        },
        json={
            "index_name": INDEX_NAME,
            "index_key": INDEX_KEY_BYTES.hex(),
            "query_contents": query_text,  
            "top_k": 10,
            "include": ["distance", "metadata"]
        },
        timeout=120
    )

    if not resp.ok:
        return jsonify({
            "error": "Vector search failed",
            "details": resp.text
        }), 500

    results = resp.json().get("results", [])
    matches = []

    for r in results:
        meta_enc = r.get("metadata", {}).get("secure_blob")
        if not meta_enc:
            continue

        # 2️⃣ Decrypt metadata
        meta = decrypt_metadata(meta_enc)

        # 3️⃣ Scope filtering
        if d.get("scope") == "local":
            if meta.get("hospital_id") != d.get("hospital_id"):
                continue

        eid = r["id"].replace("encounter:", "")

        # 4️⃣ Fetch hydrated encounter from Redis
        enc_data = redis_client.get(f"encounter:{eid}")
        if not enc_data:
            continue

        enc_data = json.loads(enc_data)

        # 5️⃣ Flatten encounter: combine raw_encounter + summary for consistent format
        raw = enc_data.get("raw_encounter", enc_data)  # fallback for old format
        summary = enc_data.get("summary", {})
        flattened_encounter = {**raw, **summary}

        matches.append({
            "encounter_id": eid,
            "hospital_id": meta.get("hospital_id"),
            "encounter": flattened_encounter,
            "score": float(r.get("distance", 0))
        })

    # 6️⃣ Take top 5 matches
    final = matches[:5]

    # 7️⃣ Generate synthesis using the flattened encounters
    synthesis = synthesize_answer(query_text, final) if final else {}

    return jsonify({
        "matches": final,
        "synthesis": synthesis
    })

if __name__ == "__main__":
    app.run(port=7000)