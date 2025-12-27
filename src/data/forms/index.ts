// src/data/forms/index.ts
import { tractorLoanForm } from "./tractorLoanForm";
import { kccFarmerFinanceForm } from "./kccFarmerFinanceForm";
import { twoWheelerLoanForm } from "./twoWheelerLoanForm";
import { commercialCardForm } from "./commercialCardForm";
import { creditLimitEnhancementForm } from "./creditLimitEnhancementForm";

export const FORM_REGISTRY: Record<string, any> = {
  "tractor-loan": tractorLoanForm,
  "kcc-farmer": kccFarmerFinanceForm,
  "two-wheeler": twoWheelerLoanForm,
  "commercial-card": commercialCardForm,
  "credit-limit-enhancement": creditLimitEnhancementForm,
};
