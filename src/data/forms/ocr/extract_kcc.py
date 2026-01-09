from textractor import Textractor
from textractor.data.constants import TextractFeatures
import json
from pathlib import Path
BASE_DIR=Path(__file__).parent
FORM_DOCS=BASE_DIR / "form_docs"
OUTPUTS=BASE_DIR / "outputs"
FORM_DOCS.mkdir(exist_ok=True)
OUTPUTS.mkdir(exist_ok=True)
extractor=Textractor(profile_name="default", region_name="us-east-1")
pdf_path=FORM_DOCS / "kcc-farmer-finance-application-form.pdf"
document=extractor.analyze_document(
    file_source=str(pdf_path),
    features=[TextractFeatures.FORMS]
)

kv_pairs=[]
for field in document.form.fields:
    kv_pairs.append({
        "key": field.key.text if field.key else " ",
        "value": field.value.text if field.value else " ",
        "confidence": field.confidence
    })

output_path=OUTPUTS / "kcc_extracted.json"
with open(output_path,"w",encoding="utf-8") as f:
    json.dump(kv_pairs,f,indent=2,ensure_ascii=False)