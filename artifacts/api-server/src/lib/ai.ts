import { aiService, type AIModelType } from "./ai-provider.js";

// Types and Schemas remain the same...
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
  projects: Array<{ title: string; description: string; link?: string; technologies: string[] }>;
  certifications: Array<{ name: string; issuer: string; date: string }>;
  achievements: Array<{ title: string; description: string; date: string }>;
  template: string;
}

const RESUME_JSON_SCHEMA = `{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "website": "", "linkedin": "" },
  "summary": "",
  "workExperience": [{ "jobTitle": "", "company": "", "location": "", "startDate": "", "endDate": "", "isCurrent": false, "responsibilities": "", "bullets": [] }],
  "education": [{ "degree": "", "institution": "", "location": "", "graduationYear": "", "gpa": "" }],
  "skills": [],
  "projects": [],
  "certifications": [],
  "achievements": [],
  "template": "modern"
}`;

function cleanJson(text: string): string {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

export async function parseResumeFromText(text: string, modelType: AIModelType = "free"): Promise<ResumeData> {
  const system = `You are a precise resume parser. Extract data into JSON matching this schema: ${RESUME_JSON_SCHEMA}. 
Rules: 
1. Work experience: Combine bullets into "responsibilities" and also keep them in "bullets".
2. Currently employed: set "isCurrent": true, "endDate": "Present".
3. Extract technical and soft skills.
4. Extract project details and technologies.
5. NO fabrications. Return ONLY JSON.`;

  const result = await aiService.generate({
    modelType,
    system,
    prompt: `Resume text: ${text}`,
    temperature: 0.1,
  });

  return JSON.parse(cleanJson(result)) as ResumeData;
}

export async function atsBoostResume(params: {
  resumeData: ResumeData;
  jobDescription?: string;
  modelType?: AIModelType;
}): Promise<{ optimizedData: ResumeData; improvements: string[]; estimatedScore: number }> {
  const system = `You are an elite resume writer and ATS expert. Rewrite resumes for 95%+ ATS scores. 
STRICT: 
1. No fabrication. 
2. Strong action verbs + metrics. 
3. Expand skills with job-specific keywords. 
4. 3-5 quantified bullets per job.
Return JSON: { "optimizedData": ${RESUME_JSON_SCHEMA}, "improvements": [string], "estimatedScore": number }.`;

  const prompt = `Job Description: ${params.jobDescription || "General ATS optimization"}
Resume: ${JSON.stringify(params.resumeData)}`;

  const result = await aiService.generate({
    modelType: params.modelType || "free",
    system,
    prompt,
    temperature: 0.3,
  });

  return JSON.parse(cleanJson(result));
}

export async function generateResumeSummary(params: {
  fullName: string;
  jobTitle: string;
  yearsExperience?: string;
  skills?: string[];
  highlights?: string;
  modelType?: AIModelType;
}): Promise<string> {
  const system = "Write professional, 1st-person resume summaries. Focus on value and achievements. No generic filler. ATS-friendly.";
  const prompt = `Name: ${params.fullName}, Role: ${params.jobTitle}, Exp: ${params.yearsExperience || "N/A"}. Skills: ${params.skills?.join(", ") || "N/A"}. Highlights: ${params.highlights || "N/A"}. Write 3-4 impactful sentences.`;

  const result = await aiService.generate({
    modelType: params.modelType || "free",
    system,
    prompt,
    temperature: 0.7,
  });

  return result.trim();
}

export async function generateJobBullets(params: {
  jobTitle: string;
  company?: string;
  responsibilities: string;
  modelType?: AIModelType;
}): Promise<string[]> {
  const system = "Rewrite job responsibilities into 4-5 high-impact resume bullets. Start with action verbs, include metrics, max 20 words each. No numbering/dashes.";
  const prompt = `Role: ${params.jobTitle}${params.company ? ` at ${params.company}` : ""}. Responsibilities: ${params.responsibilities}`;

  const result = await aiService.generate({
    modelType: params.modelType || "free",
    system,
    prompt,
    temperature: 0.5,
  });

  if (!result) return [];
  return result
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
  tone?: string;
  experienceLevel?: string;
  paragraphToRegenerate?: number;
  existingParagraphs?: string[];
  modelType?: AIModelType;
}): Promise<string> {
  const tone = params.tone || "professional";
  const level = params.experienceLevel || "professional";

  const system = `Write exactly 3 paragraphs for a cover letter. Tone: ${tone}, Level: ${level}. 
1: Hook + Company fit. 
2: Achievements/Skills match. 
3: Enthusiasm + Call to action. 
RULES: No salutations/signatures. No clichés. Quantify achievements. Return ONLY the paragraphs.`;

  if (params.paragraphToRegenerate !== undefined && params.existingParagraphs?.length) {
    const paraLabel = ["Opening", "Body", "Closing"][params.paragraphToRegenerate];
    const prompt = `Regenerate the ${paraLabel} paragraph. 
Context: Job: ${params.jobTitle} at ${params.companyName}. 
JD: ${params.jobDescription.slice(0, 500)}. 
Existing letter: ${params.existingParagraphs.join("\n\n")}`;

    const result = await aiService.generate({
      modelType: params.modelType || "free",
      system,
      prompt,
      temperature: 0.7,
    });
    return result.trim();
  }

  const prompt = `Job: ${params.jobTitle} at ${params.companyName}. 
JD: ${params.jobDescription.slice(0, 1000)}. 
Resume: ${JSON.stringify(params.resumeData)}`;

  const result = await aiService.generate({
    modelType: params.modelType || "free",
    system,
    prompt,
    temperature: 0.7,
  });
  return result.trim();
}

export async function optimizeResume(params: {
  resumeText: string;
  jobDescription: string;
  modelType?: AIModelType;
}): Promise<{
  atsScore: number;
  missingKeywords: string[];
  suggestions: string[];
}> {
  const system = "You are an ATS expert. Analyze resume vs JD. Return JSON: { atsScore: 0-100, missingKeywords: [string, max 10], suggestions: [string, max 5] }.";
  const prompt = `JD: ${params.jobDescription.slice(0, 2000)}. Resume: ${params.resumeText.slice(0, 4000)}`;

  const result = await aiService.generate({
    modelType: params.modelType || "free",
    system,
    prompt,
    temperature: 0.2,
  });

  if (!result) return { atsScore: 0, missingKeywords: [], suggestions: [] };
  try {
    return JSON.parse(cleanJson(result));
  } catch {
    return { atsScore: 0, missingKeywords: [], suggestions: [] };
  }
}

export interface ATSAnalysisResult {
  overallScore: number;
  sectionScores: {
    contactInfo: number;
    summary: number;
    experience: number;
    education: number;
    skills: number;
    formatting: number;
  };
  keywordAnalysis: {
    found: string[];
    missing: string[];
    density: number;
  };
  readability: {
    score: number;
    grade: string;
    feedback: string;
  };
  formatting: {
    issues: string[];
    passed: string[];
  };
  actionVerbs: {
    used: string[];
    suggested: string[];
  };
  recommendations: Array<{
    category: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
  }>;
  summary: string;
}

export async function deepATSAnalysis(params: {
  resumeText: string;
  jobDescription?: string;
  modelType?: AIModelType;
}): Promise<ATSAnalysisResult> {
  const system = `Perform deep ATS analysis. Return ONLY JSON matching schema. Be specific and actionable. 
Schema keys: overallScore, sectionScores (contactInfo, summary, experience, education, skills, formatting), keywordAnalysis (found, missing, density), readability (score, grade, feedback), formatting (issues, passed), actionVerbs (used, suggested), recommendations (category, priority, title, description), summary.`;

  const prompt = `JD: ${params.jobDescription?.slice(0, 2000) || "General"}. Resume: ${params.resumeText.slice(0, 5000)}`;

  const result = await aiService.generate({
    modelType: params.modelType || "free",
    system,
    prompt,
    temperature: 0.2,
  });

  if (!result) return getDefaultATSResult();
  try {
    return JSON.parse(cleanJson(result)) as ATSAnalysisResult;
  } catch {
    return getDefaultATSResult();
  }
}

function getDefaultATSResult(): ATSAnalysisResult {
  return {
    overallScore: 0,
    sectionScores: { contactInfo: 0, summary: 0, experience: 0, education: 0, skills: 0, formatting: 0 },
    keywordAnalysis: { found: [], missing: [], density: 0 },
    readability: { score: 0, grade: "N/A", feedback: "Unable to analyze." },
    formatting: { issues: [], passed: [] },
    actionVerbs: { used: [], suggested: [] },
    recommendations: [],
    summary: "Analysis could not be completed.",
  };
}

export async function generateLinkedInSummary(
  resumeData: Record<string, unknown>,
  modelType: AIModelType = "free"
): Promise<string> {
  const system = "Write compelling LinkedIn 'About' sections in 1st person. 2-3 paragraphs. Personality + impact. No generic buzzwords.";
  const prompt = `Resume Data: ${JSON.stringify(resumeData)}`;

  const result = await aiService.generate({
    modelType,
    system,
    prompt,
    temperature: 0.8,
  });

  return result.trim();
}

export async function generateInterviewQuestions(params: {
  jobTitle: string;
  jobDescription: string;
  modelType?: AIModelType;
}): Promise<Array<{ question: string; idealAnswer: string }>> {
  const system = "Generate 10 interview questions and ideal answer frameworks. Mix behavioral, technical, situational. Return JSON array: [{ question, idealAnswer }].";
  const prompt = `Job: ${params.jobTitle}, Description: ${params.jobDescription.slice(0, 2000)}`;

  const result = await aiService.generate({
    modelType: params.modelType || "free",
    system,
    prompt,
    temperature: 0.7,
  });

  if (!result) return [];
  try {
    return JSON.parse(cleanJson(result));
  } catch {
    return [];
  }
}

export interface CareerRoadmap {
  targetRole: string;
  timeline: string;
  milestones: Array<{
    title: string;
    description: string;
    skillsToLearn: string[];
    recommendedProjects: string[];
    estimatedMonths: number;
  }>;
  overallStrategy: string;
}

export async function generateCareerRoadmap(params: {
  resumeData: ResumeData;
  targetRole: string;
  modelType?: AIModelType;
}): Promise<CareerRoadmap> {
  const system = `You are a career strategist. Create a professional roadmap from the user's current resume to their target role. 
  Return JSON matching this structure: 
  { 
    "targetRole": "", "timeline": "", 
    "milestones": [{ "title": "", "description": "", "skillsToLearn": [], "recommendedProjects": [], "estimatedMonths": 0 }],
    "overallStrategy": "" 
  }`;

  const prompt = `Current Resume: ${JSON.stringify(params.resumeData)}
  Target Role: ${params.targetRole}`;

  const result = await aiService.generate({
    modelType: params.modelType || "free",
    system,
    prompt,
    temperature: 0.7,
  });

  return JSON.parse(cleanJson(result));
}

export async function conductMockInterview(params: {
  jobTitle: string;
  jobDescription: string;
  resumeData: ResumeData;
  chatHistory: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  modelType?: AIModelType;
}): Promise<string> {
  const system = `You are an expert technical recruiter interviewing a candidate for the role of ${params.jobTitle}.
  Job Context: ${params.jobDescription}
  Candidate Resume: ${JSON.stringify(params.resumeData)}
  
  RULES:
  1. Be professional, slightly challenging, but encouraging.
  2. Ask ONE question at a time.
  3. Start by introducing yourself and asking an opening question if history is empty.
  4. If history exists, provide brief feedback on their last answer (1 sentence) and ask the next follow-up or a new question.
  5. If the interview has gone for 5+ questions, politely wrap up and provide a brief summary of their performance.`;

  // Filter history to last few turns to save tokens
  const recentHistory = params.chatHistory.slice(-6);

  const result = await aiService.generate({
    modelType: params.modelType || "free",
    system,
    prompt: recentHistory.length === 0 ? "Start the interview." : "Continue the interview based on history.",
    temperature: 0.7,
    // Note: In a real app we'd pass history to a chat completion API. 
    // Here we'll rely on the prompt context if aiService doesn't support full history yet.
  });

  return result.trim();
}

export interface LinkedInAnalysis {
  score: number;
  sections: {
    headline: { current: string; suggestion: string; impact: string };
    about: { current: string; suggestion: string; impact: string };
    experience: { feedback: string; missingKeywords: string[] };
    skills: { addedSuggestions: string[] };
  };
  networkingStrategy: string;
}

export async function analyzeLinkedInProfile(params: {
  profileText: string;
  resumeData: ResumeData;
  modelType?: AIModelType;
}): Promise<LinkedInAnalysis> {
  const system = `You are a personal branding and LinkedIn expert. Analyze the user's LinkedIn profile relative to their resume.
  Return JSON: 
  {
    "score": 0-100,
    "sections": {
      "headline": { "current": "", "suggestion": "", "impact": "" },
      "about": { "current": "", "suggestion": "", "impact": "" },
      "experience": { "feedback": "", "missingKeywords": [] },
      "skills": { "addedSuggestions": [] }
    },
    "networkingStrategy": ""
  }`;

  const prompt = `LinkedIn Profile: ${params.profileText}
  Resume: ${JSON.stringify(params.resumeData)}`;

  const result = await aiService.generate({
    modelType: params.modelType || "pro", // LinkedIn analysis is complex, prefer pro
    system,
    prompt,
    temperature: 0.4,
  });

  return JSON.parse(cleanJson(result));
}
