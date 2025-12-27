export const twoWheelerLoanForm = [
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
    section: "Two-Wheeler Information",
    fields: [
        { key: "vehicleModel", label: "Vehicle Model", labelTa: "வாகன மாடல்", editable: false },
        { key: "manufacturer", label: "Manufacturer", labelTa: "உற்பத்தியாளர்", editable: false },
        { key: "price", label: "Price", labelTa: "விலை", editable: false },
        { key: "loanAmount", label: "Loan Amount", labelTa: "கடன் தொகை", editable: false },
    ],
    },
];