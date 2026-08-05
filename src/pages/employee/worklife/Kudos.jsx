import React, { useState } from "react";
import { Award, ThumbsUp, Send, Star, Heart, Zap, X } from "lucide-react";
import { getUserInitials } from "../../../lib/dateUtils";

const recentKudos = [
  { id: 1, from: "Alex Kumar",   initials: "AK", to: "You", category: "Teamwork",      message: "Great teamwork and excellent support on the Q3 project!",     time: "2 hours ago",  color: "bg-amber-100 text-amber-700" },
  { id: 2, from: "Priya Sharma", initials: "PS", to: "You", category: "Delivery",      message: "Thank you for helping complete the release on time. Amazing!",  time: "1 day ago",    color: "bg-blue-100 text-blue-700" },
  { id: 3, from: "Rahul Mehta",  initials: "RM", to: "You", category: "Presentation",  message: "Outstanding presentation to the client team. Very impressive.", time: "3 days ago",   color: "bg-purple-100 text-purple-700" },
];

const CATEGORIES = ["Teamwork", "Innovation", "Leadership", "Delivery", "Support", "Above & Beyond"];

function GiveKudosModal({ onClose }) {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Teamwork");
  const [to, setTo] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award size={20} className="text-amber-500" /> Give Kudos
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">To</label>
            <input
              value={to} onChange={(e) => setTo(e.target.value)}
              placeholder="Employee name or email"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#f18200] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    category === c ? "bg-[#f18200] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Message</label>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              rows={3} placeholder="Write a recognition message…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#f18200] transition-colors resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button className="flex-1 h-10 rounded-xl bg-[#f18200] hover:bg-[#e07000] text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
              <Send size={15} /> Send Kudos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className={`${bg} rounded-2xl p-5 flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-0.5">{value}</p>
    </div>
  </div>
);

const Kudos = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {showModal && <GiveKudosModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kudos & Recognition</h1>
          <p className="text-slate-500 mt-1 text-sm">Appreciate and celebrate your teammates.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#f18200] hover:bg-[#e07000] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm transition-colors"
        >
          <Send size={15} /> Give Kudos
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Award size={22} className="text-amber-500" />}  label="Total Kudos"  value="24" color="bg-amber-50"  bg="bg-white border border-slate-100 shadow-sm" />
        <StatCard icon={<Heart size={22} className="text-rose-500" />}   label="Received"     value="15" color="bg-rose-50"   bg="bg-white border border-slate-100 shadow-sm" />
        <StatCard icon={<Zap size={22} className="text-[#f18200]" />}    label="Given"        value="9"  color="bg-orange-50" bg="bg-white border border-slate-100 shadow-sm" />
      </div>

      {/* Recent Kudos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Recent Kudos Received</h2>
        <div className="space-y-3">
          {recentKudos.map((item) => (
            <div key={item.id} className="flex items-start gap-4 border border-slate-100 rounded-xl p-4 hover:bg-slate-50/60 transition-colors">
              <div className="w-11 h-11 rounded-full bg-[#fff8f0] flex items-center justify-center font-bold text-[#f18200] text-sm shrink-0">
                {item.initials || getUserInitials(item.from)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">{item.from}</span>
                  <span className="text-xs text-slate-400">recognized you for</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.color}`}>{item.category}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{item.message}</p>
                <p className="text-xs text-slate-400 mt-2">{item.time}</p>
              </div>
              <Star size={18} className="text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Kudos;
