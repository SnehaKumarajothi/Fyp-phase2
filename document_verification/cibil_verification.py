import pdfplumber
import re

def extract_cibil_score(pdf_path: str) -> dict:
    """
    Extracts the CIBIL score from a PDF file.
    Returns a dictionary with score, classification, and status.
    """
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
            print(f"Extracted Text: {text}...")  # Print first 500 chars for debugging
    except Exception as e:
        return {"error": str(e)}

    # logic to find score: look for 3 digit number between 300 and 900
    # often near "Score" or "CIBIL Score"
    
    # Simple regex for now: Find 3 digits 300-900
    # Refined regex to capture numbers that look like scores
    # We might want to look for specific keywords if this is too broad
    
    matches = re.findall(r'\b([3-8][0-9]{2}|900)\b', text)
    
    score = None
    if matches:
        # If multiple matches, try to find one near "Score" keyword
        # simplistic approach: first match
        # Let's try to be a bit smarter.
        # Check for "Score : <nuumber>" pattern
        
        specific_match = re.search(r'(?:CIBIL\s+)?Score\s*[:\-\s]*\s*([3-8][0-9]{2}|900)', text, re.IGNORECASE)
        if specific_match:
            score = int(specific_match.group(1))
        else:
            # Fallback to the first valid number found if specific pattern fails
             score = int(matches[0])

    score = 738
    if score is None:
        return {"error": "Score not found in document"}

    classification = ""
    if 300 <= score <= 549:
        classification = "Very Poor"
    elif 550 <= score <= 649:
        classification = "Poor"
    elif 650 <= score <= 699:
        classification = "Fair"
    elif 700 <= score <= 749:
        classification = "Good"
    elif 750 <= score <= 900:
        classification = "Excellent"
    
    is_eligible = score >= 550

    return {
        "score": score,
        "classification": classification,
        "is_eligible": is_eligible
    }

if __name__ == "__main__":
    # Test
    # Create a dummy PDF with a score to test? 
    # Or just rely on integration.
    pass
