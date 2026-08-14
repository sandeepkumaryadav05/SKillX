import SkillExchange from '../models/SkillExchange.js';

/**
 * Dynamically calculates the Mentor and Learner roles for two participants based on their SkillExchange profiles.
 * 
 * @param {String} userAEmail 
 * @param {String} userBEmail 
 * @returns {Object} The exchangeRoles object to be stored in the Session schema.
 */
export const calculateExchangeRoles = async (userAEmail, userBEmail) => {
  try {
    // Initialize default empty roles
    const exchangeRoles = {
      [userAEmail]: { mentorSkills: [], learnerSkills: [] },
      [userBEmail]: { mentorSkills: [], learnerSkills: [] }
    };

    // Fetch all active exchange postings for both users
    const [userAExchanges, userBExchanges] = await Promise.all([
      SkillExchange.find({ email: userAEmail }),
      SkillExchange.find({ email: userBEmail })
    ]);

    if (userAExchanges.length === 0 || userBExchanges.length === 0) {
      // If either user lacks a profile, we can't accurately dynamically assign skills
      // Returning empty arrays is safe and avoids crashes
      return exchangeRoles;
    }

    // Extract all unique offered and wanted skills for User A
    const userAOffered = [...new Set(userAExchanges.map(ex => ex.skillOffered.toLowerCase().trim()))];
    const userAWanted = [...new Set(userAExchanges.map(ex => ex.skillWanted.toLowerCase().trim()))];

    // Extract all unique offered and wanted skills for User B
    const userBOffered = [...new Set(userBExchanges.map(ex => ex.skillOffered.toLowerCase().trim()))];
    const userBWanted = [...new Set(userBExchanges.map(ex => ex.skillWanted.toLowerCase().trim()))];

    // Check what User A mentors (A offers, B wants)
    const aMentorsB = userAOffered.filter(skill => userBWanted.includes(skill));
    if (aMentorsB.length > 0) {
      exchangeRoles[userAEmail].mentorSkills.push(...aMentorsB);
      exchangeRoles[userBEmail].learnerSkills.push(...aMentorsB);
    }

    // Check what User B mentors (B offers, A wants)
    const bMentorsA = userBOffered.filter(skill => userAWanted.includes(skill));
    if (bMentorsA.length > 0) {
      exchangeRoles[userBEmail].mentorSkills.push(...bMentorsA);
      exchangeRoles[userAEmail].learnerSkills.push(...bMentorsA);
    }

    // Format the strings nicely (Capitalize First Letter)
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    
    exchangeRoles[userAEmail].mentorSkills = exchangeRoles[userAEmail].mentorSkills.map(capitalize);
    exchangeRoles[userAEmail].learnerSkills = exchangeRoles[userAEmail].learnerSkills.map(capitalize);
    exchangeRoles[userBEmail].mentorSkills = exchangeRoles[userBEmail].mentorSkills.map(capitalize);
    exchangeRoles[userBEmail].learnerSkills = exchangeRoles[userBEmail].learnerSkills.map(capitalize);

    return exchangeRoles;

  } catch (error) {
    console.error('Error calculating exchange roles:', error);
    // Return empty roles fallback on error
    return {
      [userAEmail]: { mentorSkills: [], learnerSkills: [] },
      [userBEmail]: { mentorSkills: [], learnerSkills: [] }
    };
  }
};
