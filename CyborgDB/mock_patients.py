"""
MedSec: Synthetic Clinical Data for Hackathon Demo
Includes diverse cases to demonstrate semantic search capabilities.
"""

MOCK_DATA = [
    # --- CARDIOLOGY (Heart) ---
    {
        "encounter_id": "CARDIO_001",
        "hospital_id": "CITY_GEN_01",
        "payload": {
            "encounter_date": "2024-11-10",
            "chief_complaint": "Crushing chest pain radiating to left arm",
            "diagnosis": "Acute Myocardial Infarction (STEMI)",
            "treatment": "Emergency Angioplasty, Aspirin, Heparin",
            "outcome": "Stable, transferred to ICU"
        }
    },
    {
        "encounter_id": "CARDIO_002",
        "hospital_id": "CITY_GEN_01",
        "payload": {
            "encounter_date": "2024-11-12",
            "chief_complaint": "Shortness of breath and swelling in legs",
            "diagnosis": "Congestive Heart Failure (CHF)",
            "treatment": "Furosemide (Lasix), Oxygen therapy",
            "outcome": "Symptoms improved, fluid overload resolved"
        }
    },

    # --- NEUROLOGY (Brain) ---
    {
        "encounter_id": "NEURO_001",
        "hospital_id": "WEST_NEURO_05",
        "payload": {
            "encounter_date": "2024-12-01",
            "chief_complaint": "Sudden onset severe headache with visual aura",
            "diagnosis": "Migraine with Aura",
            "treatment": "Sumatriptan, Dark room rest",
            "outcome": "Headache resolved after 4 hours"
        }
    },
    {
        "encounter_id": "NEURO_002",
        "hospital_id": "WEST_NEURO_05",
        "payload": {
            "encounter_date": "2024-12-05",
            "chief_complaint": "Seizure activity lasting 2 minutes, confusion afterwards",
            "diagnosis": "Epilepsy (Grand Mal Seizure)",
            "treatment": "Lorazepam IV, Levetiracetam maintenance",
            "outcome": "Seizure stopped, patient post-ictal but stable"
        }
    },

    # --- PEDIATRICS (Kids) ---
    {
        "encounter_id": "PEDS_001",
        "hospital_id": "KIDS_HOPE_09",
        "payload": {
            "encounter_date": "2024-12-10",
            "chief_complaint": "7 year old boy with high fever and barking cough",
            "diagnosis": "Croup (Laryngotracheobronchitis)",
            "treatment": "Dexamethasone, Nebulized Epinephrine",
            "outcome": "Breathing improved, discharged home"
        }
    },
    {
        "encounter_id": "PEDS_002",
        "hospital_id": "KIDS_HOPE_09",
        "payload": {
            "encounter_date": "2024-12-11",
            "chief_complaint": "Child with wheezing and difficulty breathing after playing outside",
            "diagnosis": "Acute Asthma Exacerbation",
            "treatment": "Albuterol Nebulizer, Oral Steroids",
            "outcome": "Wheezing resolved, O2 sats 98%"
        }
    },

    # --- ORTHOPEDICS (Bones) ---
    {
        "encounter_id": "ORTHO_001",
        "hospital_id": "TRAUMA_CTR_02",
        "payload": {
            "encounter_date": "2024-12-14",
            "chief_complaint": "Fell from bike, severe pain in right forearm",
            "diagnosis": "Distal Radius Fracture",
            "treatment": "Closed Reduction and Casting",
            "outcome": "Alignment good, cast applied for 6 weeks"
        }
    },
    {
        "encounter_id": "ORTHO_002",
        "hospital_id": "TRAUMA_CTR_02",
        "payload": {
            "encounter_date": "2024-12-15",
            "chief_complaint": "Twisted ankle playing soccer, swelling",
            "diagnosis": "Grade 2 Ankle Sprain",
            "treatment": "RICE protocol (Rest, Ice, Compression, Elevation)",
            "outcome": "Discharged with crutches"
        }
    },

    # --- INFECTIOUS DISEASE ---
    {
        "encounter_id": "INFECT_001",
        "hospital_id": "CITY_GEN_01",
        "payload": {
            "encounter_date": "2024-12-16",
            "chief_complaint": "Fever, body aches, sore throat for 3 days",
            "diagnosis": "Influenza A",
            "treatment": "Oseltamivir (Tamiflu), Fluids",
            "outcome": "Recovering at home"
        }
    },
    {
        "encounter_id": "INFECT_002",
        "hospital_id": "CITY_GEN_01",
        "payload": {
            "encounter_date": "2024-12-17",
            "chief_complaint": "High fever, stiff neck, sensitivity to light",
            "diagnosis": "Viral Meningitis",
            "treatment": "Supportive care, monitoring, lumbar puncture",
            "outcome": "Headache persisting, admitted for observation"
        }
    }
]