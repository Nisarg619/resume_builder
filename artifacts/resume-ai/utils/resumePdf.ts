import { Platform } from "react-native";
import type { ResumeData } from "@/context/ResumeContext";

const TEMPLATE_COLORS: Record<string, string> = {
  modern: "#1A237E",
  classic: "#212121",
  minimal: "#37474F",
  creative: "#4A148C",
};

export function buildResumeHtml(resume: ResumeData, title: string): string {
  const accent = TEMPLATE_COLORS[resume.template] ?? "#1A237E";
  const { personalInfo, summary, workExperience, education, skills } = resume;

  const contacts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.website,
    personalInfo.linkedin,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const expHtml = workExperience
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${e.jobTitle}${e.company ? ` — ${e.company}` : ""}</span>
          <span class="entry-date">${e.startDate}${e.startDate ? " – " : ""}${e.isCurrent ? "Present" : e.endDate}</span>
        </div>
        ${e.location ? `<div class="entry-sub">${e.location}</div>` : ""}
        <ul>${e.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
      </div>`
    )
    .join("");

  const projHtml = (resume.projects || [])
    .map(
      (p) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${p.title}</span>
          ${p.link ? `<span class="entry-date">${p.link}</span>` : ""}
        </div>
        ${p.technologies?.length ? `<div class="entry-sub">Tech: ${p.technologies.join(", ")}</div>` : ""}
        ${p.description ? `<p class="summary" style="margin-top: 4px">${p.description}</p>` : ""}
      </div>`
    )
    .join("");

  const eduHtml = education
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${e.degree}</span>
          <span class="entry-date">${e.graduationYear}</span>
        </div>
        <div class="entry-sub">${e.institution}${e.location ? `, ${e.location}` : ""}${e.gpa ? ` · GPA: ${e.gpa}` : ""}</div>
      </div>`
    )
    .join("");

  const certHtml = (resume.certifications || [])
    .map(
      (c) => `
      <div class="entry" style="margin-bottom: 6px;">
        <div class="entry-header">
          <span class="entry-title">${c.name}</span>
          <span class="entry-date">${c.date}</span>
        </div>
        <div class="entry-sub">${c.issuer}</div>
      </div>`
    )
    .join("");

  const achHtml = (resume.achievements || [])
    .map(
      (a) => `
      <div class="entry" style="margin-bottom: 6px;">
        <div class="entry-header">
          <span class="entry-title">${a.title}</span>
          <span class="entry-date">${a.date}</span>
        </div>
        ${a.description ? `<p class="summary" style="margin-top: 2px">${a.description}</p>` : ""}
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #222; background: #fff; padding: 32px 40px; max-width: 800px; margin: auto; }
  h1 { font-size: 22pt; color: ${accent}; margin-bottom: 2px; }
  .contacts { font-size: 9pt; color: #555; margin-bottom: 18px; }
  .section-title { font-size: 9pt; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: ${accent}; border-bottom: 1.5px solid ${accent}; padding-bottom: 2px; margin: 16px 0 8px; }
  .summary { font-size: 10.5pt; line-height: 1.6; color: #333; margin-bottom: 4px; }
  .entry { margin-bottom: 12px; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
  .entry-title { font-weight: bold; font-size: 11pt; }
  .entry-date { font-size: 9pt; color: #666; }
  .entry-sub { font-size: 9.5pt; color: #555; margin: 1px 0 4px; }
  ul { padding-left: 16px; margin-top: 4px; }
  li { font-size: 10.5pt; line-height: 1.55; color: #333; margin-bottom: 2px; }
  .skills { font-size: 10.5pt; color: #333; line-height: 1.6; }
  @media print { body { padding: 16px 24px; } }
</style>
</head>
<body>
  <h1>${personalInfo.fullName || "Resume"}</h1>
  ${contacts ? `<div class="contacts">${contacts}</div>` : ""}
  ${summary ? `<div class="section-title">Summary</div><p class="summary">${summary}</p>` : ""}
  ${workExperience.length ? `<div class="section-title">Experience</div>${expHtml}` : ""}
  ${resume.projects?.length ? `<div class="section-title">Projects</div>${projHtml}` : ""}
  ${education.length ? `<div class="section-title">Education</div>${eduHtml}` : ""}
  ${resume.certifications?.length ? `<div class="section-title">Certifications</div>${certHtml}` : ""}
  ${resume.achievements?.length ? `<div class="section-title">Achievements</div>${achHtml}` : ""}
  ${skills.length ? `<div class="section-title">Skills</div><p class="skills">${skills.join("  ·  ")}</p>` : ""}
</body>
</html>`;
}

export async function downloadResumePdf(resume: ResumeData, title: string): Promise<void> {
  const html = buildResumeHtml(resume, title);

  if (Platform.OS === "web") {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
    return;
  }

  const Print = await import("expo-print");
  const Sharing = await import("expo-sharing");

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Download ${title}`,
      UTI: "com.adobe.pdf",
    });
  } else {
    await Print.printAsync({ html });
  }
}
