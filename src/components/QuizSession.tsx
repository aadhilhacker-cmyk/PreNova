import React, { useState, useEffect } from "react";
import { QuizQuestion, UserProfile } from "../types";
import { Award, BookOpen, ChevronRight, Clock, HelpCircle, RefreshCw, Star, ThumbsUp, XCircle, AlertCircle } from "lucide-react";

interface QuizSessionProps {
  user: UserProfile;
  department: string;
  onCompleted: () => void;
}

export default function QuizSession({ user, department, onCompleted }: QuizSessionProps) {
  const [domain, setDomain] = useState("Frontend Engineer");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    results: any[];
    feedback: { strengths: string[]; weaknesses: string[]; summary: string };
  } | null>(null);

  // Suggested roles by department to make domain selection seamless
  const domainsByDept: Record<string, string[]> = {
    "Computer Science": ["Frontend Engineer", "Backend Developer", "Full-Stack Specialist", "AI Researcher", "Data Sign Scientist"],
    "Commerce": ["Chartered Accountant", "Financial Analyst", "Tax Auditor", "Operations Consultant"],
    "MBA": ["Product Manager", "Management Consultant", "HR Manager", "Senior Marketer"],
    "Medical": ["Resident Physician", "Clinical Researcher", "Hospital Administrator", "Surgical Specialist"],
    "Law": ["Corporate Lawyer", "Litigation Attorney", "Compliance Auditor", "Family Law Practitioner"],
    "Electrical": ["Power Systems Engineer", "Embedded Systems Designer", "Control Engineer"],
    "Mechanical": ["Automotive CAD Designer", "Fluid Dynamics Specialist", "HVAC Design Engineer"],
    "IT": ["Cloud Architect", "Information Security Specialist", "System Administrator", "DevOps Engineer"]
  };

  const defaultDomains = domainsByDept[department] || ["General Professional", "Executive Assistant", "Strategic Planner", "Associate Manager"];

  useEffect(() => {
    // Sync default domain on department change
    if (defaultDomains.length > 0) {
      setDomain(defaultDomains[0]);
    }
  }, [department]);

  // Handle timer
  useEffect(() => {
    if (!quizStarted || quizResult || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [quizStarted, quizResult, timeLeft]);

  // Auto-submit on time exhaustion
  useEffect(() => {
    if (timeLeft === 0 && quizStarted && !quizResult) {
      handleSubmitQuiz();
    }
  }, [timeLeft]);

  const handleStartQuiz = async () => {
    setIsGenerating(true);
    setQuizResult(null);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setTimeLeft(300);

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department, domain, level }),
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
        setQuizStarted(true);
      } else {
        throw new Error("Invalid question format received");
      }
    } catch (err) {
      console.error("Quiz generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (optionIdx: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIndex]: optionIdx,
    });
  };

  const handleSubmitQuiz = async () => {
    setIsEvaluating(true);
    const answersArray = questions.map((_, idx) => selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1);
    try {
      const res = await fetch("/api/quiz/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          department,
          domain,
          level,
          answers: answersArray,
          questions,
        }),
      });
      const data = await res.json();
      setQuizResult(data);
    } catch (err) {
      console.error("Evaluation failed", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? "0" : ""}${remSecs}`;
  };

  const getDifficultyBadgeColor = (l: string) => {
    switch (l) {
      case "beginner": return "bg-green-50 text-green-700 border-green-200";
      case "intermediate": return "bg-blue-50 text-blue-700 border-blue-200";
      case "advanced": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div id="quiz-trainer-root" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
      {!quizStarted ? (
        <div id="quiz-setup" className="max-w-2xl mx-auto text-center py-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Free AI Interview Practice</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Generate customized MCQ, aptitude, technical, or behavioral questions using Gemini. Receive instant scores, strength feedback, and step-by-step logic explanations.
          </p>

          <div className="mt-8 space-y-6 text-left bg-gray-50 border border-gray-100 rounded-xl p-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Target Career Role / Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {defaultDomains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Skill Experience Level</label>
              <div className="grid grid-cols-3 gap-3">
                {(["beginner", "intermediate", "advanced"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center capitalize transition-all ${
                      level === l
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={isGenerating}
            className="mt-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-xl py-3 px-8 shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating customized mock test...
              </>
            ) : (
              "Launch 5-Question AI Test"
            )}
          </button>
        </div>
      ) : quizResult ? (
        // Score Report Screen
        <div id="quiz-result" className="max-w-3xl mx-auto py-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Quiz Completed!</h3>
            <p className="text-sm text-gray-500 mt-1">Topic: {domain} • Level: <span className="capitalize">{level}</span></p>

            <div className="mt-6 inline-flex items-center justify-center p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <div className="text-center">
                <span className="text-4xl font-extrabold text-indigo-600">{quizResult.score}%</span>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
                  Score ({quizResult.correctCount}/{quizResult.totalQuestions} Correct)
                </p>
              </div>
            </div>
          </div>

          {/* AI Insights & Feedback */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <ThumbsUp className="w-4 h-4 text-green-600" /> Key Strengths
              </h4>
              <ul className="space-y-2">
                {quizResult.feedback.strengths.map((str, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-purple-600" /> Suggested Improvements
              </h4>
              <ul className="space-y-2">
                {quizResult.feedback.weaknesses.map((weak, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Explanations Accordion */}
          <div className="mt-8 space-y-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Detailed Answers & AI Explanations</h4>
            {questions.map((q, idx) => {
              const resObj = quizResult.results.find((r) => r.questionId === q.id);
              const isCorrect = resObj ? resObj.isCorrect : false;
              return (
                <div key={idx} className={`p-5 rounded-xl border ${isCorrect ? "border-green-100 bg-green-50/10" : "border-red-100 bg-red-50/10"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                      isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{q.question}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        {q.options.map((opt, oIdx) => {
                          const isStudentPick = selectedAnswers[idx] === oIdx;
                          const isCorrectOption = q.correctOptionIndex === oIdx;
                          return (
                            <div key={oIdx} className={`px-3 py-2 text-xs rounded border flex items-center justify-between ${
                              isCorrectOption 
                                ? "bg-green-50 border-green-200 text-green-800 font-medium" 
                                : isStudentPick 
                                  ? "bg-red-50 border-red-200 text-red-800"
                                  : "bg-white border-gray-100 text-gray-600"
                            }`}>
                              <span>{opt}</span>
                              {isCorrectOption && <span className="text-[10px] bg-green-200/50 text-green-800 px-1 rounded">Correct</span>}
                              {isStudentPick && !isCorrectOption && <span className="text-[10px] bg-red-200/50 text-red-800 px-1 rounded">Your Pick</span>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-xs bg-gray-50 border border-gray-100 rounded p-3 text-gray-600">
                        <span className="font-semibold text-indigo-600">AI Explanation:</span> {q.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              onClick={() => setQuizStarted(false)}
              className="px-5 py-2.5 text-xs font-semibold border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-700 mr-2 cursor-pointer"
            >
              Configure New Test
            </button>
            <button
              onClick={onCompleted}
              className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm cursor-pointer"
            >
              Done & Return Dashboard
            </button>
          </div>
        </div>
      ) : (
        // Core Live Quiz Taking View
        <div id="quiz-session-active" className="max-w-2xl mx-auto py-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <div>
              <span className={`px-2.5 py-1 text-xs font-medium uppercase border rounded-full ${getDifficultyBadgeColor(level)}`}>
                {level}
              </span>
              <span className="text-xs text-gray-400 ml-3">Domain: {domain}</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-semibold">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="w-full bg-gray-100 h-2 rounded-full mb-8 relative overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Question {currentIndex + 1} of {questions.length}</p>
          <h3 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
            {questions[currentIndex]?.question}
          </h3>

          <div className="space-y-3">
            {questions[currentIndex]?.options.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => handleOptionSelect(oIdx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm flex items-center justify-between cursor-pointer ${
                  selectedAnswers[currentIndex] === oIdx
                    ? "bg-indigo-50/50 border-indigo-600 text-indigo-900 font-medium"
                    : "bg-white border-gray-100 text-gray-600 hover:border-gray-200"
                }`}
              >
                <span>{opt}</span>
                <span className={`w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center shrink-0 ${
                  selectedAnswers[currentIndex] === oIdx ? "border-indigo-600 bg-indigo-600" : ""
                }`}>
                  {selectedAnswers[currentIndex] === oIdx && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-8">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-transparent disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                Next Question <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={isEvaluating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Calculating Feedback...
                  </>
                ) : (
                  "Finish & Get Score"
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
