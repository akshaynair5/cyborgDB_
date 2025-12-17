
import cyborgdb
import time

from cyborgdb.openapi_client.models import IndexIVFFlatModel
import dotenv
dotenv.load_dotenv()
# Configuration
CYBORG_API_KEY = dotenv.get_key(dotenv.find_dotenv(), "CYBORGDB_API_KEY")
CYBORG_URL = "http://localhost:8000"
INDEX_NAME = "medsec-encounters"
FIXED_INDEX_KEY_HEX = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
index_key_bytes = bytes.fromhex(FIXED_INDEX_KEY_HEX)

client = cyborgdb.Client(CYBORG_URL, api_key=CYBORG_API_KEY)

def setup():
    print(f"[Setup] Connecting to CyborgDB at {CYBORG_URL}...")
    
    
    try:
        client.delete_index(INDEX_NAME)
        print(f"[Setup] Deleted old index: {INDEX_NAME}")
        time.sleep(1)
    except Exception:
        pass 

    
    print(f"[Setup] Creating new index: {INDEX_NAME}...")
    

    config_model = IndexIVFFlatModel(
        dimension=768,
        n_lists=100,
        metric="cosine"
    )
    
    try:

        client.create_index(INDEX_NAME, index_key_bytes, config_model)
        print(f"[Setup] ✅ SUCCESS: Index '{INDEX_NAME}' created!")
    except Exception as e:
        print(f"[Setup]  ERROR: Could not create index.")
        print(f"Reason: {e}")

if __name__ == "__main__":
    setup()