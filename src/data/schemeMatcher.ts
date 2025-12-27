/*import {schemes} from  "./schemeData";
export const getMatchingSchemes = (userData, situationText) => {
  const text = situationText.toLowerCase();
  const age = parseInt(userData.age);
  const community = userData.community.toLowerCase();

  return schemes.filter((scheme) => {
    const keywordMatch = scheme.keywords.some((kw) => text.includes(kw));
    const ageMatch = age >= 18 && age <= 60; // customize
    const communityMatch = !scheme.eligibility.includes("SC/ST") || community.includes("sc") || community.includes("st") || community.includes("BC") || community.includes("bc") || community.includes("obc") || community.includes("OBC");
    return keywordMatch && ageMatch && communityMatch;
  });
};*/

import { schemes } from "./schemeData";

export const getMatchingSchemes = (userData, situationText) => {
  const text = (situationText || "").toLowerCase().trim();
  const age = parseInt(userData.age);
  const community = (userData.community || "").toLowerCase();

  return schemes.filter((scheme) => {
    // 🔍 fuzzy keyword match
    const keywordMatch = scheme.keywords.some((kw) => {
      const normalized = kw.toLowerCase().replace(/[-_]/g, " ");
      return text.includes(normalized);
    });

    // 🧓 basic eligibility checks
    const ageMatch = age >= 18 && age <= 65;
    const communityMatch =
      !scheme.eligibility.some((e) => e.toLowerCase().includes("sc/st")) ||
      /sc|st|bc||mbc|oc|obc/i.test(community);

    return keywordMatch && ageMatch && communityMatch;
  });
};

