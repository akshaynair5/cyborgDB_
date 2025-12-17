import requests


encounter_id = "101" 

data = {
    "encounter_id": encounter_id,
    "hospital_id": "HOSP_A",
    "payload": {
        "encounter_date": "2024-12-15",
        "chief_complaint": "Severe chest pain",
        "diagnosis": "Acute Myocardial Infarction",
        "treatment": "Angioplasty and Stenting",
        "outcome": "Recovered, discharged in 3 days"
    }
}


r = requests.post("http://localhost:7000/upsert-encounter", json=data)
print(r.json())