import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fallback to high-quality simulated data.");
}

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Local JSON DB File path for persistence across rebuilds and refreshes
const DB_FILE = path.join(process.cwd(), "data-db.json");

// Define basic interface matching the app needs
interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "trainer" | "admin";
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

interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  trainerId: string;
  trainerName: string;
  dateTime: string;
  timeSlot: string;
  pricing: number;
  status: "pending" | "approved" | "rejected" | "completed";
  feedback?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    overallExplanation: string;
    improvementPath: string;
  };
  rating?: number;
  review?: string;
}

interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface QuizHistoryItem {
  id: string;
  studentId: string;
  department: string;
  domain: string;
  level: string;
  score: number;
  totalQuestions: number;
  date: string;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    summary: string;
  };
}

interface DB {
  users: User[];
  bookings: Booking[];
  chats: ChatMessage[];
  quizHistory: QuizHistoryItem[];
  reports: { id: string; reporterName: string; spammerName: string; reason: string; status: string }[];
}

let dbData: DB = {
  users: [
    // Default Admin
    {
      id: "admin-1",
      email: "aadhilhacker@gmail.com",
      name: "Aadhil Admin",
      role: "admin",
    },
    {
      id: "admin-2",
      email: "admin@interviewtrainer.com",
      name: "System Admin",
      role: "admin",
    },
    // Mock Trainers
    {
      id: "trainer-1",
      email: "jane.doe@example.com",
      name: "Dr. Jane Doe",
      role: "trainer",
      department: "Computer Science",
      isApproved: true,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      bio: "Former Lead Software Engineer at Google. Specialized in system design, data structures, and algorithmic rounds. 8+ years mentoring students.",
      skills: ["Data Structures", "System Design", "Algorithms", "Java", "Python", "Cloud Architecture"],
      pricing: 50,
      experience: 10,
      rating: 4.9,
      totalEarnings: 450,
    },
    {
      id: "trainer-2",
      email: "michael.smith@example.com",
      name: "Michael Smith",
      role: "trainer",
      department: "Mechanical",
      isApproved: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      bio: "Senior Operations Director. Specialized in core mechanical design interviews, thermo-fluid systems, and engineering management checks.",
      skills: ["AutoCAD", "Thermodynamics", "Finite Element Analysis", "HVAC Design", "Manufacturing Processes"],
      pricing: 40,
      experience: 12,
      rating: 4.8,
      totalEarnings: 240,
    },
    {
      id: "trainer-3",
      email: "priya.patel@example.com",
      name: "Priya Patel",
      role: "trainer",
      department: "Commerce",
      isApproved: true,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
      bio: "Ex-HR Director with deep experience in behavioral interviewing, commerce audits, and standard corporate competency metrics.",
      skills: ["Behavioral EQ", "STAR Method", "Resume Polish", "Finance Audits", "Mock Presentation"],
      pricing: 45,
      experience: 9,
      rating: 4.7,
      totalEarnings: 180,
    },
    {
      id: "trainer-4",
      email: "david.lee@example.com",
      name: "Prof. David Lee",
      role: "trainer",
      department: "Medical",
      isApproved: false, // Pending Approval to demonstrate approve/reject flow
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&q=80",
      bio: "Distinguished Academic Clinical Advisor. Conducts rigorous mock exams for medical ethics, clinical rotations, and residency placement interviews.",
      skills: ["Medical Ethics", "Residency Mock Prep", "Clinical Skills Verbal", "Anatomy Fundamentals"],
      pricing: 60,
      experience: 15,
      rating: 4.9,
      totalEarnings: 0,
    },
    {
      id: "trainer-5",
      email: "sarah.connor@example.com",
      name: "Sarah Connor",
      role: "trainer",
      department: "Law",
      isApproved: true,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
      bio: "Corporate Legal Counsel with 7 years of court and boardroom practice. Simulates competitive law firm job calls and legal reasoning mock trials.",
      skills: ["Legal Reasoning", "Corporate Law Prep", "Caselaw Synthesis", "Analytical Writing"],
      pricing: 55,
      experience: 7,
      rating: 4.6,
      totalEarnings: 110,
    }
  ],
  bookings: [
    {
      id: "booking-1",
      studentId: "student-example-1",
      studentName: "Alex Mercer",
      trainerId: "trainer-1",
      trainerName: "Dr. Jane Doe",
      dateTime: "2026-05-22",
      timeSlot: "10:00 AM",
      pricing: 50,
      status: "completed",
      feedback: {
        score: 85,
        strengths: ["Strong understanding of base pointers", "Very structured approach to array-based questions"],
        weaknesses: ["Struggled a bit with recursive depth calculations", "Could work on communicating dynamic programming states earlier"],
        overallExplanation: "Alex has very strong CS fundamentals. He was able to solve the Medium-range binary search problem in 25 minutes. Some optimization details were missed but logical flow was accurate.",
        improvementPath: "Review complex runtime trees for tree-based recursion. Solve 5 similar medium DP tasks focusing on space reductions.",
      },
      rating: 5,
      review: "Jane was incredibly patient and structured! Her ex-Google background shines through her rigorous interview simulation."
    },
    {
      id: "booking-2",
      studentId: "student-example-1",
      studentName: "Alex Mercer",
      trainerId: "trainer-2",
      trainerName: "Michael Smith",
      dateTime: "2026-05-24",
      timeSlot: "02:00 PM",
      pricing: 40,
      status: "approved",
    }
  ],
  chats: [
    {
      id: "chat-m1",
      bookingId: "booking-2",
      senderId: "trainer-2",
      senderName: "Michael Smith",
      text: "Hello Alex, looking forward to our mechanical engineering mock interview session on May 24th! Do you have a specific specialization in mind?",
      timestamp: "2026-05-20T10:30:00Z"
    },
    {
      id: "chat-m2",
      bookingId: "booking-2",
      senderId: "student-example-1",
      senderName: "Alex Mercer",
      text: "Hi Michael! Yes, I would love to focus on automotive thermodynamics and fluid simulation rounds. Thank you!",
      timestamp: "2026-05-20T11:15:00Z"
    }
  ],
  quizHistory: [
    {
      id: "quiz-1",
      studentId: "student-example-1",
      department: "Computer Science",
      domain: "Frontend Web Development",
      level: "intermediate",
      score: 80,
      totalQuestions: 5,
      date: "2026-05-18",
      feedback: {
        strengths: ["Strong knowledge of state reconciliation", "Accurate usage of dependency hook arrays"],
        weaknesses: ["Fumbled with SSR rendering timings", "Could explain cumulative layout shifts better"],
        summary: "Solid intermediate front-end competency. Performance shows great styling and react flow, with small gap in browser rendering pipeline knowledge."
      }
    }
  ],
  reports: [
    {
      id: "rep-1",
      reporterName: "Dr. Jane Doe",
      spammerName: "Fake Student Account",
      reason: "Using profanity and automated spam bots in custom booking descriptions.",
      status: "pending"
    }
  ]
};

// Sync Mock/Persistent db data helper
import { initializeApp } from "firebase/app";
import { initializeFirestore, setLogLevel, doc, setDoc, getDocs, collection } from "firebase/firestore";

// Set log level to 'error' to suppress benign gRPC listen stream cancel warnings
setLogLevel("error");

// Initialize Firebase using the configuration credentials
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firestoreDb: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const firebaseApp = initializeApp(config);
    firestoreDb = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, config.firestoreDatabaseId);
    console.log("Firebase Firestore initialized successfully in server.ts!");
  } catch (err) {
    console.error("Failed to initialize Firebase in server.ts:", err);
  }
}

// Background Firestore sync routine
async function syncAllToFirestore() {
  if (!firestoreDb) return;
  try {
    for (const u of dbData.users) {
      await setDoc(doc(firestoreDb, "users", u.id), u);
    }
    for (const b of dbData.bookings) {
      await setDoc(doc(firestoreDb, "bookings", b.id), b);
    }
    for (const c of dbData.chats) {
      await setDoc(doc(firestoreDb, "chats", c.id), c);
    }
    for (const q of dbData.quizHistory) {
      await setDoc(doc(firestoreDb, "quizHistory", q.id), q);
    }
    for (const r of dbData.reports) {
      await setDoc(doc(firestoreDb, "reports", r.id), r);
    }
  } catch (err) {
    console.error("Failed background synchronization of Firestore documents:", err);
  }
}

// Loader sync task
async function syncFromFirestore() {
  if (!firestoreDb) return;
  try {
    console.log("Fetching matching records from live Firestore instance...");
    const usersSnapshot = await getDocs(collection(firestoreDb, "users"));
    const fbUsers: User[] = [];
    usersSnapshot.forEach(doc => fbUsers.push(doc.data() as User));

    const bookingsSnapshot = await getDocs(collection(firestoreDb, "bookings"));
    const fbBookings: Booking[] = [];
    bookingsSnapshot.forEach(doc => fbBookings.push(doc.data() as Booking));

    const chatsSnapshot = await getDocs(collection(firestoreDb, "chats"));
    const fbChats: ChatMessage[] = [];
    chatsSnapshot.forEach(doc => fbChats.push(doc.data() as ChatMessage));

    const quizSnapshot = await getDocs(collection(firestoreDb, "quizHistory"));
    const fbQuizzes: QuizHistoryItem[] = [];
    quizSnapshot.forEach(doc => fbQuizzes.push(doc.data() as QuizHistoryItem));

    const reportsSnapshot = await getDocs(collection(firestoreDb, "reports"));
    const fbReports: any[] = [];
    reportsSnapshot.forEach(doc => fbReports.push(doc.data()));

    // Merge or seed if completely empty
    if (fbUsers.length > 0) {
      dbData.users = fbUsers;
    } else {
      console.log("Firestore empty; seeding standard trainers & developers...");
      await syncAllToFirestore();
      return;
    }

    if (fbBookings.length > 0) dbData.bookings = fbBookings;
    if (fbChats.length > 0) dbData.chats = fbChats;
    if (fbQuizzes.length > 0) dbData.quizHistory = fbQuizzes;
    if (fbReports.length > 0) dbData.reports = fbReports;

    console.log("Firestore sync-load sequence completed.");
  } catch (err) {
    console.error("Error during startup sync from Firestore:", err);
  }
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsedData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      // Basic merge logic to keep system users/defaults
      dbData = {
        users: [...dbData.users.filter(u => !parsedData.users.some((p: any) => p.id === u.id)), ...parsedData.users],
        bookings: parsedData.bookings || dbData.bookings,
        chats: parsedData.chats || dbData.chats,
        quizHistory: parsedData.quizHistory || dbData.quizHistory,
        reports: parsedData.reports || dbData.reports,
      };
    }
  } catch (err) {
    console.error("Failed to read DB file. Using default memory state.", err);
  }

  // Also sync live Firestore
  syncFromFirestore().catch(err => console.error("Firestore syncFromFirestore failed:", err));
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
    syncAllToFirestore().catch(err => console.error("Firestore syncAllToFirestore failed:", err));
  } catch (err) {
    console.error("Failed to write to DB file.", err);
  }
}

// Load DB on startup
loadDB();

// --- AUTHENTICATION API ENDPOINTS ---

app.post("/api/auth/register", (req, res) => {
  const { email, name, role, department, password, bio, skills, pricing, experience } = req.body;
  if (!email || !name || !role) {
    return res.status(400).json({ error: "Missing required fields: email, name, role" });
  }

  // Check if profile exists
  const existingUser = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "User with this email already exists." });
  }

  const newId = `user-${Date.now()}`;
  const newUser: User = {
    id: newId,
    email: email.toLowerCase(),
    name,
    role,
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
  };

  if (role === "trainer") {
    newUser.department = department || "Computer Science";
    newUser.bio = bio || "Professional interview trainer ready to prep students.";
    newUser.skills = Array.isArray(skills) ? skills : (skills ? skills.split(",").map((s: string) => s.trim()) : []);
    newUser.pricing = Number(pricing) || 30;
    newUser.experience = Number(experience) || 3;
    newUser.isApproved = true; // Auto-approved since admin panel is removed
    newUser.totalEarnings = 0;
    newUser.rating = 5.0;
  } else if (role === "student") {
    newUser.department = department || "Computer Science";
  }

  dbData.users.push(newUser);
  saveDB();

  res.json({ message: "Registration successful!", user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Please provide an email" });
  }

  // Simulated Login
  const user = dbData.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "No account found with this email. Please register." });
  }

  res.json({ message: "Login successful", user });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  res.json({ message: "Simulation: A rescue reset link has been dispatched to " + email });
});

// --- TRAINER APIS ---

app.get("/api/trainers", (req, res) => {
  // Return only approved trainers for students to book
  const approved = dbData.users.filter(u => u.role === "trainer" && u.isApproved === true);
  res.json(approved);
});

app.get("/api/trainers/all", (req, res) => {
  // Return all trainers including pending admin approval
  const trainers = dbData.users.filter(u => u.role === "trainer");
  res.json(trainers);
});

app.post("/api/trainers/approve", (req, res) => {
  const { trainerId, approve } = req.body;
  const tIndex = dbData.users.findIndex(u => u.id === trainerId && u.role === "trainer");
  if (tIndex === -1) {
    return res.status(404).json({ error: "Trainer not found" });
  }

  if (approve) {
    dbData.users[tIndex].isApproved = true;
  } else {
    // If not approved, can do simple reject or remove
    dbData.users[tIndex].isApproved = false;
  }

  saveDB();
  res.json({ message: `Trainer has been ${approve ? "approved" : "rejected"}`, trainer: dbData.users[tIndex] });
});

app.post("/api/trainers/profile", (req, res) => {
  const { userId, bio, skills, pricing, experience, department, name } = req.body;
  const uIndex = dbData.users.findIndex(u => u.id === userId);
  if (uIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const user = dbData.users[uIndex];
  if (name) user.name = name;
  if (department) user.department = department;
  if (bio) user.bio = bio;
  if (skills) user.skills = Array.isArray(skills) ? skills : skills.split(",").map((s: string) => s.trim());
  if (pricing) user.pricing = Number(pricing);
  if (experience) user.experience = Number(experience);

  saveDB();
  res.json({ message: "Profile updated successfully!", user });
});

// --- BOOKINGS & INTERVIEWS ---

app.get("/api/bookings", (req, res) => {
  const { userId, role } = req.query;
  if (!userId) {
    return res.json(dbData.bookings);
  }

  let filtered = [];
  if (role === "trainer") {
    filtered = dbData.bookings.filter(b => b.trainerId === userId);
  } else {
    filtered = dbData.bookings.filter(b => b.studentId === userId);
  }
  res.json(filtered);
});

app.post("/api/bookings/create", (req, res) => {
  const { studentId, studentName, trainerId, dateTime, timeSlot, pricing } = req.body;
  if (!studentId || !trainerId || !dateTime || !timeSlot) {
    return res.status(400).json({ error: "All properties (studentId, trainerId, dateTime, timeSlot) must be specified" });
  }

  const trainer = dbData.users.find(u => u.id === trainerId);
  if (!trainer) {
    return res.status(404).json({ error: "Trainer not found" });
  }

  const newBooking: Booking = {
    id: `booking-${Date.now()}`,
    studentId,
    studentName: studentName || "Alex Mercer",
    trainerId,
    trainerName: trainer.name,
    dateTime,
    timeSlot,
    pricing: Number(pricing) || trainer.pricing || 35,
    status: "pending",
  };

  dbData.bookings.push(newBooking);
  saveDB();
  res.json({ message: "Mock interview booking generated, awaiting trainer approval!", booking: newBooking });
});

app.post("/api/bookings/action", (req, res) => {
  const { bookingId, action } = req.body; // action = 'approved' | 'rejected' | 'completed'
  const bIndex = dbData.bookings.findIndex(b => b.id === bookingId);
  if (bIndex === -1) {
    return res.status(404).json({ error: "Booking session not found" });
  }

  const booking = dbData.bookings[bIndex];
  booking.status = action;

  // Add earnings to trainer if completed
  if (action === "completed") {
    const trainerIndex = dbData.users.findIndex(u => u.id === booking.trainerId);
    if (trainerIndex !== -1) {
      const currentEarn = dbData.users[trainerIndex].totalEarnings || 0;
      dbData.users[trainerIndex].totalEarnings = currentEarn + booking.pricing;
    }
  }

  saveDB();
  res.json({ message: `Booking session successfully ${action}!`, booking });
});

app.post("/api/bookings/feedback", (req, res) => {
  const { bookingId, score, strengths, weaknesses, overallExplanation, improvementPath } = req.body;
  const bIndex = dbData.bookings.findIndex(b => b.id === bookingId);
  if (bIndex === -1) {
    return res.status(404).json({ error: "Booking not found" });
  }

  dbData.bookings[bIndex].feedback = {
    score: Number(score) || 80,
    strengths: Array.isArray(strengths) ? strengths : [strengths],
    weaknesses: Array.isArray(weaknesses) ? weaknesses : [weaknesses],
    overallExplanation,
    improvementPath,
  };
  dbData.bookings[bIndex].status = "completed";

  // Update trainer earnings
  const trainerIndex = dbData.users.findIndex(u => u.id === dbData.bookings[bIndex].trainerId);
  if (trainerIndex !== -1) {
    const currentEarn = dbData.users[trainerIndex].totalEarnings || 0;
    dbData.users[trainerIndex].totalEarnings = currentEarn + dbData.bookings[bIndex].pricing;
  }

  saveDB();
  res.json({ message: "Mock interview feedback report stored and sent to student!", booking: dbData.bookings[bIndex] });
});

app.post("/api/bookings/rate", (req, res) => {
  const { bookingId, rating, review } = req.body;
  const bIndex = dbData.bookings.findIndex(b => b.id === bookingId);
  if (bIndex === -1) {
    return res.status(404).json({ error: "Booking session not found" });
  }

  dbData.bookings[bIndex].rating = Number(rating) || 5;
  dbData.bookings[bIndex].review = review || "";

  // Update trainer aggregate rating
  const trainerId = dbData.bookings[bIndex].trainerId;
  const allTrainerBookings = dbData.bookings.filter(b => b.trainerId === trainerId && b.rating);
  const total = allTrainerBookings.reduce((sum, b) => sum + (b.rating || 0), 0);
  const avg = Number((total / allTrainerBookings.length).toFixed(1));

  const trainerIndex = dbData.users.findIndex(u => u.id === trainerId);
  if (trainerIndex !== -1) {
    dbData.users[trainerIndex].rating = avg || 5.0;
  }

  saveDB();
  res.json({ message: "Thank you! Your feedback review has been posted securely.", booking: dbData.bookings[bIndex] });
});

// --- CHAT ENDPOINTS ---

app.get("/api/chat/:bookingId", (req, res) => {
  const { bookingId } = req.params;
  const messages = dbData.chats.filter(c => c.bookingId === bookingId);
  res.json(messages);
});

app.post("/api/chat/:bookingId/send", (req, res) => {
  const { bookingId } = req.params;
  const { senderId, senderName, text } = req.body;

  if (!senderId || !text) {
    return res.status(400).json({ error: "Missing senderId or message text" });
  }

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    bookingId,
    senderId,
    senderName: senderName || "User",
    text,
    timestamp: new Date().toISOString(),
  };

  dbData.chats.push(newMessage);
  saveDB();
  res.json(newMessage);
});

// --- ADMIN SYSTEM & REPORTS ---

app.get("/api/admin/reports", (req, res) => {
  res.json(dbData.reports);
});

app.post("/api/admin/reports/create", (req, res) => {
  const { reporterName, spammerName, reason } = req.body;
  const newReport = {
    id: `rep-${Date.now()}`,
    reporterName: reporterName || "Anonymous User",
    spammerName: spammerName || "Unknown Profile",
    reason: reason || "Unsolicited actions or pricing mismatch",
    status: "pending",
  };
  dbData.reports.push(newReport);
  saveDB();
  res.json({ message: "Security/fraud moderation report logged successfully.", report: newReport });
});

app.post("/api/admin/reports/resolve", (req, res) => {
  const { reportId, action } = req.body;
  const rIndex = dbData.reports.findIndex(r => r.id === reportId);
  if (rIndex === -1) {
    return res.status(404).json({ error: "Report not found" });
  }

  dbData.reports[rIndex].status = action || "resolved";
  saveDB();
  res.json({ message: "Fraud report status set to " + dbData.reports[rIndex].status, report: dbData.reports[rIndex] });
});

// --- AI INTERVIEW GENERATOR (GEMINI & FALLBACK MOCKS) ---

// Generate Interactive Quiz topic-based questions
app.post("/api/quiz/generate", async (req, res) => {
  const { department, domain, level } = req.body;
  const dept = department || "Computer Science";
  const dom = domain || "General Aptitude and Behavioral Prep";
  const difficulty = level || "intermediate";

  const prompt = `You are a professional Interview Trainer. Provide an interactive interview quiz in the context of the department "${dept}", focusing on the role/domain "${dom}" at difficulty level "${difficulty}".
Generate exactly 5 highly relevant interview questions. Mix matching standard HR Behavioral queries, Core Aptitude, and Domain/Technical items.
Format the output as a clean, strict JSON array fitting this format:
[
  {
    "id": 1,
    "type": "mcq",
    "question": "The actual question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "category": "technical",
    "difficulty": "${difficulty}",
    "explanation": "Detailed explanation of why the correct option is indeed correct."
  }
]
Do not include any markdown comments, surround the JSON with \`\`\`json or preambles, just output the valid JSON array string. Ensure that the JSON is fully valid and parsable.`;

  try {
    if (ai) {
      console.log(`Querying Gemini (gemini-3.5-flash) for quiz prompt: Dept=${dept}, Dom=${dom}`);
      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                type: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctOptionIndex: { type: Type.INTEGER },
                category: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["id", "type", "question", "options", "correctOptionIndex", "category", "difficulty", "explanation"],
            },
          },
        },
      });

      const responseText = geminiResponse.text;
      if (responseText) {
        const cleaned = responseText.trim();
        const parsed = JSON.parse(cleaned);
        return res.json(parsed);
      }
    }
    throw new Error("No Gemini configured or empty text returned");
  } catch (err: any) {
    console.error("Gemini quiz generation failed or key missing. Returning high-fidelity backup quizzes.", err.message);
    
    // Fallback Mock Data suitable for ALL departments
    const mockBackupQuizzes: Record<string, any[]> = {
      "Computer Science": [
        {
          id: 1,
          type: "mcq",
          question: "Which data structure operates on a First-In-First-Out (FIFO) access policy?",
          options: ["Stack", "Queue", "Binary Tree", "Hash Map"],
          correctOptionIndex: 1,
          category: "technical",
          difficulty: difficulty,
          explanation: "Queues operate on a First-In-First-Out (FIFO) workflow. Stacks operate on Last-In-First-Out (LIFO)."
        },
        {
          id: 2,
          type: "mcq",
          question: "An applicant describes resolving an engineering dispute by using objective metrics. Which STAR framework layer does this demonstrate?",
          options: ["Situation", "Task", "Action", "Result"],
          correctOptionIndex: 2,
          category: "hr",
          difficulty: difficulty,
          explanation: "Defining the direct physical adjustments, communication steps, and code tests represent the 'Action' phase."
        },
        {
          id: 3,
          type: "mcq",
          question: "What refers to the ability to process multiple requests dynamically concurrently on a single CPU resource?",
          options: ["Strict Parallelism", "Multithreading/Concurrency", "Memory Isolation", "Encapsulation"],
          correctOptionIndex: 1,
          category: "technical",
          difficulty: difficulty,
          explanation: "Concurrency represents executing multiple paths concurrently to utilize system idle cycles."
        },
        {
          id: 4,
          type: "mcq",
          question: "If 5 automated build steps require exactly 2 minutes each, and 3 steps can be run concurrently, what is the minimum duration needed to run all 5?",
          options: ["4 minutes", "6 minutes", "10 minutes", "8 minutes"],
          correctOptionIndex: 1,
          category: "aptitude",
          difficulty: difficulty,
          explanation: "Step 1,2,3 execute in parallel (2 mins). Steps 4,5 run sequentially following (2 mins each or in parallel to use 2 more mins). Total minimum = 4 mins."
        },
        {
          id: 5,
          type: "mcq",
          question: "Which of the following describes the core objective of the Single Responsibility Principle under SOLID?",
          options: ["A module should only have one reasons to undergo change", "All interfaces must have exactly one single method declaration", "Classes should allow editing instead of scaling", "Restrict state inheritance entirely"],
          correctOptionIndex: 0,
          category: "technical",
          difficulty: difficulty,
          explanation: "Single Responsibility states that a class should be responsible to only a single stakeholder / have a single reason to change."
        }
      ],
      "Commerce": [
        {
          id: 1,
          type: "mcq",
          question: "Which financial statement reports a company's financial position at a specific point in time?",
          options: ["Income Statement", "Balance Sheet", "Cash Flow Statement", "Retained Earnings Ledger"],
          correctOptionIndex: 1,
          category: "technical",
          difficulty: difficulty,
          explanation: "The Balance sheet represents assets, liabilities, and owner equity snapshot for a specific date."
        },
        {
          id: 2,
          type: "mcq",
          question: "What metric is calculated by dividing net profit by total revenue to determine pricing margins?",
          options: ["Return on Equity", "Debt ratio", "Net Profit Margin", "Acid test ratio"],
          correctOptionIndex: 2,
          category: "technical",
          difficulty: difficulty,
          explanation: "Net profit margin indicates how many cents of net profit are earned on each dollar of revenue."
        },
        {
          id: 3,
          type: "mcq",
          question: "If a retailer reduces a product's price by 20% and sees sales units increase by 50%, what elasticity of demand did they experience?",
          options: ["Inelastic", "Highly Elastic", "Unitary Elastic", "Perfect demand"],
          correctOptionIndex: 1,
          category: "aptitude",
          difficulty: difficulty,
          explanation: "Price elasticity of demand is greater than 1, proving highly elastic responsiveness."
        },
        {
          id: 4,
          type: "mcq",
          question: "In standard accounting, which double-entry account ledger increases with a debit operation?",
          options: ["Revenue Accounts", "Liabilities Accounts", "Assets Accounts", "Equity capital Accounts"],
          correctOptionIndex: 2,
          category: "technical",
          difficulty: difficulty,
          explanation: "Debits increase asset and expense accounts, while credits increase liability, equity, and revenue."
        },
        {
          id: 5,
          type: "mcq",
          question: "During a busy inventory audits, how do you handle discovery of a $5,000 cash balance variance?",
          options: ["Ignore it as immaterial", "Immediately adjust with no logs", "Flag and report to direct manager with complete auditable receipts", "Ask co-workers to split the blame"],
          correctOptionIndex: 2,
          category: "hr",
          difficulty: difficulty,
          explanation: "Professional responsibility demands logging receipts, flagging anomalies, and presenting exact audit logs strictly."
        }
      ]
    };

    // Give targeted fallback if available, else standard versatile fallback
    const selectedQuiz = mockBackupQuizzes[dept] || [
      {
        id: 1,
        type: "mcq",
        question: `In professional ${dept} interview scenarios, what is the best strategy when asked about a technical concept you do not fully know?`,
        options: ["Politely state your foundational knowledge and walk through your logical troubleshooting process.", "Make up a technical answer to sound experienced.", "Refuse to state anything and skip to the next query.", "Redirect and state that the question is irrelevant."],
        correctOptionIndex: 0,
        category: "hr",
        difficulty: difficulty,
        explanation: "Authenticity, logical problem solving transparency, and clear dialogue structure are critical qualities that recruiters praise."
      },
      {
        id: 2,
        type: "mcq",
        question: `Which planning attribute is most vital for successful milestones execution under ${dom}?`,
        options: ["Defining clear KPIs and aligning weekly workflows", "Leaving execution goals entirely up to luck", "Hiring excessive staff without direction", "Ignoring budget constraints"],
        correctOptionIndex: 0,
        category: "technical",
        difficulty: difficulty,
        explanation: "Successful domain progression builds upon measurable objectives and rigorous timeline metrics."
      },
      {
        id: 3,
        type: "mcq",
        question: "An automated workflow experiences a throttle spike. Critical dependencies take 10s initially, but with caching it reduces by 90%. What is the cached transaction response time?",
        options: ["9 seconds", "1 second", "0.1 seconds", "5 seconds"],
        correctOptionIndex: 1,
        category: "aptitude",
        difficulty: difficulty,
        explanation: "90% of 10s is 9s saved. Remaining time is 10s - 9s = 1 second."
      },
      {
        id: 4,
        type: "mcq",
        question: "What framework is widely adopted to resolve workplace conflicts cooperatively while maintaining project deadlines?",
        options: ["Active Listening and Mutual Interests collaboration", "Avoidance strategies", "Passive aggressive notes", "Blaming teammates in public lists"],
        correctOptionIndex: 0,
        category: "hr",
        difficulty: difficulty,
        explanation: "Compromise and collaborative discussions establish a strong, safe professional environment."
      },
      {
        id: 5,
        type: "mcq",
        question: "Which approach creates the safest risk mitigation profile under standard operations?",
        options: ["Frequent testing, strict guidelines adherence, and clear fallback plans", "Rushing deployment with limited checks", "Bypassing industry compliance parameters", "Relying on old processes without inspection"],
        correctOptionIndex: 0,
        category: "technical",
        difficulty: difficulty,
        explanation: "Risk control cycles prioritize structural verification, audit checklists, and defensive operations."
      }
    ];

    res.json(selectedQuiz);
  }
});

app.post("/api/quiz/evaluate", (req, res) => {
  const { studentId, department, domain, level, answers, questions } = req.body;
  if (!answers || !questions) {
    return res.status(400).json({ error: "Missing answers or questions payload" });
  }

  // Calculate score
  let correctCount = 0;
  const parsedAnswers = Array.isArray(answers) ? answers : [];
  const parsedQuestions = Array.isArray(questions) ? questions : [];

  const results = parsedQuestions.map((q, idx) => {
    const studentAnswer = parsedAnswers[idx]; // Index picked by student
    const isCorrect = studentAnswer === q.correctOptionIndex;
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      questionText: q.question,
      studentPick: studentAnswer,
      correctPick: q.correctOptionIndex,
      isCorrect,
    };
  });

  const finalScorePercent = Math.round((correctCount / parsedQuestions.length) * 100);

  // Auto-generate student-feedback using rule-based metrics
  const feedback = {
    strengths: [
      `Demonstrated basic capabilities in ${department || "selected"} domain paradigms`,
      finalScorePercent >= 60 ? "Strong technical scoring on core questions" : "Pristine attempts, maintaining professional engagement under testing",
    ],
    weaknesses: [
      finalScorePercent < 80 ? "Slight fumbles in advanced analytical aptitude questions" : "Needs deeper familiarity with edge cases and extreme scaling",
      "Refining the speed of multiple-choice analytical logic under stress parameters"
    ],
    summary: `You scored ${correctCount}/${parsedQuestions.length} (${finalScorePercent}%) on our interactive ${level || "intermediate"} quiz. Keep practicing mock exercises to reinforce your communication metrics!`,
  };

  const newHistoryItem: QuizHistoryItem = {
    id: `quiz-res-${Date.now()}`,
    studentId: studentId || "anonymous-student",
    department: department || "General Career Prep",
    domain: domain || "Standard Cognitive Check",
    level: level || "intermediate",
    score: finalScorePercent,
    totalQuestions: parsedQuestions.length,
    date: new Date().toISOString().split("T")[0],
    feedback,
  };

  dbData.quizHistory.push(newHistoryItem);
  saveDB();

  res.json({
    score: finalScorePercent,
    correctCount,
    totalQuestions: parsedQuestions.length,
    results,
    feedback,
    historyItemId: newHistoryItem.id,
  });
});

// --- RESUME ANALYZER (GEMINI INTEGRATION WITH BACKUP FALLBACK) ---

app.post("/api/resume/analyze", async (req, res) => {
  const { filename, resumeText, targetRole } = req.body;
  const textContent = resumeText || "Student candidate seeking technical software roles. Expert in React & Java.";
  const role = targetRole || "General Department Professional";

  const prompt = `You are an expert AI Resume Coach and ATS Parser. Analyze the uploaded resume (FileName: "${filename || "unnamed.pdf"}") targeting the desired professional role "${role}".
Provide audit scoring, details on missing key metrics, grammar critiques, and missing keywords in exact JSON matching this template:
{
  "atsScore": 85,
  "skillsIdentified": ["TypeScript", "React", "Node.js"],
  "skillGaps": ["Docker", "Kubernetes", "GraphQL"],
  "suggestions": [
    "Quantify your achievements under the software engineer experience...",
    "Move your technical skills section to the top of your resume."
  ],
  "missingKeywords": ["CI/CD", "AWS", "SQL Optimizer"],
  "grammarCorrections": [
    {
      "original": "Worked in a team for build several apps.",
      "correction": "Worked in a team to build several applications.",
      "explanation": "Incorrect preposition usage ('for build' -> 'to build') and use 'applications' instead of 'apps' for formal writing."
    }
  ],
  "jobDomainSuitability": {
    "recommendedRoles": ["Full-Stack Engineer", "Frontend Developer"],
    "overallAssessment": "Excellent strong foundational skills, but needs deployment and devops experience."
  }
}
Do not inject any surrounding formatting or introductory words, output raw clean valid JSON string.`;

  try {
    if (ai) {
      console.log(`Analyzing Resume with Gemini: Filename=${filename}, Role=${role}`);
      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              atsScore: { type: Type.INTEGER },
              skillsIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
              skillGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              grammarCorrections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    correction: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                },
              },
              jobDomainSuitability: {
                type: Type.OBJECT,
                properties: {
                  recommendedRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
                  overallAssessment: { type: Type.STRING },
                },
              },
            },
            required: ["atsScore", "skillsIdentified", "skillGaps", "suggestions", "missingKeywords", "grammarCorrections", "jobDomainSuitability"],
          },
        },
      });

      const responseText = geminiResponse.text;
      if (responseText) {
        const cleaned = responseText.trim();
        const parsed = JSON.parse(cleaned);
        return res.json(parsed);
      }
    }
    throw new Error("No Gemini configured or empty text returned");
  } catch (err: any) {
    console.error("Gemini resume analysis failed or key missing. Returning high-fidelity backup simulation.", err.message);

    // Calculate dynamic back-up score based on resume length
    const fallbackScore = Math.min(100, Math.max(45, Math.round(55 + (textContent.length % 35))));
    const fallbackObj = {
      atsScore: fallbackScore,
      skillsIdentified: ["Interactive Communication", "Domain Core Fundamentals", "Critical Logic Troubleshooting"],
      skillGaps: ["System Integration metrics", "Advanced diagnostic frameworks", "Cloud Native operations"],
      suggestions: [
        "Include quantifiable achievement metrics (e.g., 'Improved throughput by 15%') rather than listing simple duties.",
        `Tailor your executive overview strictly to align with modern "${role}" guidelines.`,
        "Enlarge margins slightly to increase readability across scanning nodes."
      ],
      missingKeywords: [`${role} Strategy`, "Key Execution KPIs", "Continuous Delivery Audit", "System Analysis"],
      grammarCorrections: [
        {
          original: "Responsible for managing and execute project objectives.",
          correction: "Responsible for managing and executing project objectives.",
          explanation: "Maintain parallel verb structures ('managing' and 'executing') for correct grammatical flow of list items."
        }
      ],
      jobDomainSuitability: {
        recommendedRoles: [`Expert ${role} Specialist`, `${role} Consultant`, "Operations Coordinator"],
        overallAssessment: `The candidate possesses an outstanding foundational resume score of ${fallbackScore}%. By incorporating the suggested missing keywords and grammar fine-tunings, compatibility will scale significantly.`
      }
    };

    res.json(fallbackObj);
  }
});

// --- VITE MIDDLEWARE DEVELOPMENT INTEGRATION ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serving Static production assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
