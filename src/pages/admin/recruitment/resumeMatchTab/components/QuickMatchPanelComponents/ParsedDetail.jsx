import React from "react";
import { Zap, MapPin, Briefcase, Building2, Link2, GitBranch, Clock, DollarSign, BookOpen, Award, Globe, User, Star, Sparkles } from "lucide-react";
import ScoreCircle from ".././ScoreCircle";
import RecBadge from ".././RecBadge";
import SkillBar from ".././SkillBar";
import SkillPills from ".././SkillPills";
/* ── Helpers ── */
import { fmt, fmtDays } from "./shared";
import { InfoRow } from "./InfoRow";
import { Section } from "./Section";
/* ── Parsed resume detail panel ── */
function ParsedDetail({
  parsed,
  result
}) {
  const matched = result?.matched ?? [];
  const missing = result?.missing ?? [];
  const rec = result?.recommendation;
  return <div className="px-5 py-[18px] bg-gray-50 overflow-y-auto max-h-[80vh]">
      <div className="text-[12px] font-bold text-gray-500 uppercase tracking-[0.04em] mb-3">
        Result — {result?.jobTitle}
      </div>
      {/* Score + recommendation */}
      <div className="flex items-center gap-3.5 mb-3 px-3.5 py-3 bg-white rounded-xl border border-gray-200">
        <ScoreCircle score={result?.matchScore} size={68} />
        <div className="flex-1">
          <RecBadge label={rec} />
          <div className="text-[11px] text-gray-500 mt-1">
            Required: <strong>{result?.jobExperienceLevel || "Not specified"}</strong>
          </div>
          {parsed?.resume_score != null && <div className="text-[11px] text-[#e87500] mt-0.5 flex items-center gap-1">
              <Star size={10} /> Resume Score: <strong>{parsed.resume_score}/100</strong>
            </div>}
        </div>
        {parsed?.parsedBy && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${parsed.parsedBy === "openai" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            {parsed.parsedBy === "openai" ? <span className="inline-flex items-center gap-1"><Sparkles size={12} /> AI Parsed</span> : <span className="inline-flex items-center gap-1"><Zap size={12} /> Regex Parsed</span>}
          </span>}
      </div>
      {/* Skill bars */}
      <div className="mb-3">
        <SkillBar label="Skills (60%)" score={result?.skillScore} color="#7c3aed" />
        <SkillBar label="Experience (40%)" score={result?.expScore} color="#c45f00" />
      </div>
      {/* Matched / missing skills */}
      {(matched.length > 0 || missing.length > 0) && <Section title={`Skills Match (${matched.length} matched / ${missing.length} missing)`}>
          {matched.length > 0 && <div className="mb-2">
              <div className="text-[11px] font-bold text-emerald-600 mb-1">Matched ({matched.length})</div>
              <SkillPills skills={matched} matched={true} />
            </div>}
          {missing.length > 0 && <div>
              <div className="text-[11px] font-bold text-red-500 mb-1">Missing ({missing.length})</div>
              <SkillPills skills={missing} matched={false} />
            </div>}
        </Section>}
      {/* Candidate identity */}
      {parsed && (parsed.name || parsed.email || parsed.phone) && <Section title="Candidate Identity">
          <InfoRow icon={<User size={13} />} label="Name" value={parsed.name} />
          <InfoRow icon={<Zap size={13} />} label="Email" value={parsed.email} />
          <InfoRow icon={<Zap size={13} />} label="Phone" value={parsed.phone} />
          <InfoRow icon={<MapPin size={13} />} label="Location" value={parsed.location} />
          {parsed.linkedin_url && <div className="flex items-center gap-2 py-1.5">
              <Link2 size={13} className="text-[#e87500] shrink-0" />
              <a href={parsed.linkedin_url} target="_blank" rel="noreferrer" className="text-[12px] text-blue-600 hover:underline truncate">{parsed.linkedin_url}</a>
            </div>}
          {parsed.github_url && <div className="flex items-center gap-2 py-1.5">
              <GitBranch size={13} className="text-[#e87500] shrink-0" />
              <a href={parsed.github_url} target="_blank" rel="noreferrer" className="text-[12px] text-blue-600 hover:underline truncate">{parsed.github_url}</a>
            </div>}
        </Section>}
      {/* Current position */}
      {parsed && (parsed.current_role || parsed.current_company || parsed.experience) && <Section title="Current Position">
          <InfoRow icon={<Briefcase size={13} />} label="Role" value={parsed.current_role} />
          <InfoRow icon={<Building2 size={13} />} label="Company" value={parsed.current_company} />
          <InfoRow icon={<Clock size={13} />} label="Experience" value={parsed.experience ? `${parsed.experience} years` : null} />
        </Section>}
      {/* Compensation */}
      {parsed && (parsed.current_ctc_annual || parsed.expected_ctc_annual || parsed.notice_period_days != null) && <Section title="Compensation & Availability">
          <InfoRow icon={<DollarSign size={13} />} label="Current CTC" value={fmt(parsed.current_ctc_annual)} />
          <InfoRow icon={<DollarSign size={13} />} label="Expected CTC" value={fmt(parsed.expected_ctc_annual)} />
          <InfoRow icon={<Clock size={13} />} label="Notice Period" value={fmtDays(parsed.notice_period_days)} />
        </Section>}
      {/* All skills */}
      {parsed?.skills?.length > 0 && <Section title={`Skills (${parsed.skills.length})`} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.skills.map(s => <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-[#fff8f0] border border-[#fed7aa] text-[#e87500] font-medium">{s}</span>)}
          </div>
        </Section>}
      {/* Work experience */}
      {parsed?.work_experience?.length > 0 && <Section title={`Work Experience (${parsed.work_experience.length})`} defaultOpen={false}>
          <div className="space-y-3 pt-1">
            {parsed.work_experience.map((w, i) => <div key={i} className="border-l-2 border-[#e87500] pl-3">
                <p className="text-[12px] font-bold text-[#e87500]">{w.designation || "Role"}</p>
                <p className="text-[11px] text-[#64748b]">{w.company_name}</p>
                <p className="text-[10px] text-[#94a3b8]">
                  {[w.start_month && w.start_year ? `${w.start_month}/${w.start_year}` : w.start_year, "–", w.is_current ? "Present" : w.end_month && w.end_year ? `${w.end_month}/${w.end_year}` : w.end_year].filter(Boolean).join(" ")}
                </p>
                {w.description && <p className="text-[11px] text-[#64748b] mt-1 line-clamp-2">{w.description}</p>}
              </div>)}
          </div>
        </Section>}
      {/* Education */}
      {parsed?.education?.length > 0 && <Section title={`Education (${parsed.education.length})`} defaultOpen={false}>
          <div className="space-y-2 pt-1">
            {parsed.education.map((e, i) => <div key={i} className="flex items-start gap-2">
                <BookOpen size={12} className="text-[#e87500] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-[#1e293b]">{e.degree}</p>
                  <p className="text-[11px] text-[#64748b]">{[e.institution, e.year].filter(Boolean).join(" · ")}</p>
                </div>
              </div>)}
          </div>
        </Section>}
      {/* Certifications */}
      {parsed?.certifications?.length > 0 && <Section title={`Certifications (${parsed.certifications.length})`} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.certifications.map(c => <span key={c} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium flex items-center gap-1">
                <Award size={9} />{c}
              </span>)}
          </div>
        </Section>}
      {/* Languages */}
      {parsed?.languages?.length > 0 && <Section title="Languages" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.languages.map(l => <span key={l} className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium flex items-center gap-1">
                <Globe size={9} />{l}
              </span>)}
          </div>
        </Section>}
      {/* Summary */}
      {parsed?.summary && <Section title="Summary" defaultOpen={false}>
          <p className="text-[12px] text-[#374151] leading-relaxed pt-1">{parsed.summary}</p>
        </Section>}
      {/* Companies history */}
      {parsed?.companies?.length > 0 && <Section title="Companies History" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.companies.map(c => <span key={c} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-medium">{c}</span>)}
          </div>
        </Section>}
    </div>;
}
/* ── Main panel ── */
export { ParsedDetail };
