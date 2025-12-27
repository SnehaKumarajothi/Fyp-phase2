import re

# --- MOCK DATA (Python equivalent of schemeData.ts) ---
schemes = [
    {
        "id": "tractor-loan", "name": "Tractor Loan Scheme", "nameTa": "டிராக்டர் கடன் திட்டம்",
        "description": "Government-backed tractor loan for small and medium farmers.",
        "descriptionTa": "சிறு மற்றும் நடுத்தர விவசாயிகளுக்கான அரசாங்க ஆதரவு டிராக்டர் கடன் திட்டம்.",
        "eligibility": ["Farmer", "Age 18-60", "Own Land"], "maxAmount": "₹5,00,000",
        "interestRate": "7.5% p.a.", "keywords": ["tractor", "farming", "agriculture", "விவசாயம்"],
        "formKey": "tractor-loan",
        "questions": [
            {"key": "land_size", "label": "நீங்கள் வைத்துள்ள நிலத்தின் அளவு என்ன?", "labelEn": "What is your land size?"},
        ],
    },
    {
        "id": "kcc-farmer", "name": "KCC Farmer Finance Scheme", "nameTa": "விவசாயி நிதி திட்டம் (KCC)",
        "description": "Financial support for farmers under the Kisan Credit Card program.",
        "descriptionTa": "கிசான் கடன் அட்டையின் கீழ் விவசாயிகளுக்கான நிதி உதவி.",
        "eligibility": ["Age: 18-60", "Farmer", "Cultivator"], "maxAmount": "₹3,00,000",
        "interestRate": "4.0% p.a.", 
        "keywords": ["kcc", "farmer finance", "விவசாயி", "credit card", "agriculture", "credit", "fertilizers"],
        "formKey": "kcc-farmer",
        "questions": [
            {"key": "farmSize", "label": "பண்ணையின் அளவு என்ன?", "labelEn": "What is your farm size?"},
        ],
    },
    # ... other schemes would go here
]

# --- MOCK MATCHER FUNCTION (Python equivalent of schemeMatcher.ts) ---
def get_matching_schemes(user_data, situation_text):
    """Mocks the RAG agent's scheme retrieval based on keywords and basic eligibility."""
    text = (situation_text or "").lower().strip()
    
    # Handle possible non-integer age gracefully
    try:
        age = int(user_data.get("age", 0))
    except (ValueError, TypeError):
        age = 0 
        
    community = (user_data.get("community", "") or "").lower()

    matched_schemes = []
    for scheme in schemes:
        # 🔍 Fuzzy keyword match
        keyword_match = any(
            text.find(kw.lower().replace('-', ' ').replace('_', ' ')) != -1
            for kw in scheme["keywords"]
        )

        # 🧓 Basic eligibility checks (simplified)
        age_match = age >= 18 and age <= 65
        
        # Community Match (simplistic matching of Tamil community code)
        community_match = (
            not any(e.lower().includes("sc/st") for e in scheme["eligibility"])
            or bool(re.search(r"sc|st|bc|mbc|oc|obc", community, re.I))
        )
        
        # Filter by primary need (e.g., if asking for fertilizer, needs KCC)
        needs_kcc_keywords = ["fertilizer", "harvest", "crop", "seeds", "விவசாயம்"]
        is_kcc_relevant = any(kw in text for kw in needs_kcc_keywords) and "kcc-farmer" in scheme["id"]

        if (keyword_match or is_kcc_relevant) and age_match and community_match:
            matched_schemes.append(scheme)

    return matched_schemes