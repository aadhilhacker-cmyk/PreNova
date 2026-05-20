import React, { useState, useEffect } from "react";
import { testConnection } from "./firebase";
import { UserProfile, BookingSession, QuizQuestion, ReportItem } from "./types";
import QuizSession from "./components/QuizSession";
import ResumeCoach from "./components/ResumeCoach";
import MockVideoRoom from "./components/MockVideoRoom";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  User,
  Users,
  Award,
  BookOpen,
  Calendar,
  MessageSquare,
  Shield,
  FileText,
  TrendingUp,
  Sliders,
  LogOut,
  Mail,
  Lock,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  Building,
  AlertOctagon,
  Clock,
  ThumbsUp,
  Star,
  CheckCircle2,
  ListFilter,
  Flame,
  UserCheck
} from "lucide-react";

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authRoleSelection, setAuthRoleSelection] = useState<"student" | "trainer">("student");
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [deptSelection, setDeptSelection] = useState("Computer Science");
  const [bioInput, setBioInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [pricingInput, setPricingInput] = useState("45");
  const [experienceInput, setExperienceInput] = useState("5");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // Common Platform states
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai-quiz" | "resume-analyzer" | "trainers" | "trainer-requests">("dashboard");
  const [trainers, setTrainers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<BookingSession[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  
  // Direct Dashboard Booking states
  const [selectedDashboardTrainerId, setSelectedDashboardTrainerId] = useState("");
  const [selectedDashboardTrainer, setSelectedDashboardTrainer] = useState<UserProfile | null>(null);
  const [directBookingDate, setDirectBookingDate] = useState("2026-05-22");
  const [directBookingTime, setDirectBookingTime] = useState("10:00 AM");
  const [isDirectBookingSubmitting, setIsDirectBookingSubmitting] = useState(false);
  
  // Department selected on Student Welcome panel
  const [currentDepartment, setCurrentDepartment] = useState("Computer Science");

  // Booking details flow states
  const [selectedTrainer, setSelectedTrainer] = useState<UserProfile | null>(null);
  const [bookingDate, setBookingDate] = useState("2026-05-22");
  const [bookingTime, setBookingTime] = useState("10:00 AM");
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [fakeCardNumber, setFakeCardNumber] = useState("4111 2222 3333 4444");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // Active video interview room simulation state
  const [activeCallSession, setActiveCallSession] = useState<BookingSession | null>(null);

  // Trainer Profile edit state
  const [trainerBio, setTrainerBio] = useState("");
  const [trainerSkills, setTrainerSkills] = useState("");
  const [trainerPricing, setTrainerPricing] = useState(40);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Search/Filter for trainers list
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");
  const [trainerDepartmentFilter, setTrainerDepartmentFilter] = useState("All");

  // Report creation mock modal states
  const [reportSpammerName, setReportSpammerName] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportSuccessMsg, setReportSuccessMsg] = useState("");

  const departmentsList = [
    "Computer Science",
    "IT",
    "Mechanical",
    "Civil",
    "Electrical",
    "Electronics",
    "Medical",
    "Commerce",
    "MBA",
    "Law",
    "Arts"
  ];

  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"];

  // Fetch standard platform items
  const loadPlatformData = async () => {
    try {
      // Load trainers
      const resTrainers = await fetch("/api/trainers");
      if (resTrainers.ok) {
        const d = await resTrainers.ok ? await resTrainers.json() : [];
        setTrainers(d);
      }

      // Load bookings
      if (currentUser) {
        const resBookings = await fetch(`/api/bookings?userId=${currentUser.id}&role=${currentUser.role}`);
        if (resBookings.ok) {
          const b = await resBookings.json();
          setBookings(b);
        }
      }
    } catch (e) {
      console.error("Failed loading data", e);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, [currentUser]);

  useEffect(() => {
    testConnection();
  }, []);

  // Auth Submit Action
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (!emailInput.trim()) {
      setAuthError("Email address must not be blank.");
      return;
    }

    if (isRegistering) {
      // Registration Action
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput.trim(),
            name: nameInput.trim() || "Applicant Candidate",
            role: authRoleSelection,
            department: deptSelection,
            bio: bioInput || "Welcome to my interview coaching profile.",
            skills: skillsInput,
            pricing: pricingInput,
            experience: experienceInput,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          setAuthMessage("Profile registration holds successfully!");
          setIsRegistering(false);
        } else {
          setAuthError(data.error || "Failed registration setup.");
        }
      } catch (err) {
        setAuthError("Failed registration connection setup.");
      }
    } else {
      // Login Action
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailInput.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          // Auto initialize forms for trainers
          if (data.user.role === "trainer") {
            setTrainerBio(data.user.bio || "");
            setTrainerSkills(data.user.skills?.join(", ") || "");
            setTrainerPricing(data.user.pricing || 35);
          }
        } else {
          setAuthError(data.error || "Login credentials error.");
        }
      } catch (err) {
        setAuthError("No database response.");
      }
    }
  };

  // Instant Switch Login helper to speed up system testing
  const handleInstantAutoLogin = async (role: "student" | "trainer") => {
    let targetEmail = "";
    if (role === "student") {
      // Register or login a standard student Alex
      targetEmail = "student.example@interviewtrainer.com";
      setNameInput("Alex Mercer");
      setAuthRoleSelection("student");
    } else if (role === "trainer") {
      targetEmail = "jane.doe@example.com"; // Jane Doe, Preloaded approved CS trainer
      setAuthRoleSelection("trainer");
    }

    setEmailInput(targetEmail);
    // Submit registration/login simulation
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        if (data.user.role === "trainer") {
          setTrainerBio(data.user.bio || "");
          setTrainerSkills(data.user.skills?.join(", ") || "");
          setTrainerPricing(data.user.pricing || 45);
        }
      } else {
        // Not found, register dynamically
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: targetEmail,
            name: role === "student" ? "Alex Mercer" : "Dr. Jane Doe",
            role,
            department: "Computer Science",
          }),
        });
        const regData = await regRes.json();
        if (regRes.ok) {
          setCurrentUser(regData.user);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleForgotPasswordSim = () => {
    if (!emailInput.trim()) {
      setAuthError("Type your email first, then click Forgot Password.");
      return;
    }
    setAuthMessage("Password recovery instructions forwarded securely to " + emailInput);
  };

  // Trainer profile updates
  const handleUpdateTrainerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdatingProfile(true);

    try {
      const res = await fetch("/api/trainers/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          bio: trainerBio,
          skills: trainerSkills,
          pricing: trainerPricing,
          department: currentDepartment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        alert("Trainer profile logs saved successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Admin approval flow
  const handleTrainerApproval = async (trainerId: string, approveStatus: boolean) => {
    try {
      const res = await fetch("/api/trainers/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId, approve: approveStatus }),
      });
      if (res.ok) {
        loadPlatformData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Student schedules booking check-out
  const handleLaunchCheckout = (tr: UserProfile) => {
    setSelectedTrainer(tr);
    setCheckoutModalOpen(true);
  };

  const handleConfirmSecureBooking = async () => {
    if (!currentUser || !selectedTrainer) return;
    setIsBookingSubmitting(true);

    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUser.id,
          studentName: currentUser.name,
          trainerId: selectedTrainer.id,
          dateTime: bookingDate,
          timeSlot: bookingTime,
          pricing: selectedTrainer.pricing,
        }),
      });
      if (res.ok) {
        setCheckoutModalOpen(false);
        alert("Booking completed successfully! Your session is marked as pending trainer approval.");
        loadPlatformData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleConfirmDirectBooking = async () => {
    if (!currentUser || !selectedDashboardTrainer) return;
    setIsDirectBookingSubmitting(true);

    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUser.id,
          studentName: currentUser.name,
          trainerId: selectedDashboardTrainer.id,
          dateTime: directBookingDate,
          timeSlot: directBookingTime,
          pricing: selectedDashboardTrainer.pricing,
        }),
      });
      if (res.ok) {
        alert(`Successfully applied for a class with ${selectedDashboardTrainer.name}! The request is now visible in the trainer's pending queue.`);
        setSelectedDashboardTrainerId("");
        setSelectedDashboardTrainer(null);
        loadPlatformData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to submit booking request.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDirectBookingSubmitting(false);
    }
  };

  // Trainer approves/rejects session
  const handleBookingAction = async (bookingId: string, action: "approved" | "rejected" | "completed") => {
    try {
      const res = await fetch("/api/bookings/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      });
      if (res.ok) {
        loadPlatformData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // File Spam Report helper
  const handleCreateSpamReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const res = await fetch("/api/admin/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: currentUser.name,
          spammerName: reportSpammerName,
          reason: reportReason,
        }),
      });
      if (res.ok) {
        setReportSuccessMsg("Spam and abuse report has been successfully routed to Admin queue.");
        setReportReason("");
        setReportSpammerName("");
        loadPlatformData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Search filter trainers list
  const filteredTrainersList = trainers.filter((t) => {
    const matchesKeyword =
      t.name.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
      t.skills?.some((s) => s.toLowerCase().includes(trainerSearchQuery.toLowerCase())) ||
      t.bio?.toLowerCase().includes(trainerSearchQuery.toLowerCase());

    const matchesDept = trainerDepartmentFilter === "All" || t.department === trainerDepartmentFilter;
    return t.role === "trainer" && t.isApproved && matchesKeyword && matchesDept;
  });

  // Calculate student upcoming live bookings count vs history
  const activeBookings = bookings.filter((b) => b.status === "approved" || b.status === "pending");
  const pastBookings = bookings.filter((b) => b.status === "completed" || b.status === "rejected");

  return (
    <div id="application-container" className="min-h-screen bg-slate-50 text-gray-800 flex flex-col font-sans">
      
      {/* Top Application Header Branding Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">AI Interview Trainer</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider bg-indigo-100 text-indigo-700 font-mono py-0.5 px-2 rounded-full">
                Full-Stack Prep Network
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUser.name)}`}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white"
                  alt="My Profile Picture Feed"
                />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-gray-900 leading-none">{currentUser.name}</p>
                  <p className="text-[10px] font-semibold text-gray-400 capitalize mt-0.5">{currentUser.role} Session</p>
                </div>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    setActiveTab("dashboard");
                  }}
                  title="Log out of application"
                  className="p-1 px-2 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 inline-block md:mr-1" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <span className="text-xs font-mono text-gray-400">Current Time: 2026-05-20 UTC</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Grid Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser ? (
          /* Landing Screen / Dual Login Authentication Block */
          <div id="dual-auth-block" className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6">
            
            {/* Left Narrative Column */}
            <div className="md:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-bold">
                <Flame className="w-4 h-4" />
                <span>Next-Gen Career Acceleration</span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Master Any Professional Interview on Demand.
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                Connect dynamically with industry-mapped AI generators for timed department practice quizzes, perform ATS audit checks on your resume, and schedule mock video assessments with seasoned enterprise recruiters.
              </p>

              <div id="developer-short-keys" className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-4">
                <span className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <UserCheck className="w-4 h-4 text-indigo-600" /> Interactive Platform Roles
                </span>
                
                <div className="space-y-3 text-xs leading-normal">
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-100/50">
                    <p className="font-bold text-slate-950 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      1. Student Account Profile
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Schedule direct class requests with mentors, complete automated AI domain quizzes, and optimize your resume.
                    </p>
                    <button
                      onClick={() => handleInstantAutoLogin("student")}
                      className="mt-2 text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold py-1 px-3 rounded-lg shadow-xs cursor-pointer transition-all"
                    >
                      Enter Student Mode (Alex Mercer)
                    </button>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-100/50">
                    <p className="font-bold text-slate-950 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      2. Certified Interview Trainer Profile
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Access the dedicated <b>Student Requested Page</b> workspace to evaluate active applications and approve or reject class requests.
                    </p>
                    <button
                      onClick={() => handleInstantAutoLogin("trainer")}
                      className="mt-2 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-1 px-3.5 rounded-lg shadow-sm cursor-pointer transition-all"
                    >
                      Enter Trainer Mode (Dr. Jane Doe)
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-indigo-700 leading-normal bg-indigo-100/50 p-2.5 rounded-lg border border-indigo-100">
                  💡 <b>End-to-End Test Tip:</b> Click Student Mode, apply for an instructor's class. Then click Logout and enter Trainer Mode instantly to see the student's request in the <b>Student Requested Page</b> tab, and click <b>Accept</b> or <b>Reject</b>!
                </p>
              </div>
            </div>

            {/* Right Interactive Form Column */}
            <div className="md:col-span-7 bg-white border border-gray-100 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="flex border-b border-gray-100 pb-2">
                <button
                  onClick={() => {
                    setIsRegistering(false);
                    setAuthError("");
                    setAuthMessage("");
                  }}
                  className={`flex-1 text-center pb-2 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
                    !isRegistering ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400"
                  }`}
                >
                  Verify Login Account
                </button>
                <button
                  onClick={() => {
                    setIsRegistering(true);
                    setAuthError("");
                    setAuthMessage("");
                  }}
                  className={`flex-1 text-center pb-2 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
                    isRegistering ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400"
                  }`}
                >
                  New Profile Registration
                </button>
              </div>

              {/* Secure dual-auth indicators */}
              <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider pl-1 font-mono">Select Access Profile:</span>
                <div className="flex gap-1.5">
                  {(["student", "trainer"] as const).map((rl) => (
                    <button
                      key={rl}
                      onClick={() => setAuthRoleSelection(rl)}
                      className={`text-[10px] uppercase font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        authRoleSelection === rl
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                          : "bg-white border-gray-200 text-gray-655 hover:border-gray-300"
                      }`}
                    >
                      {rl}
                    </button>
                  ))}
                </div>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3.5 rounded-lg font-medium">
                  {authError}
                </div>
              )}

              {authMessage && (
                <div className="bg-green-50 border border-green-100 text-green-700 text-xs p-3.5 rounded-lg font-medium">
                  {authMessage}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isRegistering && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Full Professional Name</label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">E-Mail Address</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Password Credentials</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {isRegistering && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Assigned Core Department</label>
                      <select
                        value={deptSelection}
                        onChange={(e) => setDeptSelection(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm"
                      >
                        {departmentsList.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    {authRoleSelection === "trainer" && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Asking Hourly Rate ($)</label>
                        <input
                          type="number"
                          value={pricingInput}
                          onChange={(e) => setPricingInput(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {isRegistering && authRoleSelection === "trainer" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Career Biography Preview</label>
                      <textarea
                        value={bioInput}
                        onChange={(e) => setBioInput(e.target.value)}
                        rows={2}
                        placeholder="Ex-Amazon SWE, 6 yr teaching CS algorithms."
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Enter Skills (comma-separated list)</label>
                      <input
                        type="text"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        placeholder="System Design, Algorithms, STAR Method"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleForgotPasswordSim}
                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-medium"
                  >
                    Forgot Password?
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInstantAutoLogin(authRoleSelection)}
                    className="text-xs text-gray-500 hover:text-gray-900 border border-gray-300 py-1.5 px-3.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-all font-semibold"
                  >
                    Google Auths Sign-in
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold font-mono text-sm tracking-wide shadow-md transition-all cursor-pointer mt-4"
                >
                  {isRegistering ? "Register Core Credentials" : "Enter Dashboard Console"}
                </button>
              </form>

              {/* Preloaded Interview Trainer Account Access Block */}
              <div className="pt-5 border-t border-gray-150 space-y-3 bg-indigo-50/30 -mx-6 sm:-mx-8 px-6 sm:px-8 pb-1 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                    RECRUITER WORKSPACE
                  </span>
                  <span className="text-[11px] font-bold text-gray-700">Interview Trainer Account Active</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                  Sign in instantly with the preloaded interviewer role to check student-submitted bookings, accept scheduled mock-trials, or trigger rejection rules. 
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleInstantAutoLogin("trainer")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer leading-none text-center"
                  >
                    Quick Log-In: Trainer Jane Doe
                  </button>
                  <p className="text-[9px] font-mono text-gray-400 leading-normal">
                    Email: jane.doe@example.com <br />Password: preloaded-secure
                  </p>
                </div>
              </div>
            </div>

          </div>
        ) : activeCallSession ? (
          /* Immersion Simulation Mock Call Room Block */
          <div id="full-room-block" className="max-w-6xl mx-auto">
            <div className="mb-4">
              <button
                onClick={() => {
                  setActiveCallSession(null);
                  loadPlatformData();
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-200 py-1.5 px-3.5 rounded-lg hover:bg-indigo-50 bg-white shadow-sm cursor-pointer"
              >
                ← Dismount Back to Dashboard
              </button>
            </div>
            <MockVideoRoom
              booking={activeCallSession}
              currentUser={currentUser}
              onLeave={() => {
                setActiveCallSession(null);
                loadPlatformData();
              }}
            />
          </div>
        ) : (
          /* Logged In Dashboard Interface Console */
          <div id="main-panel-tabs" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Sidebar navigation controls */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4 border-b border-gray-100 pb-2">Main Navigation Menu</span>
                <nav className="space-y-1.5">
                  <button
                    onClick={() => {
                      setActiveTab("dashboard");
                      loadPlatformData();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "dashboard"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-655 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Performance Center
                    </span>
                    {currentUser.role === "student" && bookings.filter((b) => b.status === "approved").length > 0 && (
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("ai-quiz")}
                    className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "ai-quiz"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-655 hover:bg-gray-50"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" /> Gemini AI Test Trainer (Free)
                  </button>

                  {currentUser.role === "student" && (
                    <button
                      onClick={() => setActiveTab("trainers")}
                      className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === "trainers"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-655 hover:bg-gray-50"
                      }`}
                    >
                      <Users className="w-4 h-4" /> Book Expert Mentors
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab("resume-analyzer")}
                    className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "resume-analyzer"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-655 hover:bg-gray-50"
                    }`}
                  >
                    <FileText className="w-4 h-4" /> AI Resume Optimizer
                  </button>

                  {currentUser.role === "trainer" && (
                    <button
                      onClick={() => {
                        setActiveTab("trainer-requests");
                        loadPlatformData();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === "trainer-requests"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-655 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 animate-bounce" /> Student Requested Page
                      </span>
                      {bookings.filter((b) => b.status === "pending").length > 0 && (
                        <span className="bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                          {bookings.filter((b) => b.status === "pending").length}
                        </span>
                      )}
                    </button>
                  )}
                </nav>
              </div>

              {/* Department preference settings (For Students) */}
              {currentUser.role === "student" && (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block border-b border-gray-100 pb-2 mb-2">Selected Domain Path</span>
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      Select your career domain industry to immediately specialize the interactive AI questions scope:
                    </p>
                    <select
                      value={currentDepartment}
                      onChange={(e) => {
                        setCurrentDepartment(e.target.value);
                        setTrainerDepartmentFilter(e.target.value);
                      }}
                      className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      {departmentsList.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Spam/Abuse report log block (Sidebar bottom helper) */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block border-b border-gray-100 pb-2">Spam & Content Moderation</span>
                <form onSubmit={handleCreateSpamReport} className="space-y-2 text-xs">
                  <p className="text-[10px] text-gray-400">Flag unauthorized user actions or fraud profiles:</p>
                  <input
                    type="text"
                    required
                    value={reportSpammerName}
                    onChange={(e) => setReportSpammerName(e.target.value)}
                    placeholder="Accused User/Trainer ID"
                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded text-[11px]"
                  />
                  <textarea
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Reason/abuse category logs..."
                    rows={2}
                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded text-[11px] resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    File Fraud Flag
                  </button>
                  {reportSuccessMsg && <p className="text-[10px] text-green-600 mt-1">{reportSuccessMsg}</p>}
                </form>
              </div>

            </div>

            {/* Right Dashboard Body Viewports */}
            <div className="lg:col-span-9 space-y-6">

              {activeTab === "dashboard" && (
                <div id="performance-center-dashboard" className="space-y-6">
                  
                  {/* Student Welcome Banner */}
                  {currentUser.role === "student" && (
                    <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
                      <div className="relative z-10 max-w-xl">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 block mb-1">Career Dashboard</span>
                        <h2 className="text-2xl font-bold tracking-tight">Welcome, {currentUser.name}!</h2>
                        <p className="text-xs text-indigo-100/90 mt-1 lines-normal leading-relaxed">
                          Your current industry department focus is calibrated to <span className="font-bold underline text-indigo-300">{currentDepartment}</span>. All specialized AI interview simulations & mock recruiter schedules conform to this profile.
                        </p>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
                        <Briefcase className="w-48 h-48" />
                      </div>
                    </div>
                  )}

                  {/* Trainer Dashboard Details Overview */}
                  {currentUser.role === "trainer" && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={currentUser.avatar}
                            className="w-12 h-12 rounded-full border border-gray-200 bg-white"
                            alt="Trainer Dashboard Avatar Profile Picture"
                          />
                          <div>
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block font-mono">Expert Coach Monitor</span>
                            <h3 className="text-lg font-bold text-gray-900">{currentUser.name}</h3>
                          </div>
                        </div>

                        {/* Trainer Performance Earnings tracker */}
                        <div className="flex gap-4">
                          <div className="text-center bg-gray-50 border border-gray-100 py-2 px-4 rounded-xl">
                            <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider text-[10px]">Total Revenue</span>
                            <span className="text-lg font-extrabold text-indigo-600">${currentUser.totalEarnings || 0}</span>
                          </div>
                          <div className="text-center bg-gray-50 border border-gray-100 py-2 px-4 rounded-xl">
                            <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider text-[10px]">Star Ratings</span>
                            <span className="text-lg font-extrabold text-teal-600">★ {currentUser.rating || 5.0}</span>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleUpdateTrainerProfile} className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Edit Public Scheduling Profile Log</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Coach Industry Department</label>
                            <select
                              value={currentDepartment}
                              onChange={(e) => setCurrentDepartment(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 text-xs px-2.5 py-2.5 rounded-lg"
                            >
                              {departmentsList.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Set Hourly Rate ($ / hr)</label>
                            <input
                              type="number"
                              value={trainerPricing}
                              onChange={(e) => setTrainerPricing(Number(e.target.value))}
                              className="w-full bg-gray-50 border border-gray-200 text-xs px-2.5 py-2.5 rounded-lg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Short Professional Headline</label>
                          <textarea
                            value={trainerBio}
                            onChange={(e) => setTrainerBio(e.target.value)}
                            rows={3}
                            placeholder="Introduce your corporate practice background..."
                            className="w-full bg-gray-50 border border-gray-200 text-xs p-3 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Enter Public Skill tags (comma separated)</label>
                          <input
                            type="text"
                            value={trainerSkills}
                            onChange={(e) => setTrainerSkills(e.target.value)}
                            placeholder="System Engineering, behavioral checkpoints, STAR models"
                            className="w-full bg-gray-50 border border-gray-200 text-xs p-2.5 rounded-lg"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isUpdatingProfile}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all"
                        >
                          {isUpdatingProfile ? "Logging profile records..." : "Apply Profile Updates"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Student performance metrics analytics */}
                  {currentUser.role === "student" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Avg Quiz Performance</span>
                          <span className="text-xl font-extrabold text-gray-900">80% Competency</span>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Approved Bookings</span>
                          <span className="text-xl font-extrabold text-gray-900">{bookings.filter((b) => b.status === "approved").length} active</span>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Mock Trials Completed</span>
                          <span className="text-xl font-extrabold text-gray-900">{bookings.filter((b) => b.status === "completed").length} sessions</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Student Page direct trainer card and Class Request Form */}
                  {currentUser.role === "student" && (
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="border-b border-gray-100 pb-3 mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Users className="w-4.5 h-4.5 text-indigo-500" /> Apply directly for a Class with Certified Trainers
                        </h3>
                        <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 rounded px-2.5 py-0.5">
                          Direct Class Form
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 leading-normal mb-4">
                        View validated instructor profiles below, click <b>Select to Apply</b>, then select a date and timeslot to schedule your interactive mentoring class.
                      </p>

                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Choose an Instructor</label>
                            <select
                              value={selectedDashboardTrainerId}
                              onChange={(e) => {
                                const trId = e.target.value;
                                setSelectedDashboardTrainerId(trId);
                                const found = trainers.find(t => t.id === trId);
                                if (found) {
                                  setSelectedDashboardTrainer(found);
                                } else {
                                  setSelectedDashboardTrainer(null);
                                }
                              }}
                              className="w-full bg-white border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                            >
                              <option value="">-- Choose a Qualified Coach --</option>
                              {trainers.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({t.department}) — ${t.pricing}/hr
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Choose Date</label>
                            <input
                              type="date"
                              value={directBookingDate}
                              onChange={(e) => setDirectBookingDate(e.target.value)}
                              className="w-full bg-white border border-gray-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-gray-805 text-gray-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Choose Time Slot</label>
                            <select
                              value={directBookingTime}
                              onChange={(e) => setDirectBookingTime(e.target.value)}
                              className="w-full bg-white border border-gray-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-gray-800"
                            >
                              {timeSlots.map(ts => (
                                <option key={ts} value={ts}>{ts}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {selectedDashboardTrainer && (
                          <div className="bg-white border border-indigo-100 p-3.5 rounded-lg flex flex-col sm:flex-row items-start justify-between gap-3 text-xs mt-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">Trainer Profile Highlights</span>
                              <p className="font-bold text-gray-900 mt-1">{selectedDashboardTrainer.name} ({selectedDashboardTrainer.department})</p>
                              <p className="text-gray-500 leading-normal mt-0.5 font-sans">{selectedDashboardTrainer.bio}</p>
                              {selectedDashboardTrainer.skills && (
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                  {selectedDashboardTrainer.skills.map((sk: string, idx: number) => (
                                    <span key={idx} className="text-[9px] font-bold bg-slate-100 text-slate-700 rounded px-1.5 py-0.5">{sk}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-indigo-600 font-extrabold text-sm mb-1">${selectedDashboardTrainer.pricing} / hr</p>
                              <p className="text-[10px] text-gray-500">{selectedDashboardTrainer.experience || 5} Years Corporate Experience</p>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            onClick={handleConfirmDirectBooking}
                            disabled={!selectedDashboardTrainerId || isDirectBookingSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            {isDirectBookingSubmitting ? "Submitting application request..." : "Apply & Schedule Class Session"}
                          </button>
                        </div>
                      </div>

                      {/* Instructor Roster Profiles table / list */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Trainer Roster & Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {trainers.map(t => (
                            <div key={t.id} className="border border-gray-150 p-4 rounded-xl flex items-start gap-3 bg-white hover:border-gray-250 transition-all">
                              <img src={t.avatar} className="w-10 h-10 rounded-full border bg-white shadow-xs shrink-0" alt="avatar" />
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-bold text-xs text-gray-900">{t.name}</h5>
                                  <span className="text-[10px] font-bold text-indigo-600">${t.pricing}/hr</span>
                                </div>
                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700 block w-max">{t.department}</span>
                                <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">{t.bio}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-amber-500 mt-1.5">
                                  <span>★ {t.rating || 5.0}</span>
                                  <span className="text-gray-400">({t.experience || 3} yr experience)</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedDashboardTrainerId(t.id);
                                    setSelectedDashboardTrainer(t);
                                  }}
                                  className="mt-2 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-100 px-2 py-1 rounded bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer"
                                >
                                  Select to Apply
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trainer pending requests block */}
                  {currentUser.role === "trainer" && (
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="border-b border-gray-100 pb-3 mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Users className="w-4.5 h-4.5 text-indigo-600" /> Incoming Student Class Applications ({bookings.filter(b => b.status === "pending").length})
                        </h4>
                        <span className="text-[10px] font-mono uppercase bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded font-bold animate-pulse">
                          Awaiting Decisions
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 leading-normal">
                        Below are pending class & mock interview consultation requests from active student profiles. You may accept or reject them based on your current schedule.
                      </p>

                      <div className="space-y-3">
                        {bookings.filter(b => b.status === "pending").map((b) => (
                          <div key={b.id} className="border border-indigo-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/20">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                {b.studentName.charAt(0)}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-gray-950 font-sans">Class Applicant: {b.studentName}</h5>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  Scheduled Slot: <span className="font-semibold text-gray-800">{b.dateTime} • {b.timeSlot}</span>
                                </p>
                                <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                                  Hourly rate compensation: <span className="text-indigo-600 font-bold">${b.pricing}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => handleBookingAction(b.id, "approved")}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
                              >
                                Accept Class Request
                              </button>
                              <button
                                onClick={() => handleBookingAction(b.id, "rejected")}
                                className="bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-650 text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}

                        {bookings.filter(b => b.status === "pending").length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-6">You currently have no pending student class applications in queue.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live Pending and Approved Bookings schedule queue */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" /> Active Mock Schedules & Video Rooms
                      </h4>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold bg-gray-100 rounded px-2.5 py-0.5">
                        Real-time Pipeline
                      </span>
                    </div>

                    <div className="space-y-4">
                      {bookings.filter((b) => b.status === "approved" || b.status === "pending").map((b) => {
                        const otherParty = currentUser.role === "trainer" ? b.studentName : `Coach: ${b.trainerName}`;
                        const displayStatus = b.status === "approved" ? "Live Room Active" : "Pending Approval";
                        return (
                          <div key={b.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-gray-900">{otherParty}</h5>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  Schedule: {b.dateTime} • {b.timeSlot} • Base Price: <span className="font-semibold text-gray-700">${b.pricing}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end md:self-auto">
                              {/* Status Display badges */}
                              <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider uppercase ${
                                b.status === "approved" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700 animate-pulse"
                              }`}>
                                {displayStatus}
                              </span>

                              {/* Trainer specific operations */}
                              {currentUser.role === "trainer" && b.status === "pending" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleBookingAction(b.id, "approved")}
                                    className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleBookingAction(b.id, "rejected")}
                                    className="p-1 px-2 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}

                              {/* Join simulation video room trigger when approved */}
                              {b.status === "approved" && (
                                <button
                                  onClick={() => setActiveCallSession(b)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all"
                                >
                                  Join Video Room
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {bookings.filter((b) => b.status === "approved" || b.status === "pending").length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-xs">No pending or approved interview schedules found in active queues.</p>
                          {currentUser.role === "student" && (
                            <button
                              onClick={() => setActiveTab("trainers")}
                              className="mt-3 text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 py-1.5 px-3.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                              Explore Mentors to Schedule
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Completed session reports history log */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
                    <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Award className="w-4.5 h-4.5 text-teal-600" /> Completed Interviews & Feedback Repositories
                      </h4>
                      <span className="text-[10px] text-gray-400">Archived Records</span>
                    </div>

                    <div className="space-y-4">
                      {bookings.filter((b) => b.status === "completed" || b.status === "rejected").map((b) => {
                        const otherParty = currentUser.role === "trainer" ? b.studentName : b.trainerName;
                        return (
                          <div key={b.id} className="border border-gray-100 rounded-xl p-5 space-y-4 bg-white hover:border-gray-200 transition-shadow">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                              <div>
                                <h5 className="text-xs font-extrabold text-indigo-800 uppercase tracking-widest">{currentUser.role === "trainer" ? "Verified Candidate" : "Assessed Coach"}</h5>
                                <span className="text-sm font-bold text-gray-900 mt-1 block">{otherParty}</span>
                                <p className="text-[10px] text-gray-500 mt-0.5">Session Scheduled: {b.dateTime} at {b.timeSlot}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Score Indicator */}
                                {b.feedback?.score && (
                                  <span className="text-xs font-bold bg-teal-50 border border-teal-100 text-teal-700 px-2.5 py-1 rounded">
                                    Grade: {b.feedback.score}%
                                  </span>
                                )}

                                {/* Status Badge */}
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded capitalize ${
                                  b.status === "completed" ? "bg-teal-100 text-teal-850" : "bg-red-100 text-red-800"
                                }`}>
                                  {b.status}
                                </span>
                              </div>
                            </div>

                            {/* Feedbacks Display details */}
                            {b.status === "completed" && b.feedback ? (
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs select-none">
                                <div className="md:col-span-8 space-y-3">
                                  <div>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">Strategic Strengths Identified</span>
                                    <ul className="space-y-1">
                                      {b.feedback.strengths.map((str, i) => (
                                        <li key={i} className="text-gray-655 flex items-start gap-1.5 pl-1 leading-normal">
                                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5" />
                                          <span>{str}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">Core Areas requiring Adaptation</span>
                                    <ul className="space-y-1">
                                      {b.feedback.weaknesses.map((weak, i) => (
                                        <li key={i} className="text-gray-655 flex items-start gap-1.5 pl-1 leading-normal">
                                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5" />
                                          <span>{weak}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="bg-gray-50 border border-gray-100/80 p-3 rounded-lg text-gray-600 leading-relaxed font-sans mt-2">
                                    <span className="font-bold text-gray-800">Overall Diagnostic:</span> {b.feedback.overallExplanation}
                                  </div>
                                </div>

                                <div className="md:col-span-4 bg-teal-50/20 border border-teal-100/60 p-4 rounded-xl space-y-2">
                                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Coaches Action Plan Layout</span>
                                  <p className="text-xs text-teal-900 leading-normal font-medium">{b.feedback.improvementPath}</p>
                                  
                                  {/* Review Star Rating controls */}
                                  {currentUser.role === "student" && !b.rating && (
                                    <button
                                      onClick={() => setActiveCallSession(b)}
                                      className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold block text-center py-1.5 rounded text-[10px] uppercase shadow-sm cursor-pointer"
                                    >
                                      ★ Rate this Assessment
                                    </button>
                                  )}

                                  {b.rating && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        {[1,2,3,4,5].map((strIdx) => (
                                          <Star key={strIdx} className={`w-3.5 h-3.5 ${strIdx <= (b.rating || 0) ? "text-amber-500 fill-amber-500" : "text-gray-200"}`} />
                                        ))}
                                      </div>
                                      {b.review && <p className="text-[11px] text-gray-500 italic mt-1 font-sans">"{b.review}"</p>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : b.status === "completed" ? (
                              <p className="text-xs text-gray-400 italic">Evaluation assessment logs are currently compiling.</p>
                            ) : null}

                          </div>
                        );
                      })}

                      {bookings.filter((b) => b.status === "completed" || b.status === "rejected").length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-6">No archived historical sessions logged under this profile.</p>
                      )}
                    </div>
                  </div>
 
                 </div>
               )}
 
              {activeTab === "trainer-requests" && currentUser.role === "trainer" && (
                <div id="student-requested-page-workspace" className="space-y-6">
                  {/* Performance stats header banner */}
                  <div className="bg-gradient-to-r from-teal-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="relative z-10 max-w-xl">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200 block mb-1">Trainer Decision Desk</span>
                      <h2 className="text-xl font-extrabold tracking-tight">Student Requested Workspace & Decisions</h2>
                      <p className="text-xs text-teal-100/95 mt-1 leading-relaxed">
                        Assess real-time interactive class applications & scheduled consultation requests submitted by CS, FinTech, and Math students below. Confirmed profiles instantly activate video classroom links.
                      </p>
                    </div>
                  </div>

                  {/* Operational stats row split */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm text-center space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Proposals</span>
                      <span className="text-xl font-black text-gray-900">{bookings.length}</span>
                    </div>
                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm text-center bg-orange-50/20 border-orange-100 space-y-1">
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Awaiting Decision</span>
                      <span className="text-xl font-black text-orange-600">
                        {bookings.filter((b) => b.status === "pending").length}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm text-center bg-green-50/20 border-green-100 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Approved Classes</span>
                      <span className="text-xl font-black text-emerald-600">
                        {bookings.filter((b) => b.status === "approved").length}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm text-center bg-red-50/10 border-red-50 space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Rejected Slots</span>
                      <span className="text-xl font-black text-gray-500">
                        {bookings.filter((b) => b.status === "rejected").length}
                      </span>
                    </div>
                  </div>

                  {/* Workspace Interactive Requests list */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Academic Decision Queue</h3>
                        <p className="text-xs text-slate-500 mt-1">Review applicant profiles, click approve to confirm, or reject to clear availability slots.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {bookings.map((b) => (
                        <div 
                          key={b.id} 
                          className={`border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                            b.status === "pending"
                              ? "bg-orange-50/30 border-orange-100/70 hover:border-orange-200"
                              : b.status === "approved"
                              ? "bg-green-50/30 border-green-100/60 hover:border-green-150"
                              : "bg-gray-50/40 border-gray-150 text-gray-550 text-gray-500"
                          }`}
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold text-base shrink-0 ${
                              b.status === "pending"
                                ? "bg-orange-100/85 text-orange-700 border-orange-200"
                                : b.status === "approved"
                                ? "bg-green-100/85 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-400 border-gray-200"
                            }`}>
                              {b.studentName.charAt(0)}
                            </div>

                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-900">{b.studentName}</h4>
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono ${
                                  b.status === "pending"
                                    ? "bg-amber-100 text-amber-800 animate-pulse border border-amber-200"
                                    : b.status === "approved"
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : b.status === "completed"
                                    ? "bg-teal-100 text-teal-850"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {b.status === "pending" ? "Awaiting Decision" : `Request ${b.status}`}
                                </span>
                              </div>

                              <p className="text-xs text-gray-500 leading-normal">
                                Requested scheduled slot for <span className="font-semibold text-gray-800">{b.dateTime}</span> at <span className="font-semibold text-gray-800">{b.timeSlot}</span>
                              </p>

                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1.5 text-[11px] text-gray-400">
                                <span className="flex items-center gap-1">
                                  💵 Pricing Compensation Rate: <strong className="text-indigo-600">${b.pricing} / hr</strong>
                                </span>
                                <span className="font-mono">
                                  ID: {b.id}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto md:border-l md:border-gray-100 md:pl-5">
                            {b.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleBookingAction(b.id, "approved")}
                                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                                >
                                  Approve & Accept Request
                                </button>
                                <button
                                  onClick={() => handleBookingAction(b.id, "rejected")}
                                  className="flex-1 md:flex-none bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-650 text-xs font-semibold py-2 px-3 rounded-xl shadow-2xs transition-all cursor-pointer text-center"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400 italic">
                                {b.status === "approved" ? (
                                  <div className="space-y-1 text-right">
                                    <span className="text-emerald-600 font-bold block text-xs">✓ Approved Application</span>
                                    <button
                                      onClick={() => handleBookingAction(b.id, "rejected")}
                                      className="text-[10px] text-red-600 hover:text-red-800 font-semibold border border-red-100 hover:bg-red-50/50 px-2 py-1 rounded transition-colors"
                                    >
                                      Revoke / Reject Request
                                    </button>
                                  </div>
                                ) : b.status === "rejected" ? (
                                  <div className="space-y-1 text-right">
                                    <span className="text-red-600 font-bold block text-xs">✗ Rejected Application</span>
                                    <button
                                      onClick={() => handleBookingAction(b.id, "approved")}
                                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold border border-indigo-100 hover:bg-indigo-50/50 px-2 py-1 rounded transition-colors"
                                    >
                                      Re-Approve & Accept
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-teal-600 font-bold">✓ Session Completed</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {bookings.length === 0 && (
                        <div className="text-center py-10 space-y-2">
                          <p className="text-xs text-gray-400">At present, no student profile has requested a mock schedule with you.</p>
                          <p className="text-[11px] text-gray-500">Log out and enter standard student Alex's account to submit a request first!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ai-quiz" && (
                <QuizSession
                  user={currentUser}
                  department={currentDepartment}
                  onCompleted={() => {
                    setActiveTab("dashboard");
                    loadPlatformData();
                  }}
                />
              )}

              {activeTab === "resume-analyzer" && (
                <ResumeCoach user={currentUser} />
              )}

              {activeTab === "trainers" && (
                <div id="mentors-browsing-panel" className="space-y-6">
                  
                  {/* Search and filtering headers */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Explore Professional Interview Trainers</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Filter of validated corporate mentors calibrated by career departments.</p>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        Secure Schedule Guarantee
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search Bar */}
                      <div className="flex-1 relative">
                        <Search className="w-4.5 h-4.5 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={trainerSearchQuery}
                          onChange={(e) => setTrainerSearchQuery(e.target.value)}
                          placeholder="Search skills, recruiter names, biographies..."
                          className="w-full bg-slate-50 border border-gray-150 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Dropdown Filters */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Filter className="w-4.5 h-4.5 text-gray-400" />
                        <select
                          value={trainerDepartmentFilter}
                          onChange={(e) => setTrainerDepartmentFilter(e.target.value)}
                          className="bg-slate-50 border border-gray-150 p-2 rounded-xl text-xs font-semibold"
                        >
                          <option value="All">All Departments</option>
                          {departmentsList.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Trainers matching layout grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTrainersList.map((tr) => (
                      <div key={tr.id} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-gray-250 transition-all">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={tr.avatar}
                                alt="Recruiter Avatar Feed"
                                className="w-12 h-12 rounded-full border border-gray-150 bg-white shadow-sm shrink-0"
                              />
                              <div>
                                <h4 className="text-sm font-bold text-gray-950">{tr.name}</h4>
                                <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase font-mono mt-1 inline-block">
                                  {tr.department}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-sm font-extrabold text-indigo-600 block">${tr.pricing} / hr</span>
                              <span className="text-[10px] text-gray-400 mt-0.5 block">{tr.experience || 5} yr Corporate Exp</span>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 leading-relaxed font-sans line-clamp-3">
                            {tr.bio}
                          </p>

                          {/* Skill Tags list */}
                          {tr.skills && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {tr.skills.map((sk, idx) => (
                                <span key={idx} className="text-[9px] font-bold bg-gray-100 text-gray-655 px-2 py-0.5 rounded">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Booking footer scheduling triggers */}
                        <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold text-gray-800">{tr.rating || 5.0}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">(Verified Review)</span>
                          </div>

                          <button
                            onClick={() => handleLaunchCheckout(tr)}
                            className="bg-indigo-600 hover:bg-indigo-755 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
                          >
                            Schedule Mock Match
                          </button>
                        </div>

                      </div>
                    ))}

                    {filteredTrainersList.length === 0 && (
                      <div className="col-span-2 text-center py-12 bg-white border border-gray-150 rounded-2xl">
                        <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-gray-700">No active Approved Trainers Spotted</h4>
                        <p className="text-xs text-gray-400 mt-1">Try resetting filters to discover tutors from other departments.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

          </div>
        )}
      </main>

      {/* Booking Scheduling Checkout Modal Dialog overlay */}
      <AnimatePresence>
        {checkoutModalOpen && selectedTrainer && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="font-bold text-gray-900 text-sm">Schedule Verified Mock Recruiter</h4>
                <button onClick={() => setCheckoutModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Recruiter brief details */}
              <div className="flex items-center gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                <img src={selectedTrainer.avatar} className="w-10 h-10 rounded-full" alt="Checkout Recruiter avatar text placeholder" />
                <div>
                  <h5 className="text-xs font-bold text-gray-900">{selectedTrainer.name}</h5>
                  <p className="text-[10px] text-gray-500 mt-0.5">{selectedTrainer.department} • Pricing: ${selectedTrainer.pricing}/hr</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-gray-600">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Session Date Selection</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-2 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Select Time Slot</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-2 rounded focus:outline-none"
                    >
                      {timeSlots.map((ts) => (
                        <option key={ts} value={ts}>{ts}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Secure checkout sandbox payment gate */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">Secure Payment Gateway Simulator</span>
                    <span className="text-[9px] uppercase font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded font-extrabold">SSL Active</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Simulate booking with standard credit numbers. This uses dynamic sandbox parameters.</p>
                  
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">Sandbox Credit Card Number</label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={fakeCardNumber}
                          onChange={(e) => setFakeCardNumber(e.target.value)}
                          className="w-full bg-white border border-gray-150 rounded pl-9 pr-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block text-gray-400 font-bold mb-1">Expiry CVV</label>
                        <input type="text" placeholder="12 / 29" className="w-full bg-white border border-gray-150 p-1 rounded font-mono text-center focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-gray-400 font-bold mb-1">CVV Pin</label>
                        <input type="text" placeholder="334" className="w-full bg-white border border-gray-150 p-1 rounded font-mono text-center focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex gap-2">
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="flex-1 bg-gray-50 hover:bg-gray-150 text-gray-700 rounded-xl py-2.5 text-xs font-semibold cursor-pointer"
                >
                  Cancel Scheduling
                </button>
                <button
                  onClick={handleConfirmSecureBooking}
                  disabled={isBookingSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md cursor-pointer transition-colors"
                >
                  {isBookingSubmitting ? "Syncing SSL secure gate..." : `Secure Pay $${selectedTrainer.pricing}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="bg-white border-t border-gray-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400 space-y-1">
          <p>© 2026 AI Based Interview Trainer Network. Licensed under Apache-2.0 guidelines.</p>
          <p>Powered by advanced Gemini-3.5-flash reasoning models proxy server-side integrations.</p>
        </div>
      </footer>

    </div>
  );
}
