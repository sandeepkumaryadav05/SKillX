import { GoogleGenAI } from '@google/genai';
import AppError from '../utils/AppError.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Model used by every Gemini feature in this service.
// gemini-2.5-flash was retired on the Gemini API — gemini-3.6-flash is the
// current GA replacement and is verified to work with this key via generateContent.
const GEMINI_MODEL = 'gemini-3.6-flash';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extracts the numeric HTTP status from a Gemini SDK error.
 * The SDK populates error.status, but some error paths only embed the code in
 * error.message as JSON — handle both so retry/status mapping never misses.
 */
const extractStatus = (error) => {
  if (typeof error?.status === 'number') return error.status;
  try {
    const parsed = JSON.parse(error?.message || '');
    const code = parsed?.error?.code ?? parsed?.status;
    const asNumber = Number(code);
    if (Number.isInteger(asNumber) && asNumber >= 100 && asNumber <= 599) return asNumber;
  } catch {
    /* message is not JSON — fall through */
  }
  return null;
};

/**
 * Calls the Gemini API with the given prompt and returns the raw text from the
 * first candidate. Retries transient overload (503) and rate-limit (429) errors.
 * Throws an AppError with a client-safe message and a real HTTP status.
 */
const callGeminiText = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured on the server.', 500);
  }

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const text = response?.text?.trim?.();
      if (!text) {
        console.warn('Gemini returned no text content (blocked or empty response).');
        throw new AppError('AI service returned an empty response. Please try again in a moment.', 500);
      }

      return text;
    } catch (error) {
      lastError = error;
      console.error(`Gemini call attempt ${attempt}/${MAX_RETRIES} failed:`, error.message || error);

      const status = extractStatus(error);
      if ((status === 503 || status === 429) && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`Retrying Gemini call in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  console.error('All Gemini call attempts failed:', lastError);

  const finalStatus = extractStatus(lastError);
  if (finalStatus === 429) {
    throw new AppError('AI rate limit reached. Please wait a moment and try again.', 429);
  }
  if (finalStatus === 503) {
    throw new AppError('AI service is temporarily unavailable. Please try again in a moment.', 503);
  }
  throw new AppError('AI service is unavailable. Please try again in a moment.', 500);
};

/** Removes markdown code fences (``` / ```json) and trims surrounding whitespace. */
const stripCodeFences = (text) => text.replace(/```(json)?/g, '').replace(/```/g, '').trim();

export const generateLearningRoadmap = async (goal) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured on the server.', 500);
  }

  const safeGoal = String(goal || '').trim().slice(0, 300);

  const prompt = `Generate a practical, beginner-friendly learning roadmap for the goal: "${safeGoal}".
    
The output MUST be a valid JSON object with the following structure:
{
  "goalTitle": "string (the overarching title)",
  "description": "string (a short encouraging summary)",
  "milestones": [
    {
      "week": "string (e.g., Week 1-2)",
      "title": "string (e.g., Basics of HTML & CSS)",
      "topics": ["string", "string"],
      "projectSuggestion": "string (a simple project to apply knowledge)"
    }
  ]
}
Ensure the output is strictly valid JSON with no markdown wrapping like \`\`\`json. Return only the JSON object.`;

  const text = await callGeminiText(prompt);
  const cleanedText = stripCodeFences(text);

  try {
    const roadmapJSON = JSON.parse(cleanedText);
    if (!roadmapJSON || typeof roadmapJSON !== 'object' || !Array.isArray(roadmapJSON.milestones)) {
      throw new Error('Parsed roadmap is missing the expected structure');
    }
    return roadmapJSON;
  } catch (err) {
    console.error('Failed to parse roadmap JSON:', cleanedText?.slice(0, 500));
    throw new AppError('AI returned an invalid roadmap. Please try again in a moment.', 500);
  }
};

export const enhanceGigDescription = async ({ title, category, skills, description }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured on the server.', 500);
  }

  const safeTitle = String(title || '').trim().slice(0, 300);
  const safeCategory = String(category || '').trim().slice(0, 100);
  const safeSkills = (Array.isArray(skills) ? skills : []).map((s) => String(s).slice(0, 100));
  const safeDescription = String(description || '').slice(0, 2000);

  const skillsList = safeSkills.join(', ');
  const additionalDetails = safeDescription.trim() ? safeDescription.trim() : 'None provided';

  const prompt = `Generate a professional SkillX gig description using the following context:

Title: ${safeTitle}
Category: ${safeCategory}
Skills Required: ${skillsList}
Additional Details: ${additionalDetails}

Requirements:
- Keep the original intent of the gig
- Use the contextual information (title, category, skills) naturally in the description
- Mention relevant skills where they fit organically
- Keep it concise: 80-120 words
- Write in a realistic, professional tone suitable for peer-to-peer collaboration
- Avoid generic AI wording, unnecessary buzzwords, and placeholder text
- Do NOT add markdown formatting, bullet points, or headers
- Return ONLY the generated description text as a plain string, nothing else`;

  const text = await callGeminiText(prompt);
  return stripCodeFences(text).replace(/^"+|"+$/g, '');
};

export const generateMatchInsights = async (currentUser, matches) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured on the server.', 500);
  }

  if (!matches || matches.length === 0) return [];

  const safeCurrentUser = {
    skillOffered: String(currentUser?.skillOffered || '').slice(0, 500),
    skillWanted: String(currentUser?.skillWanted || '').slice(0, 500),
  };

  const matchesContext = matches.slice(0, 10).map((m) => `
Matched User ID: ${m._id}
Offers: ${String(m.skillOffered || '').slice(0, 500)}
Wants: ${String(m.skillWanted || '').slice(0, 500)}
Match Score: ${m.matchScore}%
  `).join('\n');

  const prompt = `You are an AI matching assistant for the SkillX peer-to-peer learning platform.
I will provide the current user's profile and a list of their top matched users.
For each matched user, generate:
1. "aiInsight": Why this is a good skill exchange match.
2. "suggestedExchange": A specific suggested exchange activity.

Current User:
Offers: ${safeCurrentUser.skillOffered}
Wants: ${safeCurrentUser.skillWanted}

Matches:
${matchesContext}

Requirements:
- Be concise (maximum 2-3 sentences per insight).
- Make it realistic and peer-to-peer focused.
- Avoid buzzwords and generic AI wording.
- Return ONLY a valid JSON array of objects.
- Do NOT add markdown formatting like \`\`\`json.
- Each object MUST have this exact structure:
[
  {
    "id": "Matched User ID string",
    "aiInsight": "string",
    "suggestedExchange": "string"
  }
]`;

  try {
    const text = await callGeminiText(prompt);
    const parsed = JSON.parse(stripCodeFences(text));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Non-fatal: the UI hides the AI insights section rather than crashing.
    console.error('Failed to generate match insights:', error.message || error);
    return [];
  }
};
