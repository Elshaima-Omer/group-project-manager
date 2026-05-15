import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function analyzeProject(
  title: string,
  types: string[],
  description: string
): Promise<{ tasks: string[]; timeline: string[]; skills: string[]; milestones: string[] }> {
  const prompt = `You are a university project manager. Analyze this project and return ONLY a JSON object with no extra text, no markdown, no backticks:
{
  "tasks": ["task1", "task2", "task3", "task4", "task5", "task6"],
  "timeline": ["Week 1: ...", "Week 2: ...", "Week 3: ...", "Week 4: ..."],
  "skills": ["skill1", "skill2", "skill3", "skill4"],
  "milestones": ["milestone1", "milestone2", "milestone3"]
}

Project title: ${title || "University Group Project"}
Project types: ${types.join(", ")}
Description: ${description || "A university group project"}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    // Fallback if API fails
    return {
      tasks: ["Research user needs", "Design mockups", "Build core features", "Testing", "Documentation", "Final submission"],
      timeline: ["Week 1: Discovery", "Week 2-3: Design & Build", "Week 4: Testing", "Week 5: Submission"],
      skills: ["Research", "Design", "Development", "Testing"],
      milestones: ["Project kickoff", "First draft complete", "Final review", "Submission"],
    };
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
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
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
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    return {
      assignments: tasks.map((task, i) => ({
        task,
        assignedTo: members[i % members.length]?.name || "Unassigned",
        reason: "Assigned based on availability.",
      })),
    };
  }
}