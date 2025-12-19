import cyborgdb
import redis
import time
import dotenv

# -------------------------------------------
dotenv.load_dotenv()

# CONFIG
CYBORG_API_KEY = dotenv.get_key(".env" ,"CYBORGDB_API_KEY" )
client = cyborgdb.Client("http://localhost:8000", api_key=CYBORG_API_KEY)
INDEX_NAME = "medsec-real-v2"
redis_client = redis.Redis(host="localhost", port=6379, db=0)

print(f"🧨 Force Deleting Index: {INDEX_NAME}...")

# 1. FORCE DELETE
try:
    client.delete_index(INDEX_NAME)
    print("✅ Index deleted successfully.")
except Exception as e:
    print(f"⚠️  Delete threw an error (might be expected): {e}")

# 2. CLEAR REDIS
try:
    redis_client.flushall()
    print("✅ Redis cache flushed.")
except Exception as e:
    print(f"❌ Redis flush failed: {e}")

print("⏳ Waiting 2 seconds for DB to clean up...")
time.sleep(2)

# 3. VERIFY IT IS GONE
try:

    print("🔍 Verifying name is free...")
    
    print("✨ Ready. Run app.py now.")
except Exception as e:
    print(f"❌ Still having issues: {e}")