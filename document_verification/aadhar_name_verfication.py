# imports
import pdfplumber
from pdf2image import convert_from_path
import pytesseract


# text extraction
def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract raw text content from an Aadhaar PDF.
    Tries native text extraction first, then falls back to OCR.
    """
    text = ""

    # Try extracting text normally first
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

    # If text is empty, fallback to OCR
    if not text.strip():
        images = convert_from_path(pdf_path)
        for img in images:
            text += pytesseract.image_to_string(img)

    return text


def verify_aadhaar_name(user_name: str, aadhar_pdf_path: str) -> bool:
    """
    Check whether the given user_name appears in the extracted Aadhaar PDF text.
    """
    if not user_name or not aadhar_pdf_path:
        return False

    text = extract_text_from_pdf(aadhar_pdf_path)
    #print("Extracted text from PDF:", repr(text))  # Debugging output
    print("The searched user name is:", repr(user_name))  # Debugging output
    print("is the username in the extracted text?", user_name in text)  # Debugging output
    return user_name in text


if __name__ == "__main__":
    # Simple manual test harness – kept for debugging, but no side-effects on import
    user_name = "Sneha Kumarajothi"
    aadhar_pdf_path = "Aadhar Card - Sneha - Oct-2022.pdf"
    extracted_text = extract_text_from_pdf(aadhar_pdf_path)
    print(user_name in extracted_text)