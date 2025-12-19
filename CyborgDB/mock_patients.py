MOCK_DATA = [
    # --- CARDIOLOGY (Heart) ---
    {
        "encounter_id": "CARDIO_001",
        "hospital_id": "CITY_GEN_01",
        "payload": {
            "encounter_date": "2024-11-10",
            "chief_complaint": "Crushing substernal chest pain radiating to left arm and jaw, diaphoresis",
            "diagnosis": "Acute Myocardial Infarction (STEMI)",
            "treatment": "Emergency Coronary Angioplasty (PCI) with drug-eluting stent placement to LAD. Dual antiplatelet therapy (Aspirin + Clopidogrel), Heparin drip, and Atorvastatin 80mg loading dose.",
            "outcome": "ST-segment resolution post-PCI. Stable hemodynamics. Transferred to CCU."
        }
    },
    {
        "encounter_id": "CARDIO_002",
        "hospital_id": "CITY_GEN_01",
        "payload": {
            "encounter_date": "2024-11-12",
            "chief_complaint": "Progressive dyspnea on exertion, orthopnea, and bilateral pitting edema",
            "diagnosis": "Decompensated Congestive Heart Failure (CHF)",
            "treatment": "IV Furosemide (Lasix) 40mg BID for diuresis. Captopril initiation for afterload reduction. Oxygen supplementation via nasal cannula. Fluid restriction <1.5L/day.",
            "outcome": "Net negative fluid balance (-1.2L). Dyspnea improved. Discharged on oral diuretics."
        }
    },

    # --- NEUROLOGY (Brain) ---
    {
        "encounter_id": "NEURO_001",
        "hospital_id": "WEST_NEURO_05",
        "payload": {
            "encounter_date": "2024-12-01",
            "chief_complaint": "Severe unilateral throbbing headache preceded by scintillating scotoma (visual aura)",
            "diagnosis": "Migraine with Aura",
            "treatment": "Sumatriptan 100mg PO at onset. IV Metoclopramide for nausea. Ketorolac 30mg IV for refractory pain. Patient advised to rest in a dark, quiet environment.",
            "outcome": "Pain score reduced from 9/10 to 2/10 within 4 hours. Discharged with neurology follow-up."
        }
    },
    {
        "encounter_id": "NEURO_002",
        "hospital_id": "WEST_NEURO_05",
        "payload": {
            "encounter_date": "2024-12-05",
            "chief_complaint": "Witnessed generalized tonic-clonic seizure lasting >2 minutes followed by post-ictal confusion",
            "diagnosis": "Epilepsy (Grand Mal Seizure)",
            "treatment": "Lorazepam 4mg IV push for acute cessation. Levetiracetam (Keppra) 1000mg IV loading dose. MRI Brain ordered to rule out structural lesion.",
            "outcome": "No recurrence of seizure activity. Mental status returned to baseline after 1 hour."
        }
    },

    # --- RARE / ORPHAN DISEASES (The "Consortium Value" Cases) ---
    {
        "encounter_id": "RARE_001",
        "hospital_id": "PRINCE_HOSP_02",  # Different Hospital (Good for Global Search demo)
        "payload": {
            "encounter_date": "2024-12-08",
            "chief_complaint": "Recurrent unexplained abdominal pain, skin rash, and dark urine after starting antibiotics",
            "diagnosis": "Acute Intermittent Porphyria (AIP)",
            "treatment": "Discontinuation of precipitating medications. IV Hemin (Panhematin) infusion 3mg/kg daily for 4 days. High carbohydrate diet (glucose loading) to suppress heme synthesis.",
            "outcome": "Abdominal pain resolved. Urine color normalized. Genetic counseling referral provided."
        }
    },
    {
        "encounter_id": "RARE_002",
        "hospital_id": "PRINCE_HOSP_02",
        "payload": {
            "encounter_date": "2024-12-09",
            "chief_complaint": "Progressive muscle weakness, ptosis (droopy eyelids), and difficulty swallowing worsening at night",
            "diagnosis": "Myasthenia Gravis (Myasthenic Crisis)",
            "treatment": "Intravenous Immunoglobulin (IVIG) therapy 2g/kg over 5 days. Pyridostigmine (Mestinon) maintenance. Plasmapheresis scheduled if refractory to IVIG.",
            "outcome": "Respiratory function stabilized. Swallow study passed. Transferred to step-down unit."
        }
    },

    # --- ORTHOPEDICS (Bones) ---
    {
        "encounter_id": "ORTHO_001",
        "hospital_id": "TRAUMA_CTR_02",
        "payload": {
            "encounter_date": "2024-12-14",
            "chief_complaint": "Traumatic fall onto outstretched hand (FOOSH), gross deformity of right wrist",
            "diagnosis": "Distal Radius Fracture (Colles' Fracture)",
            "treatment": "Hematoma block with Lidocaine. Closed reduction under fluoroscopic guidance. Sugar-tong splint application. Post-reduction X-rays confirm alignment.",
            "outcome": "Neurovascularly intact. Referred to Ortho clinic for cast application in 1 week."
        }
    },
    {
        "encounter_id": "ORTHO_002",
        "hospital_id": "TRAUMA_CTR_02",
        "payload": {
            "encounter_date": "2024-12-15",
            "chief_complaint": "Inversion injury to left ankle during sports, lateral malleolus swelling",
            "diagnosis": "Grade 2 Anterior Talo-Fibular Ligament (ATFL) Sprain",
            "treatment": "Air-Stirrup ankle brace application. RICE protocol (Rest, Ice, Compression, Elevation). Weight bearing as tolerated with crutches.",
            "outcome": "Stable joint on anterior drawer test. Discharged with physical therapy referral."
        }
    },

    # --- INFECTIOUS DISEASE ---
    {
        "encounter_id": "INFECT_001",
        "hospital_id": "CITY_GEN_01",
        "payload": {
            "encounter_date": "2024-12-16",
            "chief_complaint": "Sudden high fever (39.5C), myalgia, dry cough, and severe fatigue",
            "diagnosis": "Influenza A (H3N2 Strain)",
            "treatment": "Oseltamivir (Tamiflu) 75mg BID for 5 days. Acetaminophen for antipyresis. Hydration therapy.",
            "outcome": "Fever curve trending down. Oxygen saturation maintained >98% on room air."
        }
    },
    {
        "encounter_id": "INFECT_002",
        "hospital_id": "CITY_GEN_01",
        "payload": {
            "encounter_date": "2024-12-17",
            "chief_complaint": "Severe nuchal rigidity (stiff neck), photophobia, and fever",
            "diagnosis": "Viral Meningitis (Enterovirus confirmed)",
            "treatment": "Lumbar Puncture performed (Result: Pleocytosis, Normal Glucose). IV Acyclovir started empirically then discontinued after HSV negative. Supportive analgesia.",
            "outcome": "Headache persisting but manageable. Neurologically intact. Admitted for observation."
        }
    }
]