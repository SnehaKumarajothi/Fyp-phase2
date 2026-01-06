export const schemes = [
  {
    id: "tractor-loan",
    name: "Tractor Loan Scheme",
    nameTa: "டிராக்டர் கடன் திட்டம்",
    description: "Government-backed tractor loan for small and medium farmers.",
    descriptionTa: "சிறு மற்றும் நடுத்தர விவசாயிகளுக்கான அரசாங்க ஆதரவு டிராக்டர் கடன் திட்டம்.",
    eligibility: ["Farmer", "Age 18-60", "Own Land"],
    maxAmount: "₹5,00,000",
    interestRate: "7.5% p.a.",
    keywords: ["tractor", "farming", "agriculture","விவசாயம்"],
    formKey: "tractor-loan",
    questions: [
      { key: "land_size", label: "நீங்கள் வைத்துள்ள நிலத்தின் அளவு என்ன?", labelEn: "What is your land size?" },
      { key: "tractor_model", label: "டிராக்டர் மாடல் என்ன?", labelEn: "What is the tractor model?" },
      { key: "loan_amount", label: "எவ்வளவு தொகை கடனாக வேண்டும்?", labelEn: "How much loan amount do you need?" }
    ],

    formFields: [
      { key: "applicant_name", label: "Applicant Name", labelTa: "விண்ணப்பதாரரின் பெயர்", editable: false },
      { key: "age", label: "Age", labelTa: "வயது", editable: false },
      { key: "address", label: "Address", labelTa: "முகவரி", editable: false },
      { key: "land_size", label: "Land Size (in acres)", labelTa: "நில அளவு (ஏக்கர்)", editable: false },
      { key: "tractor_model", label: "Tractor Model", labelTa: "டிராக்டர் மாடல்", editable: false },
      { key: "loan_amount", label: "Loan Amount", labelTa: "கடன் தொகை", editable: false }
    ]
  },
  // Add more schemes here later...
  {
    id: "kisan_credit_card",
    name: "KCC Farmer Finance Scheme",
    nameTa: "விவசாயி நிதி திட்டம் (KCC)",
    description: "Financial support for farmers under the Kisan Credit Card program.",
    descriptionTa: "கிசான் கடன் அட்டையின் கீழ் விவசாயிகளுக்கான நிதி உதவி.",
    eligibility: ["Age: 18-60", "Farmer", "Cultivator"],
    maxAmount: "₹3,00,000",
    interestRate: "4.0% p.a.",
    keywords: ["kcc", "farmer finance", "விவசாயி", "credit card", "agriculture","credit","fertilizers"],
    formKey: "kcc-farmer",
    questions: [
      { key: "farmSize", label: "பண்ணையின் அளவு என்ன?", labelEn: "What is your farm size?" },
      { key: "cropType", label: "நீங்கள் எந்த பயிரை வளர்க்கிறீர்கள்?", labelEn: "What type of crop do you grow?" },
      { key: "annualIncome", label: "விவசாயத்திலிருந்து ஆண்டு வருமானம் என்ன?", labelEn: "What is your annual income from farming?" },
      { key: "loanAmount", label: "தேவையான கடன் தொகை எவ்வளவு?", labelEn: "What loan amount do you require?" }
    ],
    formFields: [
      { key: "name", label: "Applicant Name", labelTa: "விண்ணப்பதாரர் பெயர்", editable: false },
      { key: "age", label: "Age", labelTa: "வயது", editable: false },
      { key: "address", label: "Address", labelTa: "முகவரி", editable: false },
      { key: "community", label: "Community", labelTa: "சமூகம்", editable: false },
      { key: "farmSize", label: "Farm Size (in acres)", labelTa: "பண்ணை அளவு (ஏக்கர்)", editable: false },
      { key: "cropType", label: "Type of Crop", labelTa: "பயிர் வகை", editable: false },
      { key: "annualIncome", label: "Annual Income from Farming", labelTa: "விவசாய வருமானம்", editable: false },
      { key: "loanAmount", label: "Loan Amount Required", labelTa: "தேவையான கடன் தொகை", editable: false }
    ]
  },
  {
    id: "two-wheeler",
    name: "Two-Wheeler Loan Scheme",
    nameTa: "இருசக்கர வாகன கடன் திட்டம்",
    description: "Affordable loans for purchasing two-wheelers.",
    descriptionTa: "இருசக்கர வாகனங்களை வாங்குவதற்கான மலிவு கடன்.",
    eligibility: ["Age: 21-60", "Employed", "Income > 2 LPA"],
    maxAmount: "₹40,000",
    interestRate: "8.0% p.a.",
    keywords: ["bike", "two wheeler", "motorcycle", "இருசக்கர", "vehicle"],
    formKey: "two-wheeler",
    questions: [
      { key: "vehicleModel", label: "வாகன மாடல் என்ன?", labelEn: "What is your vehicle model?" },
      { key: "manufacturer", label: "உற்பத்தியாளர் யார்?", labelEn: "Who is the manufacturer?" },
      { key: "price", label: "விலை எவ்வளவு?", labelEn: "What is the price?" },
      { key: "loanAmount", label: "எவ்வளவு கடன் தொகை வேண்டும்?", labelEn: "What loan amount do you need?" }
    ],
    formFields: [
      { key: "name", label: "Applicant Name", labelTa: "விண்ணப்பதாரர் பெயர்", editable: false },
      { key: "age", label: "Age", labelTa: "வயது", editable: false },
      { key: "address", label: "Address", labelTa: "முகவரி", editable: false },
      { key: "community", label: "Community", labelTa: "சமூகம்", editable: false },
      { key: "vehicleModel", label: "Vehicle Model", labelTa: "வாகன மாடல்", editable: false },
      { key: "manufacturer", label: "Manufacturer", labelTa: "உற்பத்தியாளர்", editable: false },
      { key: "price", label: "Price", labelTa: "விலை", editable: false },
      { key: "loanAmount", label: "Loan Amount", labelTa: "கடன் தொகை", editable: false }
    ]
  },
  {
    id: "pmfby",
    name: "Commercial Card Scheme",
    nameTa: "வணிக அட்டை திட்டம்",
    description: "Credit card for business owners to manage transactions.",
    descriptionTa: "வணிக பரிவர்த்தனைகளை நிர்வகிக்க வணிக அட்டை கடன் திட்டம்.",
    eligibility: ["Age: 25-65", "Business Owner"],
    maxAmount: "₹5,00,000",
    interestRate: "10.0% p.a.",
    keywords: ["commercial card", "business", "credit", "enterprise", "வணிகம்"],
    formKey: "commercial-card",
    questions: [
      { key: "businessType", label: "வணிக வகை என்ன?", labelEn: "What type of business do you run?" },
      { key: "annualTurnover", label: "ஆண்டு வருவாய் என்ன?", labelEn: "What is your annual turnover?" },
      { key: "creditLimit", label: "எவ்வளவு கடன் வரம்பு வேண்டும்?", labelEn: "What credit limit do you request?" }
    ],
    formFields: [
      { key: "name", label: "Applicant Name", labelTa: "விண்ணப்பதாரர் பெயர்", editable: false },
      { key: "age", label: "Age", labelTa: "வயது", editable: false },
      { key: "address", label: "Address", labelTa: "முகவரி", editable: false },
      { key: "community", label: "Community", labelTa: "சமூகம்", editable: false },
      { key: "businessType", label: "Type of Business", labelTa: "வணிக வகை", editable: false },
      { key: "annualTurnover", label: "Annual Turnover", labelTa: "ஆண்டு வருவாய்", editable: false },
      { key: "creditLimit", label: "Requested Credit Limit", labelTa: "கோரப்பட்ட கடன் வரம்பு", editable: false }
    ]
  },
  {
    id: "credit-limit-enhancement",
    name: "Credit Limit Enhancement Scheme",
    nameTa: "கடன் வரம்பு உயர்வு திட்டம்",
    description: "Request for increasing existing credit limit for customers.",
    descriptionTa: "தற்போதைய கடன் வரம்பை உயர்த்துவதற்கான வாடிக்கையாளர் கோரிக்கை.",
    eligibility: ["Existing Customer", "Good Credit Record"],
    maxAmount: "As per eligibility",
    interestRate: "Existing rate",
    keywords: ["credit enhancement", "limit increase", "credit limit", "உயர்வு"],
    formKey: "credit-limit-enhancement",
    questions: [
      { key: "currentCreditLimit", label: "தற்போதைய கடன் வரம்பு என்ன?", labelEn: "What is your current credit limit?" },
      { key: "requestedEnhancement", label: "எவ்வளவு உயர்வு கோருகிறீர்கள்?", labelEn: "What enhancement amount do you request?" },
      { key: "reason", label: "உயர்வுக்கான காரணம் என்ன?", labelEn: "What is the reason for enhancement?" }
    ],
    formFields: [
      { key: "name", label: "Applicant Name", labelTa: "விண்ணப்பதாரர் பெயர்", editable: false },
      { key: "age", label: "Age", labelTa: "வயது", editable: false },
      { key: "address", label: "Address", labelTa: "முகவரி", editable: false },
      { key: "community", label: "Community", labelTa: "சமூகம்", editable: false },
      { key: "currentCreditLimit", label: "Current Credit Limit", labelTa: "தற்போதைய கடன் வரம்பு", editable: false },
      { key: "requestedEnhancement", label: "Requested Enhancement Amount", labelTa: "கோரப்பட்ட உயர்வு தொகை", editable: false },
      { key: "reason", label: "Reason for Enhancement", labelTa: "உயர்வுக்கான காரணம்", editable: false }
    ]
  }
];
