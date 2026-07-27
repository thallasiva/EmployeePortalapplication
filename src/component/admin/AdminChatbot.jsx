import React, { useMemo, useState } from "react";
import { MessageCircle, Send, X, Bot } from "lucide-react";
import { INITIAL_LEAVE_REQUESTS } from "../../data/adminLeaveData";
import { getApprovedLeavesToday } from "../../utils/adminLeaveUtils";
import "./adminChatbot.css";import { cssClass, joinClasses } from "../../utils/classStyles";

const WELCOME =
"Hi! I'm your HR Admin Assistant (demo). Try:\n• \"Who is on leave today?\"\n• \"Show pending leave requests\"\n• \"Approve Priya Sharma leave\"\n\nLater you can connect this to auto-approve via API.";

const SUGGESTIONS = [
"Who is on leave today?",
"Show pending requests",
"Approve Priya Sharma leave",
"How many employees are late?"];


function matchReply(text, pending, onLeave) {
  const q = text.toLowerCase().trim();

  if (q.includes("on leave") || q.includes("who is leave")) {
    if (!onLeave.length) return "No employees on approved leave today.";
    const list = onLeave.map((r) => `• ${r.employee} (${r.type}, ${r.from}–${r.to})`).join("\n");
    return `${onLeave.length} employee(s) on leave today:\n${list}`;
  }

  if (q.includes("pending")) {
    if (!pending.length) return "No pending leave requests.";
    const list = pending.map((r) => `• ${r.employee} — ${r.type}, ${r.days} day(s)`).join("\n");
    return `${pending.length} pending request(s):\n${list}\n\nOpen Leave Management to approve.`;
  }

  if (q.includes("approve") && q.includes("priya")) {
    return "Demo: I would approve Priya Sharma's Sick Leave (28–29 May 2026).\n\nWhen connected to your backend, this runs automatically. For now, go to Leave → Pending and click Approve.";
  }

  if (q.includes("late")) {
    return "4 employees arrived late today: Rahul Mehta, Neha Kapoor, Vikram Singh, Ananya Iyer.\n\nOpen Attendance → Late Arrivals for details.";
  }

  if (q.includes("hello") || q.includes("hi")) {
    return "Hello! Ask me about leave, attendance, or pending approvals.";
  }

  return "I can help with:\n• Who is on leave today\n• Pending leave requests\n• Approve leave (demo)\n• Late employees\n\nTry a suggestion below or rephrase your question.";
}

export default function AdminChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
  { role: "bot", text: WELCOME }]
  );

  const pending = useMemo(
    () => INITIAL_LEAVE_REQUESTS.filter((r) => r.status === "Pending"),
    []
  );
  const onLeave = useMemo(
    () => getApprovedLeavesToday(INITIAL_LEAVE_REQUESTS, new Date()),
    []
  );

  const send = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    const reply = matchReply(trimmed, pending, onLeave);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    }, 400);
  };

  return (
    <>
      {open &&
      <div className="admin-chatbot-panel">
          <div className="admin-chatbot-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <p className="font-semibold text-sm">HR Admin Assistant</p>
                <p className="text-[10px] opacity-90">Sample — connect API later</p>
              </div>
            </div>
            <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-white/20 rounded"
            aria-label="Close chat">

              <X size={18} />
            </button>
          </div>

          <div className="admin-chatbot-messages">
            {messages.map((msg, i) =>
          <div
            key={`${msg.role}-${i}`}
            className={joinClasses(`admin-chatbot-msg admin-chatbot-msg--${msg.role}`, cssClass(
              { whiteSpace: "pre-line" }))}>

                {msg.text}
              </div>
          )}
          </div>

          <div className="admin-chatbot-suggestions">
            {SUGGESTIONS.map((s) =>
          <button
            key={s}
            type="button"
            className="admin-chatbot-chip"
            onClick={() => send(s)}>

                {s}
              </button>
          )}
          </div>

          <form
          className="admin-chatbot-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}>

            <input
            className="admin-chatbot-input"
            placeholder="Ask about leave, attendance..."
            value={input}
            onChange={(e) => setInput(e.target.value)} />

            <button type="submit" className="admin-chatbot-send" aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      }

      <button
        type="button"
        className="admin-chatbot-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open admin assistant">

        <MessageCircle size={26} />
      </button>
    </>);

}
