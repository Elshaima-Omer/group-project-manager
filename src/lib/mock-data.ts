// Realistic mock data for ScholarSync platform

export type ProjectType = "Coding" | "Report Writing" | "Presentation" | "Research" | "Design" | "Data Analysis";
export type ProjectStatus = "Active" | "Completed" | "Pending" | "Delayed";
export type TaskStatus = "Pending" | "In Progress" | "Submitted" | "Approved";
export type Priority = "Low" | "Medium" | "High";

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "Leader" | "Member";
  contribution: number;
  progress: number;
  skills: string[];
}

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  assigneeName: string;
  deadline: string;
  status: TaskStatus;
  progress: number;
  priority: Priority;
}

export interface Submission {
  id: string;
  taskTitle: string;
  member: string;
  fileName: string;
  uploadedAt: string;
  status: "Pending" | "Accepted" | "Needs Changes";
}

export interface JoinRequest {
  id: string;
  studentName: string;
  email: string;
  avatar: string;
  message: string;
  requestedAt: string;
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType[];
  deadline: string;
  status: ProjectStatus;
  myRole: "Leader" | "Member";
  progress: number;
  myProgress: number;
  description: string;
  members: Member[];
  tasks: Task[];
  submissions: Submission[];
  joinRequests: JoinRequest[];
  milestones: { title: string; date: string; done: boolean }[];
  password: string;
}

const avatar = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

const sampleMembers: Member[] = [
  { id: "u1", name: "Aisha Khan", email: "aisha@uni.edu", avatar: avatar("aisha"), role: "Leader", contribution: 32, progress: 78, skills: ["Frontend", "Design"] },
  { id: "u2", name: "Marco Rossi", email: "marco@uni.edu", avatar: avatar("marco"), role: "Member", contribution: 24, progress: 65, skills: ["Backend", "Database"] },
  { id: "u3", name: "Priya Patel", email: "priya@uni.edu", avatar: avatar("priya"), role: "Member", contribution: 22, progress: 70, skills: ["Research", "Writing"] },
  { id: "u4", name: "Liam Chen", email: "liam@uni.edu", avatar: avatar("liam"), role: "Member", contribution: 22, progress: 55, skills: ["Testing", "Storytelling"] },
];

const tasksFor = (members: Member[]): Task[] => [
  { id: "t1", title: "Design landing page mockup", assigneeId: members[0].id, assigneeName: members[0].name, deadline: "2026-05-14", status: "Approved", progress: 100, priority: "High" },
  { id: "t2", title: "Set up authentication API", assigneeId: members[1].id, assigneeName: members[1].name, deadline: "2026-05-17", status: "In Progress", progress: 60, priority: "High" },
  { id: "t3", title: "Write literature review", assigneeId: members[2].id, assigneeName: members[2].name, deadline: "2026-05-19", status: "Submitted", progress: 100, priority: "Medium" },
  { id: "t4", title: "Build dashboard components", assigneeId: members[0].id, assigneeName: members[0].name, deadline: "2026-05-21", status: "In Progress", progress: 45, priority: "High" },
  { id: "t5", title: "Database schema design", assigneeId: members[1].id, assigneeName: members[1].name, deadline: "2026-05-15", status: "Approved", progress: 100, priority: "Medium" },
  { id: "t6", title: "User testing sessions", assigneeId: members[3].id, assigneeName: members[3].name, deadline: "2026-05-23", status: "Pending", progress: 0, priority: "Low" },
  { id: "t7", title: "Final presentation slides", assigneeId: members[3].id, assigneeName: members[3].name, deadline: "2026-05-25", status: "Pending", progress: 10, priority: "Medium" },
  { id: "t8", title: "Integrate AI summary endpoint", assigneeId: members[1].id, assigneeName: members[1].name, deadline: "2026-05-20", status: "Submitted", progress: 100, priority: "High" },
];

export const mockProjects: Project[] = [
  {
    id: "PRJ-2284",
    title: "AI-Powered Campus Navigation App",
    type: ["Coding", "Design", "Research"],
    deadline: "2026-05-25",
    status: "Active",
    myRole: "Leader",
    progress: 68,
    myProgress: 78,
    description: "A mobile-first navigation system using indoor positioning and ML-driven route suggestions tailored to student schedules.",
    members: sampleMembers,
    tasks: tasksFor(sampleMembers),
    submissions: [
      { id: "s1", taskTitle: "Write literature review", member: "Priya Patel", fileName: "lit-review-v2.pdf", uploadedAt: "2 hours ago", status: "Pending" },
      { id: "s2", taskTitle: "Integrate AI summary endpoint", member: "Marco Rossi", fileName: "ai-endpoint.zip", uploadedAt: "Yesterday", status: "Pending" },
      { id: "s3", taskTitle: "Design landing page mockup", member: "Aisha Khan", fileName: "landing-mockup.fig", uploadedAt: "3 days ago", status: "Accepted" },
    ],
    joinRequests: [
      { id: "j1", studentName: "Sofia Müller", email: "sofia@uni.edu", avatar: avatar("sofia"), message: "I'd love to contribute on the design side.", requestedAt: "1 hour ago" },
      { id: "j2", studentName: "Daniel Park", email: "daniel@uni.edu", avatar: avatar("daniel"), message: "Strong backend skills, happy to help.", requestedAt: "5 hours ago" },
    ],
    milestones: [
      { title: "Research & Discovery", date: "2026-05-05", done: true },
      { title: "Design Sprint", date: "2026-05-12", done: true },
      { title: "MVP Build", date: "2026-05-20", done: false },
      { title: "User Testing", date: "2026-05-23", done: false },
      { title: "Final Submission", date: "2026-05-25", done: false },
    ],
    password: "campus2026",
  },
  {
    id: "PRJ-2305",
    title: "Sustainable Urban Mobility Report",
    type: ["Report Writing", "Research", "Data Analysis"],
    deadline: "2026-06-02",
    status: "Active",
    myRole: "Member",
    progress: 42,
    myProgress: 55,
    description: "Comprehensive analysis of sustainable transit alternatives across European university towns with policy recommendations.",
    members: sampleMembers.map((m, i) => ({ ...m, role: i === 1 ? "Leader" : "Member" })),
    tasks: tasksFor(sampleMembers).slice(0, 5),
    submissions: [],
    joinRequests: [],
    milestones: [
      { title: "Topic approval", date: "2026-05-08", done: true },
      { title: "Data collection", date: "2026-05-22", done: false },
      { title: "Draft submission", date: "2026-05-28", done: false },
      { title: "Final report", date: "2026-06-02", done: false },
    ],
    password: "mobility25",
  },
  {
    id: "PRJ-2318",
    title: "Quantum Algorithms Presentation",
    type: ["Presentation", "Research"],
    deadline: "2026-05-18",
    status: "Delayed",
    myRole: "Member",
    progress: 35,
    myProgress: 40,
    description: "Final presentation on Shor's and Grover's algorithms with live demonstrations using IBM Qiskit.",
    members: sampleMembers.slice(0, 3),
    tasks: tasksFor(sampleMembers).slice(2, 6),
    submissions: [],
    joinRequests: [],
    milestones: [
      { title: "Slide outline", date: "2026-05-10", done: true },
      { title: "Demo prep", date: "2026-05-15", done: false },
      { title: "Final presentation", date: "2026-05-18", done: false },
    ],
    password: "quantum01",
  },
];

export const mockNotifications = [
  { id: "n1", title: "New join request", message: "Sofia Müller wants to join Campus Navigation App", time: "1h ago", type: "info" as const },
  { id: "n2", title: "Submission received", message: "Priya submitted Literature Review for approval", time: "2h ago", type: "success" as const },
  { id: "n3", title: "Deadline approaching", message: "MVP Build milestone due in 3 days", time: "5h ago", type: "warning" as const },
  { id: "n4", title: "Task approved", message: "Your design mockup was approved by leader", time: "Yesterday", type: "success" as const },
];

export const mockUpcomingDeadlines = [
  { title: "Build dashboard components", project: "Campus Nav", date: "May 21", days: 12 },
  { title: "Data collection phase", project: "Mobility Report", date: "May 22", days: 13 },
  { title: "Demo prep", project: "Quantum Algorithms", date: "May 15", days: 6 },
];

export const skillsByType: Record<ProjectType, string[]> = {
  Coding: ["Frontend", "Backend", "Database", "Testing", "DevOps", "Mobile"],
  "Report Writing": ["Research", "Proofreading", "Editing", "Referencing", "Academic Writing"],
  Presentation: ["Slide Design", "Storytelling", "Public Speaking", "Visual Design"],
  Research: ["Data Gathering", "Analysis", "Critical Thinking", "Literature Review"],
  Design: ["UI Design", "UX Research", "Prototyping", "Illustration", "Branding"],
  "Data Analysis": ["Statistics", "Python", "Visualization", "Machine Learning", "SQL"],
};

export const mockProfessorProjects = mockProjects.map((p) => ({
  ...p,
  course: "CS-498 Capstone",
  leader: p.members.find((m) => m.role === "Leader")?.name ?? "—",
  deadlinesMet: Math.floor(p.progress / 25),
  deadlinesMissed: p.status === "Delayed" ? 2 : 0,
}));

export const currentUser = {
  name: "Aisha Khan",
  email: "aisha@uni.edu",
  avatar: avatar("aisha"),
  role: "student" as "student" | "professor",
  university: "Northbridge University",
};
