import { anthropic } from "@workspace/integrations-anthropic-ai";

export async function generateResumeSummary(params: {
  fullName: string;
  jobTitle: string;
  yearsExperience?: string;
  skills?: string[];
  highlights?: string;
}): Promise<string> {
  const prompt = `Write a professional resume summary for ${params.fullName}, a ${params.jobTitle} with ${params.yearsExperience || "several years of"} experience. ${params.skills?.length ? `Key skills: ${params.skills.join(", ")}.` : ""} ${params.highlights ? `Notable highlights: ${params.highlights}.` : ""} Write 3-4 sentences in first person, focusing on value delivered and key achievements. Be specific, impactful, and ATS-friendly. Do not use generic phrases like "motivated professional" or "team player". Return only the summary text.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

export async function generateJobBullets(params: {
  jobTitle: string;
  company?: string;
  responsibilities: string;
}): Promise<string[]> {
  const prompt = `Rewrite the following job responsibilities as 4-5 strong, ATS-optimized resume bullet points for a ${params.jobTitle}${params.company ? ` at ${params.company}` : ""}. Each bullet must start with a strong action verb, include specific metrics or outcomes where possible, and be concise (under 20 words). Return only the bullet points, one per line, without numbering or dashes.

Responsibilities:
${params.responsibilities}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") return [];
  return block.text
    .trim()
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((l) => l.replace(/^[-•*]\s*/, "").trim());
}

export async function generateCoverLetter(params: {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  resumeData?: Record<string, unknown>;
}): Promise<string> {
  const prompt = `Write a professional, tailored cover letter for a ${params.jobTitle} position at ${params.companyName}. ${params.resumeData ? `Candidate background: ${JSON.stringify(params.resumeData)}.` : ""} 

Job description:
${params.jobDescription}

Write exactly 3 paragraphs: 1) Hook + why this company, 2) Key relevant experience and achievements, 3) Enthusiasm + call to action. Be specific, confident, and avoid clichés. Do not include "Dear Hiring Manager" or a signature — just the 3 paragraphs. Return only the letter body.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

export async function optimizeResume(params: {
  resumeText: string;
  jobDescription: string;
}): Promise<{
  atsScore: number;
  missingKeywords: string[];
  suggestions: string[];
}> {
  const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description and return a JSON object with exactly these fields:
- atsScore: integer 0-100 representing how well the resume matches
- missingKeywords: array of important keywords/skills from the job description missing in the resume (max 10)
- suggestions: array of specific, actionable improvement suggestions (max 5)

Job Description:
${params.jobDescription}

Resume:
${params.resumeText}

Return ONLY valid JSON, no markdown, no explanation.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    return { atsScore: 0, missingKeywords: [], suggestions: [] };
  }

  try {
    const cleaned = block.text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { atsScore: 0, missingKeywords: [], suggestions: [] };
  }
}

export async function generateLinkedInSummary(
  resumeData: Record<string, unknown>
): Promise<string> {
  const prompt = `Based on this resume data, write a compelling LinkedIn "About" section in first person. Make it 2-3 paragraphs (150-250 words total). It should show personality, highlight key achievements, and end with what the person is looking for or passionate about. Do not use generic phrases. Be authentic and engaging.

Resume data:
${JSON.stringify(resumeData, null, 2)}

Return only the About section text.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

export async function generateInterviewQuestions(params: {
  jobTitle: string;
  jobDescription: string;
}): Promise<Array<{ question: string; idealAnswer: string }>> {
  const prompt = `Generate 10 likely interview questions for a ${params.jobTitle} role. Mix behavioral, technical, and situational questions based on this job description. For each, provide an ideal answer framework.

Job Description:
${params.jobDescription}

Return ONLY a valid JSON array of objects with exactly these fields:
- question: string
- idealAnswer: string (2-4 sentences, practical and specific)

Return ONLY valid JSON array, no markdown, no explanation.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") return [];

  try {
    const cleaned = block.text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
