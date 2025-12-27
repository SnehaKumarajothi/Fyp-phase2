export const kccFarmerFinanceForm = [
  {
    section: "Applicant Details",
    fields: [
        { key: "name", label: "Applicant Name", labelTa: "விண்ணப்பதாரர் பெயர்", editable: false },
        { key: "age", label: "Age", labelTa: "வயது", editable: false },
        { key: "address", label: "Address", labelTa: "முகவரி", editable: false },
        { key: "community", label: "Community", labelTa: "சமூகம்", editable: false },
    ],
    },
    {
    section: "Farm Information",
    fields: [
        { key: "farmSize", label: "Farm Size (in acres)", labelTa: "பண்ணை அளவு (ஏக்கர்)", editable: false },
        { key: "cropType", label: "Type of Crop", labelTa: "பயிர் வகை", editable: false },
        { key: "annualIncome", label: "Annual Income from Farming", labelTa: "விவசாயத்திலிருந்து ஆண்டு வருமானம்", editable: false },
        { key: "loanAmount", label: "Loan Amount Required", labelTa: "தேவையான கடன் தொகை", editable: false },
    ],
    },
];