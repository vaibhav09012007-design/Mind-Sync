"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

interface MeetingMinutesResult {
  success: boolean;
  data?: string;
  error?: string;
}

export async function generateMeetingMinutes(transcript: string): Promise<MeetingMinutesResult> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY. Using mock response for development.");
      // Fallback for development if no key is present
      return {
        success: true,
        data: `## Meeting Summary
(Mock) This was a productive meeting discussing project milestones.

## Key Decisions
- Adopted new UI framework.
- Scheduled next sprint review for Friday.

## Action Items
- [ ] @John to update documentation.
- [ ] @Sarah to fix login bug.`,
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are an expert meeting assistant. Analyze the following transcript and generate a structured set of meeting minutes.
      
      Required Sections:
      1. **Summary**: A concise paragraph summarizing the discussion.
      2. **Key Decisions**: A bulleted list of decisions made.
      3. **Action Items**: A checklist of tasks with assignees if mentioned. Format as "- [ ] Task description".

      Transcript:
      "${transcript}"

      Output Format: HTML (use <h3> for headers, <ul>/<li> for lists, <p> for text)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { success: true, data: text };
  } catch (error) {
    console.error("Error generating meeting minutes:", error);
    return { success: false, error: "Failed to generate meeting minutes. Please try again." };
  }
}
