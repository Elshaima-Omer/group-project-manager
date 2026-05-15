import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

console.log("🔑 Gemini API Key loaded:", apiKey ? "YES ✅" : "NO ❌");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

function parseAiJson<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (firstError) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw firstError;
  }
}

function safeSlice(text: string | undefined, limit: number): string {
  return text ? `${text.slice(0, limit)}${text.length > limit ? "..." : ""}` : "";
}

function extractKeywordTokens(text: string): string[] {
  const tokens = Array.from(new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 4 && !["project", "group", "student", "university", "report", "presentation", "research", "design", "coding", "analysis", "deadline", "class"].includes(token))
  ));
  return tokens.slice(0, 8);
}

function prioritizeKeywords(title: string, types: string[], description: string, extractedText?: string): string[] {
  const source = [title, types.join(" "), description, extractedText].filter(Boolean).join(" ");
  return extractKeywordTokens(source);
}

function textBasedTag(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes("cyber")) return "Cybersecurity";
  if (lower.includes("present")) return "Presentation";
  if (lower.includes("report")) return "Report Writing";
  if (lower.includes("research")) return "Research";
  if (lower.includes("design")) return "Design";
  if (lower.includes("data")) return "Data Analysis";
  if (lower.includes("code")) return "Coding";
  return type;
}

function buildTasks(types: string[], keywords: string[]): string[] {
  const taskSets: Record<string, string[]> = {
    Cybersecurity: [
      "Conduct threat modeling and risk assessment",
      "Perform vulnerability scanning and penetration testing",
      "Document security controls and mitigation steps",
      "Review compliance requirements and policies",
      "Prepare a security incident response plan",
    ],
    Presentation: [
      "Draft the presentation structure and key messages",
      "Design slides with visuals and consistent branding",
      "Rehearse the delivery and transitions",
      "Gather speaker notes and supporting examples",
      "Prepare Q&A responses and handouts",
    ],
    "Report Writing": [
      "Outline the report sections and research goals",
      "Collect source material and citations",
      "Write the introduction, findings, and conclusion",
      "Edit for clarity, grammar, and format",
      "Prepare the final document for submission",
    ],
    Research: [
      "Define the research question and scope",
      "Collect data and relevant literature",
      "Analyze findings and identify trends",
      "Summarize insights and conclusions",
      "Prepare references and appendices",
    ],
    Design: [
      "Conduct user research and gather requirements",
      "Create wireframes or sketches",
      "Design visual mockups and prototypes",
      "Test concepts with feedback sessions",
      "Refine designs and prepare handoff assets",
    ],
    "Data Analysis": [
      "Gather datasets and clean the data",
      "Explore trends with charts and summaries",
      "Build models or calculations",
      "Interpret results and draw conclusions",
      "Prepare visualizations and insights",
    ],
    Coding: [
      "Set up the repository and development environment",
      "Implement core features with proper structure",
      "Write tests and verify functionality",
      "Fix bugs and polish the user experience",
      "Deploy or package the final solution",
    ],
  };

  const normalizedTypes = Array.from(new Set(types.map(textBasedTag)));
  const baseTasks = normalizedTypes.flatMap((type) => taskSets[type] || []);
  const keywordTasks = keywords.map((keyword) => `Incorporate ${keyword} into the project deliverables`);
  const combined = [...baseTasks, ...keywordTasks];
  return Array.from(new Set(combined)).slice(0, 6);
}

function buildSkills(types: string[], keywords: string[]): string[] {
  const skillSets: Record<string, string[]> = {
    Cybersecurity: ["Risk Analysis", "Network Security", "Threat Modeling", "Incident Response"],
    Presentation: ["Storytelling", "Slide Design", "Public Speaking", "Audience Engagement"],
    "Report Writing": ["Research", "Editing", "Formatting", "Referencing"],
    Research: ["Data Collection", "Critical Thinking", "Analysis", "Documentation"],
    Design: ["UI/UX", "Prototyping", "Visual Design", "User Testing"],
    "Data Analysis": ["Statistics", "Data Visualization", "Spreadsheet Skills", "Python"],
    Coding: ["Frontend", "Backend", "Database", "Testing"],
  };

  const normalizedTypes = Array.from(new Set(types.map(textBasedTag)));
  const baseSkills = normalizedTypes.flatMap((type) => skillSets[type] || []);
  const keywordSkills = keywords.map((keyword) => `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Awareness`);
  return Array.from(new Set([...baseSkills, ...keywordSkills])).slice(0, 5);
}

function buildTimeline(types: string[], deadline?: string): string[] {
  const normalizedTypes = Array.from(new Set(types.map(textBasedTag)));
  const hasPresentation = normalizedTypes.includes("Presentation");
  const hasCyber = normalizedTypes.includes("Cybersecurity");

  const baseTimeline = [
    "Week 1: Define scope and gather requirements",
    "Week 2: Develop core work and draft key deliverables",
    "Week 3: Review work, refine details, and incorporate feedback",
    "Week 4: Finalize deliverables, rehearse, and submit",
  ];

  if (hasPresentation) {
    return [
      "Week 1: Plan the presentation story and visuals",
      "Week 2: Build slides and supporting materials",
      "Week 3: Practice delivery and revise content",
      "Week 4: Final rehearsal and submission",
    ];
  }

  if (hasCyber) {
    return [
      "Week 1: Identify threats and define security scope",
      "Week 2: Perform security testing and analysis",
      "Week 3: Document findings and remediation steps",
      "Week 4: Review controls and finalize the report",
    ];
  }

  return baseTimeline;
}

function buildMilestones(types: string[], keywords: string[]): string[] {
  const normalizedTypes = Array.from(new Set(types.map(textBasedTag)));
  const milestones: string[] = [];

  if (normalizedTypes.includes("Research")) {
    milestones.push("Complete literature review and initial data collection");
  }
  if (normalizedTypes.includes("Coding")) {
    milestones.push("Finish core implementation and initial testing");
  }
  if (normalizedTypes.includes("Design")) {
    milestones.push("Deliver first high-fidelity designs and prototypes");
  }
  if (normalizedTypes.includes("Presentation")) {
    milestones.push("Complete slide deck and run the first rehearsal");
  }
  if (normalizedTypes.includes("Cybersecurity")) {
    milestones.push("Finish threat assessment and security validation");
  }
  if (normalizedTypes.includes("Data Analysis")) {
    milestones.push("Present data insights and visualizations");
  }

  if (milestones.length === 0) {
    milestones.push("Define the project scope and complete the first draft");
  }

  if (keywords.length > 0) {
    milestones.push(`Incorporate key concepts like ${keywords.slice(0, 3).join(", ")}`);
  }

  return Array.from(new Set(milestones)).slice(0, 4);
}

function localProjectAnalysis(
  title: string,
  types: string[],
  description: string,
  extractedText?: string
): { tasks: string[]; timeline: string[]; skills: string[]; milestones: string[] } {
  const keywords = prioritizeKeywords(title, types, description, extractedText);
  return {
    tasks: buildTasks(types, keywords),
    timeline: buildTimeline(types),
    skills: buildSkills(types, keywords),
    milestones: buildMilestones(types, keywords),
  };
}

function isQuotaError(err: any): boolean {
  const message = String(err?.message || err || "").toLowerCase();
  return message.includes("429") || message.includes("quota") || message.includes("rate limit") || message.includes("too many requests");
}

export async function analyzeProject(
  title: string,
  types: string[],
  description: string,
  fileName?: string,
  extractedText?: string,
  deadline?: string
): Promise<{ tasks: string[]; timeline: string[]; skills: string[]; milestones: string[]; warning?: string }> {
  console.log("📊 analyzeProject called with:", { title, types, description, fileName, extractedText: safeSlice(extractedText, 150) });

  const textSummary = extractedText ? safeSlice(extractedText, 1500) : "No extracted file content provided.";
  const prompt = `Return only a JSON object with keys tasks, timeline, skills, milestones. No extra text, no markdown.
Project title: ${title || "Group Project"}
Types: ${types.join(", ") || "General"}
Deadline: ${deadline || "Flexible"}
Description: ${description || "No description provided."}
Extracted project text: ${textSummary}

Use the project type and keywords to generate dynamic tasks, skills, timeline, and milestones.`;

  try {
    console.log("🚀 Calling Gemini API...");
    console.log("📤 Gemini prompt length:", prompt.length);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("📥 Gemini raw response:", text);
    const parsed = parseAiJson<{ tasks: string[]; timeline: string[]; skills: string[]; milestones: string[] }>(text);
    console.log("✅ Parsed result:", parsed);
    return parsed;
  } catch (err) {
    console.error("❌ Gemini API error:", err);
    if (isQuotaError(err)) {
      console.warn("⚠️ Gemini quota limit detected, using local fallback analysis.");
      return {
        ...localProjectAnalysis(title, types, description, extractedText),
        warning: "AI service busy, please try again in 1 minute.",
      };
    }
    console.warn("⚠️ Gemini failed, using local fallback analysis.");
    return localProjectAnalysis(title, types, description, extractedText);
  }
}

export async function generateReport(
  projectTitle: string,
  projectType: string[],
  overallProgress: number,
  totalTasks: number,
  completedTasks: number,
  deadline: string,
  memberData: { name: string; role: string; totalTasks: number; completedTasks: number; progress: number; skills: string[] }[]
): Promise<{ summary: string; memberEvaluations: any[]; grades: any; recommendation: string }> {
  console.log("📋 generateReport called");

  const prompt = `You are a university professor assistant. Generate a professional project evaluation report and return ONLY a JSON object with no extra text, no markdown, no backticks:
{
  "summary": "2-3 paragraph professional evaluation of the project and team performance",
  "memberEvaluations": [
    {"name": "student name", "evaluation": "one sentence evaluation", "contribution": number_0_to_100}
  ],
  "grades": {
    "collaboration": "A/B/C grade",
    "timeliness": "A/B/C grade",
    "quality": "A/B/C grade",
    "innovation": "A/B/C grade"
  },
  "recommendation": "one sentence recommendation for the professor"
}

Project: ${projectTitle}
Type: ${projectType.join(", ")}
Overall Progress: ${overallProgress}%
Total Tasks: ${totalTasks}
Completed Tasks: ${completedTasks}
Deadline: ${deadline}

Team Members:
${memberData.map((m) => `- ${m.name} (${m.role}): ${m.completedTasks}/${m.totalTasks} tasks done, ${m.progress}% progress, skills: ${m.skills.join(", ")}`).join("\n")}`;

  try {
    console.log("🚀 Calling Gemini API for report...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("📥 Gemini report response:", text);
    return parseAiJson<{ summary: string; memberEvaluations: any[]; grades: any; recommendation: string }>(text);
  } catch (err) {
    console.error("❌ Gemini report error:", err);
    return {
      summary: "The team worked collaboratively on this project. Progress has been tracked and tasks were distributed based on member skills.",
      memberEvaluations: memberData.map((m) => ({
        name: m.name,
        evaluation: `${m.name} completed ${m.completedTasks} out of ${m.totalTasks} tasks with ${m.progress}% progress.`,
        contribution: m.progress,
      })),
      grades: { collaboration: "B", timeliness: "B", quality: "B", innovation: "B" },
      recommendation: "Continue monitoring team progress and ensure all tasks are completed before the deadline.",
    };
  }
}

export async function divideTasks(
  members: { name: string; skills: string[] }[],
  projectTitle: string,
  projectTypes: string[],
  tasks: string[]
): Promise<{ assignments: { task: string; assignedTo: string; reason: string }[] }> {
  console.log("🎯 divideTasks called");

  const prompt = `You are a university project manager. Assign tasks to team members based on their skills. Return ONLY a JSON object with no extra text, no markdown, no backticks:
{
  "assignments": [
    {"task": "task name", "assignedTo": "member name", "reason": "one sentence reason"}
  ]
}

Project: ${projectTitle}
Types: ${projectTypes.join(", ")}

Team Members and Skills:
${members.map((m) => `- ${m.name}: ${m.skills.join(", ")}`).join("\n")}

Tasks to assign:
${tasks.map((t) => `- ${t}`).join("\n")}`;

  try {
    console.log("🚀 Calling Gemini API for task division...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("📥 Gemini division response:", text);
    return parseAiJson<{ assignments: { task: string; assignedTo: string; reason: string }[] }>(text);
  } catch (err) {
    console.error("❌ Gemini division error:", err);
    return {
      assignments: tasks.map((task, i) => ({
        task,
        assignedTo: members[i % members.length]?.name || "Unassigned",
        reason: "Assigned based on availability.",
      })),
    };
  }
}