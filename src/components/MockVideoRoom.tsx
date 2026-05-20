import React, { useState, useEffect, useRef } from "react";
import { BookingSession, ChatMessage, UserProfile } from "../types";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Send, MessageSquare, Clipboard, FileText, CheckCircle2, Award, Star, RefreshCw, Clock } from "lucide-react";

interface MockVideoRoomProps {
  booking: BookingSession;
  currentUser: UserProfile;
  onLeave: () => void;
}

export default function MockVideoRoom({ booking, currentUser, onLeave }: MockVideoRoomProps) {
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [timer, setTimer] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [whiteboardText, setWhiteboardText] = useState(
    `# Whiteboard & Interview Sandbox\n\n// Write code, notes, or technical structures shared live between student and trainer here.\n\nfunction solveProblem(input) {\n  // Type details here...\n  return true;\n}`
  );

  // Trainer Feedback state form
  const [formScore, setFormScore] = useState(80);
  const [formStrengths, setFormStrengths] = useState("Clear structural logic, polite speech timing");
  const [formWeaknesses, setFormWeaknesses] = useState("Slow algorithmic calculation on depth-first scans");
  const [formExplanation, setFormExplanation] = useState("Overall Alex has shown exceptional readiness. He adjusted well when hints were offered.");
  const [formPath, setFormPath] = useState("Practice 5 DFS problems with timing tracking; rehearse behavioral logs.");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Student Rating form
  const [givenRating, setGivenRating] = useState(5);
  const [givenReview, setGivenReview] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [activeTab, setActiveTab] = useState<"chat" | "board">("chat");
  const [isCompletedState, setIsCompletedState] = useState(booking.status === "completed");

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Timed dialog prompts simulator to mimic real conversation dynamically
  const [dialogTicker, setDialogTicker] = useState<string[]>([]);
  const simulatedDialogs = [
    "Trainer: Welcome to today's mock interview prep. Let's start with a brief overview of your background.",
    "Student: Thank you! I have been preparing for full stack roles with emphasis on durable architectures.",
    "Trainer: Excellent. How would you solve a resource lock issue in concurrent processes?",
    "Student: I would design a mutex or transaction-level queue mechanism with precise timing backoffs.",
    "Trainer: Good. Remember to verify index paths to avoid database thread exhausts.",
  ];

  useEffect(() => {
    // Add dialogue rows gradually
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < simulatedDialogs.length) {
        setDialogTicker((prev) => [...prev, simulatedDialogs[idx]]);
        idx++;
      }
    }, 15000);

    // Keep active timer
    const timeInterval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  // Fetch session message chats
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${booking.id}`);
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const poll = setInterval(fetchMessages, 3000);
    return () => clearInterval(poll);
  }, [booking.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const res = await fetch(`/api/chat/${booking.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          text: inputText.trim(),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, data]);
      setInputText("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendFeedback = async () => {
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/bookings/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          score: formScore,
          strengths: formStrengths.split(",").map((s) => s.trim()),
          weaknesses: formWeaknesses.split(",").map((s) => s.trim()),
          overallExplanation: formExplanation,
          improvementPath: formPath,
        }),
      });
      if (res.ok) {
        setIsCompletedState(true);
        booking.status = "completed";
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSendRating = async () => {
    setIsSubmittingRating(true);
    try {
      const res = await fetch("/api/bookings/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          rating: givenRating,
          review: givenReview,
        }),
      });
      if (res.ok) {
        setRatingSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formatVideoTimer = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    return `${hours > 0 ? hours + ":" : ""}${mins < 10 ? "0" : ""}${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const isTrainer = currentUser.role === "trainer";

  return (
    <div id="live-interview-simulator" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950 p-4 lg:p-6 rounded-2xl text-white shadow-xl min-h-[580px]">
      {/* Left Frame: Video Feeds and speech translation ticker */}
      <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
        
        {/* Connection Header bar */}
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h4 className="text-sm font-semibold tracking-wide truncate">
              Live Mock Interview Session: {isTrainer ? booking.studentName : booking.trainerName}
            </h4>
          </div>
          <div className="bg-slate-800 text-slate-300 font-mono text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatVideoTimer(timer)}</span>
          </div>
        </div>

        {/* Video Screens simulation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[300px]">
          {/* Student Screen Container */}
          <div className="bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800/80 group flex items-center justify-center">
            {videoOn ? (
              <div className="w-full h-full relative">
                {/* Simulated webcam preview image */}
                <img
                  src={
                    isTrainer
                      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                      : "https://api.dicebear.com/7.x/adventurer/svg?seed=mockstudent"
                  }
                  alt="Student Video Preview"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {isTrainer ? `Student Profile: ${booking.studentName}` : "Your Feed (Student)"}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500">
                <VideoOff className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">Webcam feed disabled</p>
              </div>
            )}
            <div className="absolute top-3 right-3 bg-black/50 px-2 py-0.5 rounded text-[9px] font-semibold">1080p HD</div>
          </div>

          {/* Trainer Screen Container */}
          <div className="bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800/80 group flex items-center justify-center">
            <div className="w-full h-full relative">
              <img
                src={
                  isTrainer
                    ? "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
                    : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                }
                alt="Trainer Video Feed"
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                {isTrainer ? "Your Feed (Trainer)" : `Trainer: ${booking.trainerName}`}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time speech transcription ticker */}
        <div className="bg-slate-900/60 border border-slate-800/80 min-h-[85px] max-h-[140px] overflow-y-auto p-3.5 rounded-xl font-mono text-xs space-y-2 text-slate-300">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-2">Live AI Translation & Dialogue Ticker</p>
          {dialogTicker.map((tick, idx) => (
            <p key={idx} className="leading-relaxed">
              <span className={tick.startsWith("Trainer:") ? "text-indigo-400 font-bold" : "text-emerald-400 font-bold"}>
                {tick.slice(0, tick.indexOf(":") + 1)}
              </span>
              {tick.slice(tick.indexOf(":") + 1)}
            </p>
          ))}
          {dialogTicker.length === 0 && <p className="italic text-slate-600">Simulating live vocal transcripts and structural prompts once session ticks...</p>}
          <div ref={transcriptEndRef} />
        </div>

        {/* Control toolbar */}
        <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800 px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVideoOn(!videoOn)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                videoOn ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white" : "bg-red-950 border-red-900 text-red-200"
              }`}
            >
              {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                micOn ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white" : "bg-red-950 border-red-900 text-red-200"
              }`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={onLeave}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <PhoneOff className="w-3.5 h-3.5" /> Close Room
          </button>
        </div>

      </div>

      {/* Right Sidebar: Chat / Whiteboard OR Post Feedback/Ratings forms */}
      <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
        
        {/* If session is active & mock completed, show review or feedback card, otherwise chat/whiteboard */}
        {isCompletedState ? (
          // Review or feedback completion screen
          <div className="flex-1 flex flex-col justify-between h-full space-y-4">
            {isTrainer ? (
              // Trainer feedback summary state
              <div className="space-y-4">
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <h4 className="text-base font-semibold">Feedback Dispatch Confirmed</h4>
                  <p className="text-xs text-slate-400 mt-1">This session is marked as completed and results have been posted to student dashboard logs.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2">
                  <p className="text-xs text-slate-300 font-bold border-b border-slate-800 pb-1">REPORT SUMMARY CARD</p>
                  <p className="text-xs"><span className="text-slate-400">Score Awarded:</span> <span className="text-indigo-400 font-bold">{formScore}/100</span></p>
                  <p className="text-xs truncate"><span className="text-slate-400">Strengths:</span> {formStrengths}</p>
                  <p className="text-xs truncate"><span className="text-slate-400">Path:</span> {formPath}</p>
                </div>
                <button
                  onClick={onLeave}
                  className="w-full bg-slate-800 hover:bg-slate-755 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              // Student completes rating if not submitted
              <div className="flex flex-col justify-between h-full space-y-4">
                {!ratingSubmitted ? (
                  <div className="space-y-4">
                    <div className="text-center py-2">
                      <Award className="w-12 h-12 text-amber-500 mx-auto mb-2 animate-bounce" />
                      <h4 className="text-sm font-semibold">Rate Your Mock Interview Trainer</h4>
                      <p className="text-xs text-slate-400 mt-1">Leave professional reviews so administrative validators can maintain high trainer pricing accuracy.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">Your Rating</label>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => setGivenRating(stars)}
                            className="focus:outline-none cursor-pointer"
                          >
                            <Star className={`w-6 h-6 ${stars <= givenRating ? "text-amber-500 fill-amber-500" : "text-slate-700"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Written Feedback Report</label>
                      <textarea
                        value={givenReview}
                        onChange={(e) => setGivenReview(e.target.value)}
                        placeholder="Explain how Dr. Jane Doe helped you improve..."
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    <button
                      onClick={handleSendRating}
                      disabled={isSubmittingRating}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md"
                    >
                      {isSubmittingRating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Post stars & feedback"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto" />
                    <h5 className="font-semibold text-sm">Review Submitted Successfully!</h5>
                    <p className="text-xs text-slate-400">Your metrics have been integrated with trainer profiles statistics. Close room to update.</p>
                    <button
                      onClick={onLeave}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Dynamic Active State: Show tabs and inputs
          <div className="flex-1 flex flex-col justify-between h-full">
            
            {/* Show Quick action feedback layout directly if user is trainer. */}
            {isTrainer && (
              <div className="border border-indigo-900/30 bg-indigo-950/20 p-3 rounded-lg mb-3">
                <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider mb-1">Trainer Panel Action</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Instantly transition to form layout state
                      setActiveTab("board"); // whiteboard as notes or mock report form
                    }}
                    className="flex-1 bg-indigo-600 text-white text-[10px] py-1 px-2 rounded hover:bg-indigo-700 font-bold"
                  >
                    Write Evaluation Feedback
                  </button>
                </div>
              </div>
            )}

            <div className="flex border-b border-slate-800 pb-2 mb-3">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 text-center py-1 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === "chat" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"
                }`}
              >
                Room Chat ({messages.length})
              </button>
              <button
                onClick={() => setActiveTab("board")}
                className={`flex-1 text-center py-1 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === "board" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"
                }`}
              >
                {isTrainer ? "Evaluate Form" : "Technical Whiteboard"}
              </button>
            </div>

            {/* Content box based on Active Tab */}
            <div className="flex-1 overflow-y-auto mb-3 min-h-[180px] max-h-[300px]">
              {activeTab === "chat" ? (
                <div className="space-y-2 pr-1">
                  {messages.map((m) => {
                    const self = m.senderId === currentUser.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${self ? "items-end text-right" : "items-start"}`}>
                        <span className="text-[9px] text-slate-400">{m.senderName}</span>
                        <div className={`px-2.5 py-1.5 rounded-lg text-xs mt-0.5 max-w-[85%] leading-relaxed ${
                          self ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none"
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : isTrainer ? (
                // Trainer Feedback Assessment Creation form layout
                <div className="space-y-3 pr-1 text-xs">
                  <p className="font-bold text-[10px] text-indigo-400 uppercase tracking-widest mb-1">Candidate Grading Core</p>
                  
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Mock Assessment Score (0-100)</label>
                    <input
                      type="number"
                      value={formScore}
                      onChange={(e) => setFormScore(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Key Strengths (comma separated)</label>
                    <input
                      type="text"
                      value={formStrengths}
                      onChange={(e) => setFormStrengths(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Weaknesses (comma separated)</label>
                    <input
                      type="text"
                      value={formWeaknesses}
                      onChange={(e) => setFormWeaknesses(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Overall Core Assessment</label>
                    <textarea
                      value={formExplanation}
                      onChange={(e) => setFormExplanation(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Strategic Improvement Path</label>
                    <input
                      type="text"
                      value={formPath}
                      onChange={(e) => setFormPath(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-semibold text-emerald-400"
                    />
                  </div>

                  <button
                    onClick={handleSendFeedback}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-bold font-mono text-[10px] tracking-wider cursor-pointer mt-1"
                  >
                    Finish Session & Submit Feedback
                  </button>

                </div>
              ) : (
                // Student Whiteboard Markdown notes
                <textarea
                  value={whiteboardText}
                  onChange={(e) => setWhiteboardText(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-600 resize-none"
                />
              )}
            </div>

            {/* Chat Send interface */}
            {activeTab === "chat" && (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type session message..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
