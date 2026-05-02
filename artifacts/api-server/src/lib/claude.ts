import { anthropic } from "@workspace/integrations-anthropic-ai";

export interface ResumeData {
  personalInfo: {
    fullName: string; email: string; phone: string;
    location: string; website: string; linkedin: string;
  };
  summary: string;
  workExperience: Array<{
    jobTitle: string; company: string; location: string;
    startDate: string; endDate: string; isCurrent: boolean;
    responsibilities: string; bullets: string[];
  }>;
  education: Array<{
    degree: string; institution: string; location: string;
    graduationYear: string; gpa: string;
  }>;
  skills: string[];
  template: string;
}

const RESUME_JSON_SCHEMA = `{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "website": "", "linkedin": "" },
  "summary": "",
  "workExperience": [{ "jobTitle": "", "company": "", "location": "", "startDate": "", "endDate": "", "isCurrent": false, "responsibilities": "", "bullets": [] }],
  "education": [{ "degree": "", "institution": "", "location": "", "graduationYear": "", "gpa": "" }],
  "skills": [],
  "template": "modern"
}`;

export async function parseResumeFromText(text: string): Promise<ResumeData> {
  const prompt = `You are a resume parser. Extract all information from the resume text below and return a structured JSON object.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
${RESUME_JSON_SCHEMA}

Rules:
- Extract every piece of information present. Leave fields as empty string if not found.
- For workExperience, put the full description in "responsibilities" and convert bullet points to the "bullets" array.
- If the person is currently employed, set "isCurrent": true and "endDate": "Present".
- For skills, extract all technical and soft skills mentioned anywhere in the resume.
- Do not invent information. Only extract what is explicitly written.

Resume text:
${text}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("No text response");
  const cleaned = block.text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as ResumeData;
}

export async function atsBoostResume(params: {
  resumeData: ResumeData;
  jobDescription?: string;
}): Promise<{ optimizedData: ResumeData; improvements: string[]; estimatedScore: number }> {
  const jobSection = params.jobDescription
    ? `\nTarget Job Description (optimize for this role):\n${params.jobDescription}`
    : "\nOptimize for general ATS systems across industries.";

  const prompt = `You are an elite resume writer and ATS optimization expert. Rewrite this resume to achieve a 95%+ ATS score while keeping all facts 100% accurate.

STRICT RULES:
1. Keep all names, companies, dates, degrees, and locations EXACTLY as provided — never fabricate data.
2. Rewrite every bullet point to start with a strong action verb and include specific metrics/outcomes where inferable.
3. Expand the skills list with relevant technical tools, methodologies, and keywords from the job description.
4. Rewrite the professional summary to be keyword-rich and results-focused (3-4 sentences).
5. Ensure each job has at least 3-5 strong, quantified bullet points.
6. Add industry-standard keywords naturally throughout.
${jobSection}

After optimizing, also return:
- "improvements": array of 5-8 specific things you improved (for user feedback)
- "estimatedScore": integer 95-99 (your estimated ATS match score)

Return ONLY valid JSON with this structure (no markdown, no explanation):
{
  "optimizedData": ${RESUME_JSON_SCHEMA},
  "improvements": ["..."],
  "estimatedScore": 97
}

Current resume to optimize:
${JSON.stringify(params.resumeData, null, 2)}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("No text response");
  const cleaned = block.text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned);
}

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
    .filter((l: string) => l.trim().length > 0)
    .map((l: string) => l.replace(/^[-•*]\s*/, "").trim());
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
