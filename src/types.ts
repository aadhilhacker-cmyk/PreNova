export type UserRole = "student" | "trainer";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  isApproved?: boolean;
  avatar?: string;
  bio?: string;
  skills?: string[];
  pricing?: number;
  experience?: number;
  rating?: number;
  totalEarnings?: number;
}

export interface FeedbackReport {
  score: number;
  strengths: string[];
  weaknesses: string[];
  overallExplanation: string;
  improvementPath: string;
}

export interface BookingSession {
  id: string;
  studentId: string;
  studentName: string;
  trainerId: string;
  trainerName: string;
  dateTime: string;
  timeSlot: string;
  pricing: number;
  status: "pending" | "approved" | "rejected" | "completed";
  feedback?: FeedbackReport;
  rating?: number;
  review?: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface QuizQuestion {
  id: number;
  type: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  explanation: string;
}

export interface GrammarCorrection {
  original: string;
  correction: string;
  explanation: string;
}

export interface ResumeAnalysisResult {
  atsScore: number;
  skillsIdentified: string[];
  skillGaps: string[];
  suggestions: string[];
  missingKeywords: string[];
  grammarCorrections: GrammarCorrection[];
  jobDomainSuitability: {
    recommendedRoles: string[];
    overallAssessment: string;
  };
}

export interface ReportItem {
  id: string;
  reporterName: string;
  spammerName: string;
  reason: string;
  status: "pending" | "resolved";
}
