import { FREE_RESUME_LIMIT, FREE_COVER_LETTER_LIMIT } from "@/context/AuthContext";

export type Feature = 
  | "resume_create" 
  | "cover_letter_create" 
  | "ai_optimize" 
  | "ai_linkedin" 
  | "ai_interview" 
  | "ai_summary_regenerate";

interface UserProfile {
  plan: "free" | "pro";
  usageResumeCount: number;
  usageCoverLetterCount: number;
}

export function isFeatureLocked(feature: Feature, profile: UserProfile | null): boolean {
  if (!profile) return true; // Lock everything if no profile
  if (profile.plan === "pro") return false; // Pro users have no locks

  switch (feature) {
    case "resume_create":
      return profile.usageResumeCount >= FREE_RESUME_LIMIT;
    case "cover_letter_create":
      return profile.usageCoverLetterCount >= FREE_COVER_LETTER_LIMIT;
    case "ai_optimize":
    case "ai_linkedin":
    case "ai_interview":
      return true; // Hard locked for free users
    case "ai_summary_regenerate":
      // Maybe allow limited regenerations? For now, hard lock
      return true;
    default:
      return false;
  }
}

export function getFeatureLockReason(feature: Feature): string {
  switch (feature) {
    case "resume_create":
      return `You've reached the free limit of ${FREE_RESUME_LIMIT} resumes.`;
    case "cover_letter_create":
      return `You've reached the free limit of ${FREE_COVER_LETTER_LIMIT} cover letters.`;
    case "ai_optimize":
      return "Resume Optimization with ATS analysis is a Pro feature.";
    case "ai_linkedin":
      return "LinkedIn Summary Generator is a Pro feature.";
    case "ai_interview":
      return "Interview Question Generator is a Pro feature.";
    default:
      return "Upgrade to Pro to unlock this feature.";
  }
}
