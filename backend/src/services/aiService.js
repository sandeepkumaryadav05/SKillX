import { GoogleGenAI } from '@google/genai';


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateLearningRoadmap = async (goal) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in the environment variables.');
  }

  const prompt = `Generate a practical, beginner-friendly learning roadmap for the goal: "${goal}".
    
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

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text;
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const roadmapJSON = JSON.parse(cleanedText);

      return roadmapJSON;
    } catch (error) {
      lastError = error;
      console.error(`AI roadmap attempt ${attempt}/${MAX_RETRIES} failed:`, error.message || error);

      // Retry on 503 (overload) or 429 (rate limit), but not on other errors
      const status = error?.status || error?.httpStatusCode;
      if ((status === 503 || status === 429) && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  console.error('All AI roadmap attempts failed:', lastError);
  throw new Error('Failed to generate learning roadmap from AI service. Please try again in a moment.');
};

export const enhanceGigDescription = async ({ title, category, skills, description }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in the environment variables.');
  }

  const skillsList = Array.isArray(skills) ? skills.join(', ') : skills;
  const additionalDetails = description && description.trim() ? description.trim() : 'None provided';

  const prompt = `Generate a professional SkillX gig description using the following context:

Title: ${title}
Category: ${category}
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

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text.replace(/```/g, '').replace(/"/g, '').trim();
      return text;
    } catch (error) {
      lastError = error;
      console.error(`AI gig enhance attempt ${attempt}/${MAX_RETRIES} failed:`, error.message || error);

      const status = error?.status || error?.httpStatusCode;
      if ((status === 503 || status === 429) && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  console.error('All AI gig enhance attempts failed:', lastError);
  throw new Error('Failed to enhance gig description. Please try again in a moment.');
};

export const generateMatchInsights = async (currentUser, matches) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in the environment variables.');
  }

  if (!matches || matches.length === 0) return [];

  const matchesContext = matches.map((m) => `
Matched User ID: ${m._id}
Offers: ${m.skillOffered}
Wants: ${m.skillWanted}
Match Score: ${m.matchScore}%
  `).join('\n');

  const prompt = `You are an AI matching assistant for the SkillX peer-to-peer learning platform.
I will provide the current user's profile and a list of their top matched users.
For each matched user, generate:
1. "aiInsight": Why this is a good skill exchange match.
2. "suggestedExchange": A specific suggested exchange activity.

Current User:
Offers: ${currentUser.skillOffered}
Wants: ${currentUser.skillWanted}

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

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      return parsed;
    } catch (error) {
      lastError = error;
      console.error(`AI match insights attempt ${attempt}/${MAX_RETRIES} failed:`, error.message || error);

      const status = error?.status || error?.httpStatusCode;
      if ((status === 503 || status === 429) && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  console.error('All AI match insights attempts failed:', lastError);
  // Fallback: return empty array so UI doesn't crash, just shows no insights
  return [];
};
