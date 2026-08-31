import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Bot, CheckCircle2, Clock, Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { answerAIInterview, completeAIInterview, getAIInterviewSession, startAIInterview } from "../../api/recruitment.api";

const PRIMARY = "#0E7C86";
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const supportsSpeechToText = Boolean(Recognition);
const supportsTextToSpeech = Boolean(window.speechSynthesis);
const primaryButton = { background: PRIMARY, color: "white", border: "none", borderRadius: 9, padding: "12px 18px", fontWeight: 700, cursor: "pointer" };
const linkButton = { background: "transparent", border: "none", color: PRIMARY, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: 0, fontWeight: 600 };
const formatTime = seconds => `${String(Math.floor(Math.max(seconds, 0) / 60)).padStart(2, "0")}:${String(Math.max(seconds, 0) % 60).padStart(2, "0")}`;

function speak(text, onEnd) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.95;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

function Page({ children }) {
  return <main style={{ minHeight: "100vh", background: "#f7fafc", fontFamily: "Inter, sans-serif", color: "#172033" }}>
    <header style={{ padding: "16px 6vw", background: "white", borderBottom: "1px solid #dce8ea", display: "flex", alignItems: "center", gap: 10 }}><Bot color={PRIMARY}/><strong>HRMS AI Interview</strong></header>
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>{children}</section>
  </main>;
}

export default function TakeInterview() {
  const { token } = useParams();
  const [screen, setScreen] = useState("loading");
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const answerRef = useRef("");

  const stopMedia = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (_) {}
    recognitionRef.current = null;
    setListening(false);
    setInterimTranscript("");
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => {
    getAIInterviewSession(token)
      .then(data => { setSession(data); setRemaining(data.remainingSeconds || data.durationSeconds || 0); setScreen("intro"); })
      .catch(err => { setError(err?.response?.data?.message || "This interview link is invalid or expired."); setScreen("error"); });
    return stopMedia;
  }, [token, stopMedia]);

  useEffect(() => {
    if (!session?.expiresAt || screen !== "interview") return undefined;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) { stopMedia(); completeAIInterview(token).catch(() => {}); setScreen("done"); }
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [session?.expiresAt, screen, stopMedia, token]);

  const readQuestion = useCallback(() => {
    if (!question?.question) return;
    setSpeaking(true);
    speak(question.question, () => setSpeaking(false));
  }, [question]);

  useEffect(() => { if (screen === "interview" && voiceMode) readQuestion(); }, [screen, voiceMode, question, readQuestion]);

  async function begin(useVoice) {
    try {
      setVoiceMode(useVoice);
      // A synchronous utterance inside the click handler unlocks speech playback in browsers that require user activation.
      if (useVoice) speak("Starting your AI interview.");
      setScreen("working");
      const data = await startAIInterview(token);
      setQuestion(data.question);
      setRemaining(data.remainingSeconds);
      setSession(prev => ({ ...prev, expiresAt: data.expiresAt }));
      setScreen("interview");
    } catch (err) { setError(err?.response?.data?.message || "Unable to start the interview."); setScreen("error"); }
  }

  function startListening() {
    if (!Recognition) return;
    window.speechSynthesis?.cancel(); setSpeaking(false); setInterimTranscript("");
    const recognizer = new Recognition();
    recognizer.lang = "en-IN";
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.onresult = event => {
      let finalText = "", interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += ` ${text}`;
        else interimText += ` ${text}`;
      }
      if (finalText.trim()) { answerRef.current = `${answerRef.current} ${finalText}`.trim(); setAnswer(answerRef.current); }
      setInterimTranscript(interimText.trim());
    };
    recognizer.onerror = event => { setListening(false); if (event.error === "not-allowed") setError("Microphone permission was denied. Allow microphone access and try again."); };
    recognizer.onend = () => { recognitionRef.current = null; setListening(false); setInterimTranscript(""); };
    recognitionRef.current = recognizer;
    recognizer.start();
    setListening(true);
  }

  async function submitAnswer() {
    if (!answer.trim()) return;
    stopMedia(); setScreen("working");
    try {
      const data = await answerAIInterview(token, answer.trim());
      if (data.complete) { setScreen("done"); return; }
      answerRef.current = ""; setAnswer(""); setQuestion(data.question); setRemaining(data.remainingSeconds);
      setSession(prev => ({ ...prev, expiresAt: data.expiresAt })); setScreen("interview");
    } catch (err) { setError(err?.response?.data?.message || "Your answer could not be saved."); setScreen("error"); }
  }

  async function finish() {
    stopMedia(); setScreen("working");
    try { await completeAIInterview(token); setScreen("done"); }
    catch (err) { setError(err?.response?.data?.message || "Unable to complete the interview."); setScreen("error"); }
  }

  if (screen === "loading" || screen === "working") return <Page><div style={{ textAlign: "center", padding: 70 }}><Loader2 color={PRIMARY} size={38} style={{ animation: "spin 1s linear infinite" }}/><p>{screen === "working" ? "The interviewer is reviewing your answer…" : "Loading interview…"}</p></div></Page>;
  if (screen === "error") return <Page><div style={{ textAlign: "center" }}><AlertCircle color="#dc2626" size={48}/><h1>Interview unavailable</h1><p>{error}</p></div></Page>;
  if (screen === "done") return <Page><div style={{ textAlign: "center", padding: 45 }}><CheckCircle2 color="#059669" size={62}/><h1>Interview complete</h1><p>Thank you for your time. Your responses have been securely recorded for the recruitment team.</p></div></Page>;
  if (screen === "intro") return <Page><article style={{ background: "white", border: "1px solid #dce8ea", borderRadius: 16, padding: 30 }}><Bot size={42} color={PRIMARY}/><h1>Welcome, {session?.candidateName}</h1><p>You'll interview for <strong>{session?.jobTitle}</strong>. The AI chooses each next question from your answer, experience, and the role requirements.</p><p><Clock size={16} style={{ verticalAlign: "middle" }}/> You have {Math.round((session?.durationSeconds || 0) / 60)} minutes once you begin. The server controls the timer.</p><p>Each answer is saved and evaluated before the AI asks the next question.</p><button onClick={() => begin(false)} style={primaryButton}>Begin with text</button>{supportsTextToSpeech && <button onClick={() => begin(true)} style={{ ...primaryButton, background: "white", color: PRIMARY, border: `1px solid ${PRIMARY}`, marginLeft: 10 }}>Begin with voice</button>}</article></Page>;
  return <Page><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, color: PRIMARY, fontWeight: 700 }}><span>{question?.type || "Interview question"}</span><span><Clock size={15} style={{ verticalAlign: "middle" }}/> {formatTime(remaining)}</span></div><article style={{ background: "white", border: "1px solid #dce8ea", borderRadius: 16, padding: 30 }}><div style={{ fontSize: 12, textTransform: "uppercase", color: "#64748b" }}>{question?.topic || question?.skill || "AI interviewer"} · {question?.difficulty || "calibrated"}</div><h1 style={{ fontSize: 22, lineHeight: 1.45 }}>{question?.question}</h1>{supportsTextToSpeech && <button onClick={readQuestion} style={linkButton}><Volume2 size={17}/>{speaking ? "Reading question…" : "Read question aloud"}</button>}<textarea value={answer} onChange={e => { answerRef.current = e.target.value; setAnswer(e.target.value); }} rows={7} placeholder="Type your answer, or use the microphone to convert speech to text…" style={{ width: "100%", boxSizing: "border-box", marginTop: 18, padding: 14, borderRadius: 10, border: "1px solid #b7cdd0", font: "inherit", lineHeight: 1.5 }}/>{supportsSpeechToText ? <div style={{ marginTop: 10 }}><button onClick={listening ? stopMedia : startListening} style={{ ...linkButton, color: listening ? "#dc2626" : PRIMARY }}>{listening ? <MicOff size={17}/> : <Mic size={17}/>} {listening ? "Stop recording" : "Speak answer"}</button>{listening && <span style={{ marginLeft: 10, color: "#64748b", fontSize: 13 }}>{interimTranscript ? `Listening: ${interimTranscript}` : "Listening…"}</span>}</div> : <p style={{ fontSize: 13, color: "#64748b" }}>Speech-to-text is available in Chrome or Edge. You can still type your answer.</p>}<div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}><button onClick={finish} style={linkButton}>Finish interview</button><button onClick={submitAnswer} disabled={!answer.trim()} style={{ ...primaryButton, opacity: answer.trim() ? 1 : .5 }}>Submit answer and continue</button></div></article></Page>;
}
