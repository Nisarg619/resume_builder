import { Router } from "express";
import multer from "multer";
import { authMiddleware, requirePro, type AuthenticatedRequest } from "../middlewares/auth.js";
import {
  generateResumeSummary,
  generateJobBullets,
  generateCoverLetter,
  optimizeResume,
  generateLinkedInSummary,
  generateInterviewQuestions,
  parseResumeFromText,
  atsBoostResume,
  deepATSAnalysis,
  generateCareerRoadmap,
  conductMockInterview,
  analyzeLinkedInProfile,
  type ResumeData,
} from "../lib/ai.js";
import { success, badRequest, serverError, requireFields } from "../lib/responses.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post("/ai/resume-summary", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{
    fullName: string;
    jobTitle: string;
    yearsExperience?: string;
    skills?: string[];
    highlights?: string;
  }>(req.body, ["fullName", "jobTitle"]);

  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }

  try {
    const text = await generateResumeSummary({ ...check.data, modelType: req.user.plan });
    success(res, { text });
  } catch (err) {
    req.log.error({ err }, "Generate resume summary error");
    serverError(res, "AI generation failed");
  }
});

router.post("/ai/job-bullets", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{
    jobTitle: string;
    company?: string;
    responsibilities: string;
  }>(req.body, ["jobTitle", "responsibilities"]);

  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }

  try {
    const bullets = await generateJobBullets({ ...check.data, modelType: req.user.plan });
    success(res, { bullets });
  } catch (err) {
    req.log.error({ err }, "Generate job bullets error");
    serverError(res, "AI generation failed");
  }
});

router.post("/ai/cover-letter", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    resumeData?: Record<string, unknown>;
    tone?: string;
    experienceLevel?: string;
    paragraphToRegenerate?: number;
    existingParagraphs?: string[];
  }>(req.body, ["jobTitle", "companyName", "jobDescription"]);

  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }

  try {
    const text = await generateCoverLetter({ ...check.data, modelType: req.user.plan });
    success(res, { text });
  } catch (err) {
    req.log.error({ err }, "Generate cover letter error");
    serverError(res, "AI generation failed");
  }
});

router.post("/ai/optimize-resume", authMiddleware, requirePro, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{
    resumeText: string;
    jobDescription: string;
  }>(req.body, ["resumeText", "jobDescription"]);

  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }

  try {
    const result = await optimizeResume({ ...check.data, modelType: req.user.plan });
    success(res, result);
  } catch (err) {
    req.log.error({ err }, "Optimize resume error");
    serverError(res, "AI generation failed");
  }
});

router.post("/ai/linkedin-summary", authMiddleware, requirePro, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{ resumeData: Record<string, unknown> }>(req.body, ["resumeData"]);

  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }

  try {
    const text = await generateLinkedInSummary(check.data.resumeData, req.user.plan);
    success(res, { text });
  } catch (err) {
    req.log.error({ err }, "Generate LinkedIn summary error");
    serverError(res, "AI generation failed");
  }
});

router.post("/ai/interview-questions", authMiddleware, requirePro, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{
    jobTitle: string;
    jobDescription: string;
  }>(req.body, ["jobTitle", "jobDescription"]);

  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }

  try {
    const questions = await generateInterviewQuestions({ ...check.data, modelType: req.user.plan });
    success(res, { questions });
  } catch (err) {
    req.log.error({ err }, "Generate interview questions error");
    serverError(res, "AI generation failed");
  }
});

router.post(
  "/ai/parse-resume",
  authMiddleware,
  upload.single("resume"),
  async (req: AuthenticatedRequest, res) => {
    const file = (req as AuthenticatedRequest & { file?: Express.Multer.File }).file;
    if (!file) {
      badRequest(res, "No file uploaded");
      return;
    }
    if (!file.mimetype.includes("pdf") && !file.originalname.toLowerCase().endsWith(".pdf")) {
      badRequest(res, "Only PDF files are supported");
      return;
    }
    try {
      const pdfMod = await import("pdf-parse") as unknown as { default: (buf: Buffer) => Promise<{ text: string }> } | ((buf: Buffer) => Promise<{ text: string }>);
      const pdfParse = typeof pdfMod === "function" ? pdfMod : (pdfMod as { default: (buf: Buffer) => Promise<{ text: string }> }).default;
      const pdfData = await pdfParse(file.buffer);
      if (!pdfData.text || pdfData.text.trim().length < 50) {
        res.status(422).json({ error: "Could not extract text from PDF. Please ensure the PDF contains selectable text." });
        return;
      }
      const parsedData = await parseResumeFromText(pdfData.text, req.user.plan);
      success(res, { data: parsedData, rawText: pdfData.text.slice(0, 3000) });
    } catch (err) {
      req.log.error({ err }, "Parse resume error");
      serverError(res, "Failed to parse resume. Please try a different file.");
    }
  }
);

router.post("/ai/ats-boost", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{
    resumeData: ResumeData;
    jobDescription?: string;
  }>(req.body, ["resumeData"]);

  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }

  try {
    const result = await atsBoostResume({ ...check.data, modelType: req.user.plan });
    success(res, result);
  } catch (err) {
    req.log.error({ err }, "ATS boost error");
    serverError(res, "AI optimization failed");
  }
});

router.post("/ai/ats-analyze", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{
    resumeText: string;
    jobDescription?: string;
  }>(req.body, ["resumeText"]);

  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }

  const { resumeText, jobDescription } = check.data;

  if (resumeText.trim().length < 50) {
    badRequest(res, "Please provide a resume with at least 50 characters.");
    return;
  }

  try {
    const result = await deepATSAnalysis({ resumeText, jobDescription, modelType: req.user.plan });
    success(res, result);
  } catch (err) {
    req.log.error({ err }, "Deep ATS analysis error");
    serverError(res, "AI analysis failed");
  }
});

router.post("/ai/career-roadmap", authMiddleware, requirePro, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{ resumeData: ResumeData; targetRole: string }>(req.body, ["resumeData", "targetRole"]);
  if (!check.valid) {
    badRequest(res, `Missing fields: ${check.missing.join(", ")}`);
    return;
  }
  try {
    const roadmap = await generateCareerRoadmap({ ...check.data, modelType: req.user.plan });
    success(res, roadmap);
  } catch (err) {
    req.log.error({ err }, "Career roadmap error");
    serverError(res, "Failed to generate roadmap");
  }
});

router.post("/ai/interview/chat", authMiddleware, requirePro, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{
    jobTitle: string;
    jobDescription: string;
    resumeData: ResumeData;
    chatHistory: any[];
  }>(req.body, ["jobTitle", "jobDescription", "resumeData", "chatHistory"]);

  if (!check.valid) {
    badRequest(res, `Missing fields: ${check.missing.join(", ")}`);
    return;
  }

  try {
    const reply = await conductMockInterview({ ...check.data, modelType: req.user.plan });
    success(res, { reply });
  } catch (err) {
    req.log.error({ err }, "Mock interview error");
    serverError(res, "Failed to get AI reply");
  }
});

router.post("/ai/linkedin-analyze", authMiddleware, requirePro, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{ profileText: string; resumeData: ResumeData }>(req.body, ["profileText", "resumeData"]);
  if (!check.valid) {
    badRequest(res, `Missing fields: ${check.missing.join(", ")}`);
    return;
  }
  try {
    const analysis = await analyzeLinkedInProfile({ ...check.data, modelType: req.user.plan });
    success(res, analysis);
  } catch (err) {
    req.log.error({ err }, "LinkedIn analysis error");
    serverError(res, "Failed to analyze LinkedIn profile");
  }
});

export default router;
