export const creditLimitEnhancementForm = [
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
    section: "Credit Limit Enhancement Information",
    fields: [
        { key: "currentCreditLimit", label: "Current Credit Limit", labelTa: "தற்போதைய கடன் வரம்பு", editable: false },
        { key: "requestedEnhancement", label: "Requested Enhancement Amount", labelTa: "கோரப்பட்ட உயர்வு தொகை", editable: false },
        { key: "reason", label: "Reason for Enhancement", labelTa: "உயர்வுக்கான காரணம்", editable: false },
    ],
    },
];