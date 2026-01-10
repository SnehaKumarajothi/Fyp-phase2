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
  const age = parseInt(userData.age) || 0;
  const community = (userData.community || "").toLowerCase();

  console.log("[SCHEME MATCHER] Input:", { text, age, community, userData });

  return schemes.filter((scheme) => {
    // 🔍 fuzzy keyword match - check if any keyword (or word within keyword) matches
    const keywordMatch = scheme.keywords.some((kw) => {
      const normalized = kw.toLowerCase().replace(/[-_]/g, " ");
      // Check if full keyword is in text
      if (text.includes(normalized)) {
        return true;
      }
      // Also check if any word from the keyword is in the text
      const keywordWords = normalized.split(/\s+/);
      return keywordWords.some(word => word.length > 2 && text.includes(word));
    });

    // 🧓 basic eligibility checks
    const ageMatch = age >= 18 && age <= 65;
    const communityMatch =
      !scheme.eligibility.some((e) => e.toLowerCase().includes("sc/st")) ||
      /sc|st|bc|mbc|oc|obc/i.test(community);

    const matches = keywordMatch && ageMatch && communityMatch;
    if (matches) {
      console.log("[SCHEME MATCHER] Matched scheme:", scheme.id, scheme.name);
    }

    return matches;
  });
};

