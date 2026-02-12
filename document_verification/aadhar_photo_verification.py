from pdf2image import convert_from_path
import os

def pdf_to_image(pdf_path, output_dir="temp"):
    os.makedirs(output_dir, exist_ok=True)

    images = convert_from_path(pdf_path, dpi=300)
    image_path = os.path.join(output_dir, "aadhaar_page.png")

    images[0].save(image_path, "PNG")
    return image_path


import cv2

def crop_face(image_path, output_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        return None

    x, y, w, h = faces[0]
    face = img[y:y+h, x:x+w]
    cv2.imwrite(output_path, face)

    return output_path


from deepface import DeepFace

def verify_faces(aadhaar_face_path, live_image_path):
    result = DeepFace.verify(
        img1_path=aadhaar_face_path,
        img2_path=live_image_path,
        model_name="ArcFace",
        detector_backend="opencv",
        enforce_detection=True
    )

    return {
        "verified": result["verified"],
        "distance": round(float(result["distance"]), 3),
        "confidence": round(1 - float(result["distance"]), 3)
    }


def aadhaar_face_verification(aadhaar_pdf, live_image):
    aadhaar_image = pdf_to_image(aadhaar_pdf)

    aadhaar_face = crop_face(
        aadhaar_image,
        output_path="temp/aadhaar_face.png"
    )

    if aadhaar_face is None:
        return {
            "verified": False,
            "message": "No face detected in Aadhaar"
        }

    result = verify_faces(aadhaar_face, live_image)

    return result

if __name__ == "__main__":
    aadhaar_pdf_path = "test_aadhar.pdf"
    live_photo_path = "test_face_sneha.jpg"

    output = aadhaar_face_verification(aadhaar_pdf_path, live_photo_path)
    print(output)
