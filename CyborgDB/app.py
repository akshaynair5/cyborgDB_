"""
Clinical Semantic Search Microservice
-------------------------------------

Purpose:
- Store anonymized clinical encounters as semantic vectors
- Enable natural-language similarity search across hospitals
- Synthesize clinician-friendly insights using LLMs
- Preserve patient & hospital anonymity

Tech:
- Flask
- Redis (anonymized structured storage)
- CyborgDB (vector similarity search)
- LLMs for summarization + reasoning (pluggable)

This service operates independently of the primary backend.
"""

from flask import Flask, request, jsonify
import requests
import redis
import json
import logging
import os
from typing import Dict, Any, List, Optional
import math
from datetime import datetime, timedelta
import uuid
import time
from google import genai

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

gemini_client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# ==================================================
# HELPER FUNCTIONS d
# ==================================================
def call_gemini_llm(
    prompt: str,
    temperature: float = 0.2,
    max_output_tokens: int = 1024,
    expect_json: bool = False
) -> str | Dict[str, Any]:
    """
    Calls Gemini API safely and optionally enforces JSON output.
    """
    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "temperature": temperature,
                "max_output_tokens": max_output_tokens,
                "response_mime_type": "application/json" if expect_json else "text/plain"
            }
        )

        text = response.text.strip()

        if expect_json:
            return json.loads(text)

        return text

    except Exception as e:
        logger.exception("Gemini LLM call failed")
        raise RuntimeError(f"LLM error: {str(e)}")

def parse_possible_date(encounter: Dict[str, Any]) -> Optional[datetime]:
    """
    Extract and parse date from encounter data.
    Tries multiple common field names for encounter date.
    
    Returns:
        datetime object if found, None otherwise
    """
    possible_fields = [
        "encounter_date",
        "admission_date", 
        "visit_date",
        "timestamp",
        "created_at",
        "date"
    ]
    
    for field in possible_fields:
        if field in encounter:
            date_val = encounter[field]
            try:
                # Handle ISO format strings
                if isinstance(date_val, str):
                    return datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                # Handle unix timestamps
                elif isinstance(date_val, (int, float)):
                    return datetime.fromtimestamp(date_val)
            except (ValueError, OSError):
                continue
    
    return None


def temporal_decay_factor(
    encounter_date: Optional[datetime],
    half_life_days: float = 365.0
) -> float:
    """
    Calculate exponential decay factor based on how old the encounter is.
    More recent encounters get higher weight.
    
    Args:
        encounter_date: Date of the encounter
        half_life_days: Number of days for weight to decay to 0.5
    
    Returns:
        Decay factor between 0 and 1 (1 = most recent)
    """
    if encounter_date is None:
        return 1.0  # No date info, assume recent
    
    age_days = (datetime.now() - encounter_date).days
    
    # Exponential decay: factor = 0.5^(age/half_life)
    decay = math.pow(0.5, age_days / half_life_days)
    
    return max(0.01, min(1.0, decay))  # Clamp between 0.01 and 1.0


def calibrate_confidence(similarity_score: float) -> Dict[str, Any]:
    """
    Convert raw similarity score to calibrated confidence levels
    with clinical decision support guidance.
    
    Args:
        similarity_score: Raw similarity score (typically 0-1)
    
    Returns:
        Dictionary with confidence level and interpretation
    """
    # Calibration thresholds based on clinical utility
    if similarity_score >= 0.85:
        level = "high"
        interpretation = "Strong similarity - high confidence in relevance"
        clinical_guidance = "Consider as primary reference"
    elif similarity_score >= 0.70:
        level = "moderate"
        interpretation = "Moderate similarity - useful reference"
        clinical_guidance = "Review carefully for applicability"
    elif similarity_score >= 0.55:
        level = "low"
        interpretation = "Low similarity - consider with caution"
        clinical_guidance = "May provide limited insight"
    else:
        level = "very_low"
        interpretation = "Minimal similarity - likely not relevant"
        clinical_guidance = "Use only for broad context"
    
    return {
        "level": level,
        "score": round(similarity_score, 3),
        "interpretation": interpretation,
        "clinical_guidance": clinical_guidance
    }


def rank_differential_diagnoses(matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyze matched encounters and rank differential diagnoses
    based on frequency and similarity scores.
    
    Args:
        matches: List of matched encounters with scores
    
    Returns:
        Ranked list of differential diagnoses with statistics
    """
    diagnosis_stats = {}
    
    for match in matches:
        encounter = match.get("encounter", {})
        score = match.get("weighted_score", 0)
        
        # Extract diagnoses from various possible fields
        diagnoses = []
        if "diagnosis" in encounter:
            diagnoses.append(encounter["diagnosis"])
        if "diagnoses" in encounter:
            if isinstance(encounter["diagnoses"], list):
                diagnoses.extend(encounter["diagnoses"])
            else:
                diagnoses.append(encounter["diagnoses"])
        if "final_diagnosis" in encounter:
            diagnoses.append(encounter["final_diagnosis"])
        
        # Aggregate statistics per diagnosis
        for dx in diagnoses:
            if not dx or dx == "unknown":
                continue
                
            dx_clean = str(dx).strip().lower()
            
            if dx_clean not in diagnosis_stats:
                diagnosis_stats[dx_clean] = {
                    "diagnosis": dx,
                    "count": 0,
                    "total_score": 0.0,
                    "max_score": 0.0,
                    "encounter_ids": []
                }
            
            diagnosis_stats[dx_clean]["count"] += 1
            diagnosis_stats[dx_clean]["total_score"] += score
            diagnosis_stats[dx_clean]["max_score"] = max(
                diagnosis_stats[dx_clean]["max_score"], 
                score
            )
            diagnosis_stats[dx_clean]["encounter_ids"].append(
                match.get("encounter_id")
            )
    
    # Calculate composite ranking score
    ranked = []
    for dx_key, stats in diagnosis_stats.items():
        # Composite score: frequency + average similarity + max similarity
        avg_score = stats["total_score"] / stats["count"]
        composite = (
            stats["count"] * 0.4 +  # Frequency weight
            avg_score * 10.0 * 0.4 +  # Average similarity weight
            stats["max_score"] * 10.0 * 0.2  # Max similarity weight
        )
        
        ranked.append({
            "diagnosis": stats["diagnosis"],
            "count": stats["count"],
            "average_similarity": round(avg_score, 3),
            "max_similarity": round(stats["max_score"], 3),
            "composite_score": round(composite, 3),
            "encounter_ids": stats["encounter_ids"]
        })
    
    # Sort by composite score
    ranked.sort(key=lambda x: x["composite_score"], reverse=True)
    
    return ranked


def hallucination_guard(
    synthesis: Dict[str, Any],
    source_matches: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Validate LLM synthesis against source encounters to detect
    potential hallucinations or unsupported claims.
    
    Args:
        synthesis: LLM-generated synthesis response
        source_matches: Original matched encounters
    
    Returns:
        Validation report with pass/fail and specific concerns
    """
    concerns = []
    warnings = []
    
    # Extract claimed matches from synthesis
    claimed_matches = synthesis.get("summary", {}).get("matches_found", 0)
    actual_matches = len(source_matches)
    
    # Check 1: Match count consistency
    if claimed_matches != actual_matches:
        concerns.append(
            f"Claimed {claimed_matches} matches but {actual_matches} provided"
        )
    
    # Check 2: Similar cases referenced
    similar_cases = synthesis.get("similar_cases", [])
    valid_encounter_ids = {m["encounter_id"] for m in source_matches}
    
    for case in similar_cases:
        case_id = case.get("encounter_id")
        if case_id not in valid_encounter_ids:
            concerns.append(
                f"Referenced non-existent encounter: {case_id}"
            )
    
    # Check 3: Confidence level validation
    confidence = synthesis.get("summary", {}).get("confidence", "")
    if confidence == "high" and actual_matches < 3:
        warnings.append(
            "High confidence claimed with fewer than 3 matches"
        )
    
    # Check 4: Numerical consistency
    if actual_matches == 0:
        if synthesis.get("clinical_insights") or synthesis.get("management_outcomes"):
            concerns.append(
                "Generated insights with no matching encounters"
            )
    
    # Check 5: Verify diagnoses mentioned exist in sources
    insights = synthesis.get("clinical_insights", [])
    source_diagnoses = set()
    for match in source_matches:
        encounter = match.get("encounter", {})
        if "diagnosis" in encounter:
            source_diagnoses.add(str(encounter["diagnosis"]).lower())
        if "diagnoses" in encounter:
            dx_list = encounter["diagnoses"]
            if isinstance(dx_list, list):
                source_diagnoses.update(str(d).lower() for d in dx_list)
    
    # Simple keyword check for diagnosis mentions in insights
    for insight in insights:
        insight_text = str(insight).lower()
        # Look for specific medical terms that should be grounded
        if any(term in insight_text for term in ["diagnosed", "diagnosis"]):
            has_match = any(dx_term in insight_text for dx_term in source_diagnoses)
            if not has_match and source_diagnoses:
                warnings.append(
                    f"Insight mentions diagnosis not found in sources: {insight[:50]}..."
                )
    
    # Determine pass/fail
    passes = len(concerns) == 0
    risk_level = "low" if passes and len(warnings) == 0 else (
        "medium" if passes else "high"
    )
    
    return {
        "passes": passes,
        "risk_level": risk_level,
        "concerns": concerns,
        "warnings": warnings,
        "recommendation": (
            "Safe to present to clinician" if passes 
            else "Review carefully - potential hallucinations detected"
        ),
        "source_match_count": actual_matches
    }


def audit_log(
    action: str,
    user_id: Optional[str],
    request_data: Dict[str, Any],
    result_summary: Dict[str, Any]
) -> str:
    """
    Create audit log entry for compliance and quality monitoring.
    Writes to Redis with expiration.
    
    Args:
        action: Action type (e.g., "search_advanced")
        user_id: User identifier (can be None)
        request_data: Original request parameters
        result_summary: Summary of results returned
    
    Returns:
        Audit entry ID
    """
    audit_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    audit_entry = {
        "audit_id": audit_id,
        "timestamp": timestamp,
        "action": action,
        "user_id": user_id or "anonymous",
        "request": {
            "query": request_data.get("query", ""),
            "specialty": request_data.get("specialty"),
            "hospital_ids": request_data.get("hospital_ids", []),
            "top_k": request_data.get("top_k")
        },
        "result": result_summary
    }
    
    # Store in Redis with 90-day expiration
    redis_key = f"audit:{audit_id}"
    redis_client.setex(
        redis_key,
        timedelta(days=90),
        json.dumps(audit_entry)
    )
    
    logger.info(f"Audit log created: {audit_id} for action {action}")
    
    return audit_id

# ==================================================
# CONFIGURATION
# ==================================================

CYBORG_URL = os.getenv("CYBORG_URL", "http://localhost:8000/v1")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

VECTOR_TIMEOUT = 5
DEFAULT_TOP_K = 5

# ==================================================
# APP INITIALIZATION
# ==================================================

app = Flask(__name__)

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    decode_responses=True
)

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s"
)

    # -------------------------------
    # Helpers: date parsing, temporal weighting, redaction
    # -------------------------------
logger = logging.getLogger("clinical-search")

# ==================================================
# LLM + EMBEDDING ABSTRACTIONS
# ==================================================

def generate_clinical_summary(encounter: Dict[str, Any]) -> str:
    prompt = f"""
Convert the following medical encounter into ONE anonymized
clinical summary paragraph.

Rules:
- No patient identifiers
- No hospital identifiers
- Focus on symptoms, exam findings, labs, imaging, diagnosis,
  treatment, and outcome
- Use formal medical language

DATA:
{json.dumps(encounter, indent=2)}
"""
    return call_gemini_llm(
        prompt,
        temperature=0.1,
        max_output_tokens=512
    )



def embed_text(text: str) -> List[float]:
    """
    Converts text into an embedding vector.
    Must be consistent for both storage and querying.


    """

    # ---- REPLACE WITH REAL EMBEDDING PROVIDER ----
    return [0.001] * 768


def synthesize_clinical_answer(
    query: str,
    encounters: List[Dict[str, Any]]
) -> Dict[str, Any]:

    prompt = f"""
A doctor asked the following clinical question:

"{query}"

Below are anonymized clinical encounters with similar presentations.

Analyze them and return a structured medical response with:

1. Key shared clinical patterns
2. Diagnoses that were ultimately identified
3. Treatment outcomes
4. Practical next steps for management

Encounters:
{json.dumps(encounters, indent=2)}

Respond ONLY in valid JSON with keys:
summary, clinical_insights, management_outcomes,
suggested_next_steps, similar_cases
"""

    return call_gemini_llm(
        prompt,
        temperature=0.2,
        max_output_tokens=1500,
        expect_json=True
    )


# -------------------------------
# Specialty-aware prompt builder
# -------------------------------
def build_specialty_prompt(query: str, specialty: str = None) -> str:
    """Construct a specialty-aware LLM prompt. This keeps prompting consistent
    across specialties (e.g., infectious disease, cardiology, radiology) and
    can include specialty-specific instructions or evidence weighting.
    """
    base = f"Answer the clinical question concisely and cite supporting evidence from similar cases. Question: {query}\n"
    specialty_instructions = {
        "infectious": "Prioritize microbiology, travel history, febrile patterns, and platelet trends.",
        "cardiology": "Prioritize chest pain characteristics, ECGs, troponin trends, and hemodynamics.",
        "radiology": "Describe imaging findings, modality-specific sensitivity, and differential diagnoses.",
        "general": "Provide practical next steps, red flags, and conservative management when uncertain.",
    }
    instr = specialty_instructions.get((specialty or "").lower(), specialty_instructions["general"])
    return base + "Specialty instructions: " + instr


# -------------------------------
# Advanced search endpoint integrating all safety features
# -------------------------------
@app.route("/search-advanced", methods=["POST"])
def search_advanced():
    """Advanced semantic search endpoint with:
    - specialty-aware prompting
    - temporal weighting (recent cases prioritized)
    - confidence calibration
    - hallucination guard
    - differential diagnosis ranking
    - audit logging

    Request JSON keys (recommended):
      query: str
      hospital_ids: [str]
      top_k: int (optional)
      specialty: str (optional)
      user_id: str (optional, for audit)
      temporal_half_life_days: float (optional)

    Response: JSON with structured fields for UI rendering and audit id.
    """
    try:
        data = request.json or {}
        query_text = data.get("query")
        allowed_hospitals = set(data.get("hospital_ids") or [])
        top_k = int(data.get("top_k", DEFAULT_TOP_K))
        specialty = data.get("specialty")
        user_id = data.get("user_id")
        half_life_days = float(data.get("temporal_half_life_days", 365.0))

        if not query_text:
            return jsonify({"error": "Missing query"}), 400

        # build specialty prompt (placeholder for LLM call later)
        prompt = build_specialty_prompt(query_text, specialty)

        # embed and search
        q_vector = embed_text(prompt)
        raw_results = search_vectors(q_vector, top_k * 3)

        # collect and filter by hospital; compute temporal-weighted similarity
        filtered = []
        for res in raw_results:
            meta = res.get("metadata", {})
            if allowed_hospitals and meta.get("hospital_id") not in allowed_hospitals:
                continue
            encounter_id = res["id"].replace("encounter:", "")
            stored = redis_client.get(f"encounter:{encounter_id}")
            if not stored:
                continue
            enc = json.loads(stored)
            enc_date = parse_possible_date(enc)
            decay = temporal_decay_factor(enc_date, half_life_days)
            raw_score = float(res.get("score") or 0.0)
            weighted_score = raw_score * decay
            filtered.append({"encounter_id": encounter_id, "score": raw_score, "weighted_score": weighted_score, "encounter": enc})

        # sort by weighted_score
        filtered.sort(key=lambda x: x["weighted_score"], reverse=True)
        top_matches = filtered[:top_k]

        # calibrate confidence per match
        for m in top_matches:
            m["calibrated_confidence"] = calibrate_confidence(m["weighted_score"])

        # perform differential diagnosis ranking
        diffs = rank_differential_diagnoses(top_matches)

        # synthesize answer (placeholder LLM call)
        synthesis = synthesize_clinical_answer(query_text, top_matches)

        # hallucination guard
        guard = hallucination_guard(synthesis, top_matches)

        # build result summary for audit
        result_summary = {
            "query": query_text,
            "matches_returned": len(top_matches),
            "top_differentials": [d["diagnosis"] if isinstance(d, dict) else d for d in diffs[:5]],
            "guard_passes": guard.get("passes", False),
        }

        # write audit log asynchronously (best-effort)
        try:
            audit_log("search_advanced", user_id, data, result_summary)
        except Exception:
            logger.exception("Audit write failed")

        # prepare response payload
        response = {
            "synthesis": synthesis,
            "hallucination_guard": guard,
            "differential_ranking": diffs,
            "matches": top_matches,
            "metadata": {"prompt": prompt, "specialty": specialty},
        }

        return jsonify(response)

    except Exception as e:
        logger.exception("Advanced search failed")
        return jsonify({"error": str(e)}), 500

# ==================================================
# CYBORG HELPERS
# ==================================================

def upsert_vector(vector_id: str, vector: List[float], metadata: Dict[str, Any]):
    requests.post(
        f"{CYBORG_URL}/vectors/upsert",
        json={
            "id": vector_id,
            "vector": vector,
            "metadata": metadata
        },
        timeout=VECTOR_TIMEOUT
    ).raise_for_status()




def search_vectors(vector: List[float], top_k: int):
    res = requests.post(
        f"{CYBORG_URL}/search",
        json={"vector": vector, "top_k": top_k},
        timeout=VECTOR_TIMEOUT
    )
    res.raise_for_status()
    return res.json().get("results", [])

# ==================================================
# ROUTES
# ==================================================

@app.route("/upsert-encounter", methods=["POST"])
def upsert_encounter():
    """
    Idempotently stores or updates a final encounter snapshot.
    """

    try:
        data = request.json
        encounter_id = data["encounter_id"]
        hospital_id = data["hospital_id"]
        payload = data["payload"]

        logger.info(f"Upserting encounter {encounter_id}")

        summary = generate_clinical_summary(payload)
        vector = embed_text(summary)

        vector_id = f"encounter:{encounter_id}"

        upsert_vector(
            vector_id,
            vector,
            metadata={
                "hospital_id": hospital_id,
                "category": "encounter"
            }
        )

        redis_client.set(
            f"encounter:{encounter_id}",

            json.dumps(payload)
        )

        return jsonify({"status": "upserted", "vector_id": vector_id})

    except Exception as e:
        logger.exception("Upsert failed")
        return jsonify({"error": str(e)}), 500


@app.route("/search", methods=["POST"])
def search():
    """
    Natural-language semantic clinical search.
    """

    try:
        data = request.json
        query_text = data["query"]
        allowed_hospitals = set(data["hospital_ids"])
        top_k = data.get("top_k", DEFAULT_TOP_K)

        logger.info("Running semantic search")

        query_vector = embed_text(query_text)
        raw_results = search_vectors(query_vector, top_k)

        encounters = []

        for res in raw_results:
            meta = res.get("metadata", {})
            if meta.get("hospital_id") not in allowed_hospitals:
                continue

            encounter_id = res["id"].replace("encounter:", "")
            stored = redis_client.get(f"encounter:{encounter_id}")
            if not stored:
                continue

            encounters.append({
                "encounter_id": encounter_id,
                "score": res.get("score"),
                "encounter": json.loads(stored)
            })

        # ---- LLM SYNTHESIS (CRITICAL STEP) ----
        final_response = synthesize_clinical_answer(
            query_text,
            encounters
        )

        return jsonify(final_response)

    except Exception as e:
        logger.exception("Search failed")
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "clinical-semantic-search"
    })


# ==================================================
# ENTRYPOINT
# ==================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7000, debug=False)