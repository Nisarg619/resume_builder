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
  type ResumeData,
} from "../lib/claude.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post("/ai/resume-summary", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { fullName, jobTitle, yearsExperience, skills, highlights } = req.body as {
    fullName: string;
    jobTitle: string;
    yearsExperience?: string;
    skills?: string[];
    highlights?: string;
  };

  try {
    const text = await generateResumeSummary({ fullName, jobTitle, yearsExperience, skills, highlights });
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "Generate resume summary error");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.post("/ai/job-bullets", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { jobTitle, company, responsibilities } = req.body as {
    jobTitle: string;
    company?: string;
    responsibilities: string;
  };

  try {
    const bullets = await generateJobBullets({ jobTitle, company, responsibilities });
    res.json({ bullets });
  } catch (err) {
    req.log.error({ err }, "Generate job bullets error");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.post("/ai/cover-letter", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { jobTitle, companyName, jobDescription, resumeData } = req.body as {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    resumeData?: Record<string, unknown>;
  };

  try {
    const text = await generateCoverLetter({ jobTitle, companyName, jobDescription, resumeData });
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "Generate cover letter error");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.post("/ai/optimize-resume", authMiddleware, requirePro, async (req: AuthenticatedRequest, res) => {
  const { resumeText, jobDescription } = req.body as {
    resumeText: string;
    jobDescription: string;
  };

  try {
    const result = await optimizeResume({ resumeText, jobDescription });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Optimize resume error");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.post("/ai/linkedin-summary", authMiddleware, requirePro, async (req: AuthenticatedRequest, res) => {
  const { resumeData } = req.body as { resumeData: Record<string, unknown> };

  try {
    const text = await generateLinkedInSummary(resumeData);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "Generate LinkedIn summary error");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.post("/ai/interview-questions", authMiddleware, requirePro, async (req: AuthenticatedRequest, res) => {
  const { jobTitle, jobDescription } = req.body as {
    jobTitle: string;
    jobDescription: string;
  };

  try {
    const questions = await generateInterviewQuestions({ jobTitle, jobDescription });
    res.json({ questions });
  } catch (err) {
    req.log.error({ err }, "Generate interview questions error");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.post(
  "/ai/parse-resume",
  authMiddleware,
  upload.single("resume"),
  async (req: AuthenticatedRequest, res) => {
    const file = (req as AuthenticatedRequest & { file?: Express.Multer.File }).file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    if (!file.mimetype.includes("pdf") && !file.originalname.toLowerCase().endsWith(".pdf")) {
      res.status(400).json({ error: "Only PDF files are supported" });
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
      const parsedData = await parseResumeFromText(pdfData.text);
      res.json({ data: parsedData, rawText: pdfData.text.slice(0, 3000) });
    } catch (err) {
      req.log.error({ err }, "Parse resume error");
      res.status(500).json({ error: "Failed to parse resume. Please try a different file." });
    }
  }
);

router.post("/ai/ats-boost", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { resumeData, jobDescription } = req.body as {
    resumeData: ResumeData;
    jobDescription?: string;
  };

  if (!resumeData) {
    res.status(400).json({ error: "resumeData is required" });
    return;
  }

  try {
    const result = await atsBoostResume({ resumeData, jobDescription });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "ATS boost error");
    res.status(500).json({ error: "AI optimization failed" });
  }
});

export default router;
