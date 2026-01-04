export const bankingMockData = {
  account: {
    holderName: "ரமேஷ் குமார்",
    accountType: "Savings Account",
    branch: "State Bank of India, Tambaram",
    ifsc: "SBIN0001234",
    status: "Active",
  },

  balance: {
    amount: 24560,
    lastUpdated: "Today, 10:30 AM",
  },

  transactions: [
    { date: "12 Sep", type: "Debit", amount: 500, desc: "ATM Withdrawal" },
    { date: "10 Sep", type: "Credit", amount: 2000, desc: "Govt Benefit" },
    { date: "08 Sep", type: "Debit", amount: 350, desc: "Grocery Store" },
    { date: "05 Sep", type: "Credit", amount: 1000, desc: "DBT Credit" },
    { date: "02 Sep", type: "Debit", amount: 120, desc: "Mobile Recharge" },
  ],

  loan: {
    eligible: true,
    types: ["Mudra Loan", "Education Loan"],
    amountRange: "₹50,000 – ₹2,00,000",
  },

  kyc: {
    status: "Partial",
    missing: ["PAN Card"],
  },

  interest: {
    savings: "3.0% per annum",
    fd: "6.5% per annum",
    loan: "7% – 10%",
  },
};
