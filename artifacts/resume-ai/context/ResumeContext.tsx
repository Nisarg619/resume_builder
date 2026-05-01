import React, { createContext, useContext, useState } from "react";

export interface WorkExperience {
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string;
  bullets: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  graduationYear: string;
  gpa: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
}

export type ResumeTemplate = "modern" | "classic" | "minimal" | "creative";

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  template: ResumeTemplate;
}

const defaultResumeData: ResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
  },
  summary: "",
  workExperience: [],
  education: [],
  skills: [],
  template: "modern",
};

interface ResumeContextType {
  currentResume: ResumeData;
  setCurrentResume: (data: ResumeData) => void;
  resetResume: () => void;
  resumeTitle: string;
  setResumeTitle: (t: string) => void;
  editingResumeId: string | null;
  setEditingResumeId: (id: string | null) => void;
}

const ResumeContext = createContext<ResumeContextType | null>(null);

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [currentResume, setCurrentResume] = useState<ResumeData>(defaultResumeData);
  const [resumeTitle, setResumeTitle] = useState("My Resume");
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);

  const resetResume = () => {
    setCurrentResume(defaultResumeData);
    setResumeTitle("My Resume");
    setEditingResumeId(null);
  };

  return (
    <ResumeContext.Provider value={{
      currentResume,
      setCurrentResume,
      resetResume,
      resumeTitle,
      setResumeTitle,
      editingResumeId,
      setEditingResumeId,
    }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used within ResumeProvider");
  return ctx;
}
