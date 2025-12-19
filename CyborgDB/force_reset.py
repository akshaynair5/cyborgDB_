"""
MedSec – Force Reset Script (Render Compatible)
Deletes CyborgDB index and flushes Redis
"""

import os
import time
import redis
import cyborgdb
import dotenv

# -------------------------------------------
dotenv.load_dotenv()

# =========================
# ENVIRONMENT VARIABLES
# =========================
CYBORG_API_KEY = os.environ.get("CYBORGDB_API_KEY")
CYBORGDB_URL = os.environ.get("CYBORGDB_URL")   # e.g. http://cyborgdb-service:8000
REDIS_URL = os.environ.get("REDIS_URL")         # redis://red-xxxx:6379

INDEX_NAME = os.environ.get("INDEX_NAME", "medsec-final-v4")

if not CYBORG_API_KEY or not CYBORGDB_URL or not REDIS_URL:
    raise RuntimeError("❌ Missing required environment variables")

# =========================
# CLIENT SETUP
# =========================
print("🔌 Connecting to CyborgDB...")
client = cyborgdb.Client(
    CYBORGDB_URL,
    api_key=CYBORG_API_KEY
)

print("🔌 Connecting to Redis...")
redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True
)

# =========================
# FORCE DELETE INDEX
# =========================
print(f"\n🧨 Force Deleting Index: {INDEX_NAME}")

try:
    client.delete_index(INDEX_NAME)
    print("✅ CyborgDB index deleted successfully.")
except Exception as e:
    print(f"⚠️  Index delete warning (may already be gone): {e}")

# =========================
# CLEAR REDIS
# =========================
print("\n🧹 Clearing Redis cache...")
try:
    redis_client.flushall()
    print("✅ Redis cache flushed.")
except Exception as e:
    print(f"❌ Redis flush failed: {e}")

# =========================
# WAIT & FINISH
# =========================
print("\n⏳ Waiting 2 seconds for cleanup...")
time.sleep(2)

print("✨ Reset complete. You can safely redeploy or restart the app.")
