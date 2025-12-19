"""
MedSec: Real Encrypted Vector Search (Auto-Seeding Version)
"""
from flask import Flask, request, jsonify
import redis
import json
import logging
import requests
import torch
import numpy as np
import time
from transformers import AutoTokenizer, AutoModel
from cryptography.fernet import Fernet
import cyborgdb 
from flask_cors import CORS
from cyborgdb.openapi_client.models import IndexIVFFlatModel
import dotenv
import google.generativeai as genai
from load_demo_data import MOCK_DATA

# -------------------------------------------
dotenv.load_dotenv()

# CONFIGURATION
CONSORTIUM_KEY = b'20siSj50fTPrCndwzj_Da45JlrN4vwDfT3GcsGYlYwQ=' 
cipher_suite = Fernet(CONSORTIUM_KEY)
OLLAMA_BASE = "http://localhost:11434/api"
CHAT_MODEL = "deepseek-r1:1.5b"
BERT_MODEL_NAME = "emilyalsentzer/Bio_ClinicalBERT"

# DB CONNECT
CYBORG_API_KEY = dotenv.get_key(".env" ,"CYBORGDB_API_KEY" )
vector_client = cyborgdb.Client("http://localhost:8000", api_key=CYBORG_API_KEY)

# INDEX SETUP
INDEX_NAME = "medsec-final-v4" 
index_key_bytes = bytes.fromhex("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f")

redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

# --- GEMINI SETUP ---
GEMINI_MODEL = "gemini-2.5-flash" 
GEMINI_API_KEY = dotenv.get_key(".env", "GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)

gemini_model = genai.GenerativeModel(GEMINI_MODEL)

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
    try: return json.loads(cipher_suite.decrypt(token.encode()).decode())
    except: return {}

# 3. AUTO-SEEDING FUNCTION
def seed_database():
    logger.info("🌱 Seeding database with FULL Clinical Dataset from 'load_demo_data.py'...")
    
    count = 0
    for case in MOCK_DATA:
        try:
            redis_client.set(f"encounter:{case['encounter_id']}", json.dumps(case["payload"]))
            
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
            logger.error(f"❌ Failed to seed {case['encounter_id']}: {e}")
            
    logger.info(f"✨ Automatically seeded {count} patients into CyborgDB.")

# 4. DATABASE SETUP (With Auto-Seed Call)
logger.info(f"🔌 Connecting to Index: {INDEX_NAME}...")

# Wipe Old Data (For Fresh Demo)
try:
    vector_client.delete_index(INDEX_NAME)
    time.sleep(1)
    logger.info("   - Cleared existing index (Fresh Start).")
except Exception:
    pass

# Create New Index & Seed
try:
    config = IndexIVFFlatModel(dimension=768, n_lists=1, metric="cosine")
    vector_index = vector_client.create_index(INDEX_NAME, index_key_bytes, config)
    logger.info("✅ Created NEW empty index.")
    
    seed_database()
    
except Exception as e:
    logger.error(f"❌ CRITICAL DATABASE ERROR: {e}")
    exit(1)

# 5. CUMULATIVE REASONING ENGINE
def synthesize_answer(query, encounters):
    evidence_text = ""
    for i, e in enumerate(encounters):
        data = e.get('encounter', {})
        evidence_text += (
            f"Case {i+1}: [Diagnosis: {data.get('diagnosis')}] "
            f"[Treatment: {data.get('treatment')}] "
            f"[Outcome: {data.get('outcome')}] "
            f"[Complaint: {data.get('chief_complaint')}]\n"
        )

    prompt = (
        f"You are a Senior Clinical AI. \n"
        f"Doctor's Search Query: \"{query}\"\n\n"
        f"--- EVIDENCE FROM SIMILAR CASES ---\n"
        f"{evidence_text}\n"
        f"-----------------------------------\n\n"
        f"INSTRUCTIONS: \n"
        f"Analyze the evidence ABOVE cumulatively. Do NOT list cases individually. "
        f"Identify common patterns across the group. \n"
        f"Structure your response EXACTLY into these three plain-text sections (no markdown):\n\n"
        f"[INSIGHTS]\n"
        f"(Synthesize the most common diagnosis and shared symptoms. e.g., '80% of similar cases presented with...')\n\n"
        f"[MANAGEMENT]\n"
        f"(Summarize which treatments yielded the best positive outcomes.)\n\n"
        f"[NEXT_STEPS]\n"
        f"(Provide 3 specific clinical recommendations based on the successful outcomes above.)"
    )

    


    # --- OLLAMA (Local) 
    # try:
    #     print("Local LLM Active")
    #     res = requests.post(f"{OLLAMA_BASE}/generate", json={
    #         "model": CHAT_MODEL, "prompt": prompt, "stream": False
    #     }, timeout=60)
        
    #     full_text = res.json()["response"]
    #     if "</think>" in full_text: full_text = full_text.split("</think>")[-1]

    #     insights, management, next_steps = "Analysis pending.", "N/A", "Review cases."

    #     if "[INSIGHTS]" in full_text:
    #         parts = full_text.split("[INSIGHTS]")
    #         if len(parts) > 1: insights = parts[1].split("[MANAGEMENT]")[0].strip()
    #     if "[MANAGEMENT]" in full_text:
    #         parts = full_text.split("[MANAGEMENT]")
    #         if len(parts) > 1: management = parts[1].split("[NEXT_STEPS]")[0].strip()
    #     if "[NEXT_STEPS]" in full_text:
    #         parts = full_text.split("[NEXT_STEPS]")
    #         if len(parts) > 1: next_steps = parts[1].strip()

    #     def clean(text): return text.replace("**", "").replace("##", "").strip()
    # -----------------------------------------------------------
    try:
    
        print("Gemini LLM Active")
        response = gemini_model.generate_content(prompt)
        
        full_text = response.text

        insights, management, next_steps = "Analysis pending.", "N/A", "Review cases."

        if "[INSIGHTS]" in full_text:
            parts = full_text.split("[INSIGHTS]")
            if len(parts) > 1: insights = parts[1].split("[MANAGEMENT]")[0].strip()
        
        if "[MANAGEMENT]" in full_text:
            parts = full_text.split("[MANAGEMENT]")
            if len(parts) > 1: management = parts[1].split("[NEXT_STEPS]")[0].strip()
            
        if "[NEXT_STEPS]" in full_text:
            parts = full_text.split("[NEXT_STEPS]")
            if len(parts) > 1: next_steps = parts[1].strip()

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
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route("/search-advanced", methods=["POST"])
def search():
    try:
        d = request.json
        q_vec = get_embedding(d.get("query"))
        results = vector_index.query(q_vec, top_k=10)
        matches = []
        for r in results:
            meta = decrypt_metadata(r.get('metadata', {}).get("secure_blob"))
            if d.get("scope") == "local" and meta.get("hospital_id") != d.get("hospital_id"): continue
            
            eid = r['id'].replace("encounter:", "")
            full = redis_client.get(f"encounter:{eid}")
            if full:
                matches.append({
                    "encounter_id": eid, "hospital_id": meta.get("hospital_id"),
                    "encounter": json.loads(full), "score": float(r.get('score', r.get('distance', 0.0)))
                })
        
        final = matches[:5]
        return jsonify({"matches": final, "synthesis": synthesize_answer(d.get("query"), final)})
    except Exception as e: return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=7000)