import requests
import time
from mock_patients import MOCK_DATA

# Configuration
API_URL = "http://localhost:7000/upsert-encounter"

def load_data():
    print(f"🚀 Starting Bulk Upload of {len(MOCK_DATA)} patients...")
    print("-" * 50)
    
    success_count = 0
    
    for patient in MOCK_DATA:
        try:
            print(f"Processing {patient['encounter_id']} ({patient['payload']['diagnosis']})...", end=" ")
            
            # Send POST request to your Secure Backend
            response = requests.post(API_URL, json=patient)
            
            if response.status_code == 200:
                print("✅ Encrypted & Stored")
                success_count += 1
            else:
                print(f"❌ Failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            print("Make sure 'app_secure.py' is running!")
            return

    print("-" * 50)
    print(f"🎉 Upload Complete! Successfully stored {success_count}/{len(MOCK_DATA)} records.")
    print("Your demo is ready for the judges.")

if __name__ == "__main__":
    load_data()