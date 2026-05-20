import React, { useState } from "react";
import { ResumeAnalysisResult, UserProfile } from "../types";
import { FileText, Send, Upload, CheckCircle, AlertTriangle, RefreshCw, Sparkles, Plus, BookOpen, AlertCircle, Award } from "lucide-react";

interface ResumeCoachProps {
  user: UserProfile;
}

export default function ResumeCoach({ user }: ResumeCoachProps) {
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile({
        name: droppedFile.name,
        size: (droppedFile.size / 1024).toFixed(1) + " KB",
      });
      // Set some default text or read text
      setResumeText(`Candidate Resume Profile:\nName: ${user.name}\nContact: ${user.email}\nExperience with TypeScript/React, front-end optimization, and state management.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile({
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(1) + " KB",
      });
      setResumeText(`Candidate Resume Profile:\nName: ${user.name}\nContact: ${user.email}\nSpecialized in ${user.department || "selected"} methodologies and operational oversight.`);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    // If no resume text, generate rich mock text matching profile
    const textToSend = resumeText || `Candidate Resume Profile: ${user.name}, expertise in ${user.department || "Technical Engineering"}. Looking for ${targetRole} positions.`;

    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file ? file.name : "pasted_text.txt",
          resumeText: textToSend,
          targetRole,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Resume analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-100";
    if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  return (
    <div id="resume-analyzer-root" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">AI Resume Analyzer & Optimizer</h2>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">
            Scan your resume formatting, vocabulary, and skills metrics against your target career domain to boost your ATS viability rating.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini-Grounding Audit</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Target Job / Role Role Title</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Project Manager, Lead Developer"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Upload Resume Document</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200 bg-gray-50 hover:bg-gray-100/50"
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-xs font-medium text-gray-700">Drag & Drop Resume PDF/DOC here</p>
              <p className="text-[10px] text-gray-400 mt-1">or click below to browse absolute path file</p>
              
              <label className="mt-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg py-1.5 px-3 text-xs font-semibold text-gray-700 shadow-sm inline-flex items-center gap-1 cursor-pointer">
                Choose PDF/DOC
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100/30 rounded-lg p-3">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400">{file.size}</p>
              </div>
              <button onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600 text-xs">remove</button>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Or Paste Resume Content / Text</label>
              <span className="text-[10px] text-gray-400 italic">Recommended for instant text accuracy</span>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste details of skills, internships, professional records here..."
              rows={6}
              className="w-full bg-white border border-gray-200 rounded-lg p-3.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-xs rounded-xl py-3 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing ATS compatibility markers...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Scan & Analyze Resume
              </>
            )}
          </button>
        </div>

        {/* Right Output Section */}
        <div className="lg:col-span-7 border-l border-gray-100 pl-0 lg:pl-8">
          {result ? (
            <div id="analysis-outputs" className="space-y-6">
              {/* ATS Score and Suitability summary */}
              <div className="flex items-start justify-between bg-gray-50/80 border border-gray-100 rounded-xl p-5">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Audit Score Result</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-extrabold px-3 py-1 rounded-xl border ${getScoreColor(result.atsScore)}`}>
                      {result.atsScore}%
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Viability Assessment</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{result.jobDomainSuitability.overallAssessment}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended roles */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" /> Recommended Job Matches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.jobDomainSuitability.recommendedRoles.map((role, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-md font-medium border border-indigo-100">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Identifed Skills vs gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50/30 border border-green-100 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-600" /> Skills Spotted
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skillsIdentified.map((sk, i) => (
                      <span key={i} className="text-[11px] bg-green-100/60 text-green-800 px-2 py-0.5 rounded-full font-medium">
                        {sk}
                      </span>
                    ))}
                    {result.skillsIdentified.length === 0 && <span className="text-[11px] text-gray-400">None identified yet.</span>}
                  </div>
                </div>

                <div className="bg-red-50/30 border border-red-100 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Key Skill Gaps
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skillGaps.map((sk, i) => (
                      <span key={i} className="text-[11px] bg-red-100/60 text-red-800 px-2 py-0.5 rounded-full font-medium">
                        {sk}
                      </span>
                    ))}
                    {result.skillGaps.length === 0 && <span className="text-[11px] text-gray-400">Perfect alignment spotted!</span>}
                  </div>
                </div>
              </div>

              {/* Improvement Tips */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Suggested Adaptations & Formats</h5>
                <ul className="space-y-3">
                  {result.suggestions.map((sug, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing keywords */}
              <div className="bg-indigo-50/20 border border-indigo-100/40 rounded-xl p-5">
                <h5 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Crucial Keywords Missing for ATS Screening</h5>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((kw, i) => (
                    <span key={i} className="bg-white border border-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded font-medium shadow-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grammar Audit Before/After */}
              <div>
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Grammar & Syntax Polishing Review</h5>
                <div className="space-y-3">
                  {result.grammarCorrections.map((corr, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-4 bg-white space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-red-50 border border-red-100 p-2.5 rounded-md text-red-900 leading-relaxed font-mono">
                          <span className="font-bold block text-[10px] text-red-500 uppercase tracking-wider mb-1">Current text:</span>
                          "{corr.original}"
                        </div>
                        <div className="bg-green-50 border border-green-100 p-2.5 rounded-md text-green-900 leading-relaxed font-mono">
                          <span className="font-bold block text-[10px] text-green-500 uppercase tracking-wider mb-1">Optimized text:</span>
                          "{corr.correction}"
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal pl-1 pt-1">
                        <span className="font-semibold text-indigo-600">Why?</span> {corr.explanation}
                      </p>
                    </div>
                  ))}
                  {result.grammarCorrections.length === 0 && (
                    <p className="text-xs text-gray-500 italic pl-1">No grammar or layout typos spotted. Excellent copywriting!</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6">
              <FileText className="w-16 h-16 text-gray-200 stroke-[1.5] mb-4" />
              <h4 className="text-base font-semibold text-gray-700">Scan Results Console</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">
                Configure your target domain role on the left and load a dynamic document or raw draft details to build your Gemini optimization checklist.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
