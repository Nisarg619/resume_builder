import { Router } from "express";
import { authMiddleware, requirePro, type AuthenticatedRequest } from "../middlewares/auth.js";
import {
  generateResumeSummary,
  generateJobBullets,
  generateCoverLetter,
  optimizeResume,
  generateLinkedInSummary,
  generateInterviewQuestions,
} from "../lib/claude.js";

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

export default router;
