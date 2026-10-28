import { useEffect, useState } from "react";
import { Globe, Phone, Mail, MapPin, ExternalLink, Building2 } from "lucide-react";
const COMPANIES = [
{
  name: "HRMS",
  website: "",
  phone: "",
  email: "",
  address: "—",
  about: "HRMS company profile.",
  logo: "",
  industry: "Human Resources",
  founded: "—",
  size: "—"
}];
export default function DetailsScreen() {
  const [selected, setSelected] = useState(0);
  const co = COMPANIES[selected];
  return (
    <div className="space-y-5">
      {}
      <div className="flex gap-2 flex-wrap">
        {COMPANIES.map((c, i) =>
        <button key={c.name} type="button" onClick={() => setSelected(i)}
        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
        selected === i ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-200 hover:border-brand"}`
        }>
            {c.name}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden xl:col-span-1">
          <div className="h-20 bg-gradient-to-br from-brand to-orange-600" />
          <div className="px-5 pb-5">
            <div className="-mt-7 mb-3">
              <div className="w-14 h-14 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                {co.logo && <img src={co.logo} alt={co.name}
                className="w-full h-full object-contain p-1"
                onError={(e) => {e.target.style.display = "none";e.target.nextSibling.style.display = "flex";}} />}
                <div className={`w-full h-full bg-brand text-white text-lg font-bold items-center justify-center ${co.logo ? "hidden" : "flex"}`}>{co.name[0]}</div>
              </div>
            </div>
            <h2 className="font-bold text-gray-900 text-base">{co.name}</h2>
            <p className="text-xs text-gray-500 mt-1">{co.industry}</p>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">{co.about}</p>
            {co.website && <a href={co.website} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium">
              <Globe size={11} /> {co.website.replace("https://", "")} <ExternalLink size={10} />
            </a>}
          </div>
        </div>
        {}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Building2 size={15} className="text-brand" /> Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
              { icon: <Mail size={14} />, label: "Email", value: co.email, href: `mailto:${co.email}` },
              { icon: <Phone size={14} />, label: "Phone", value: co.phone || "—", href: co.phone ? `tel:${co.phone}` : null },
              { icon: <Globe size={14} />, label: "Website", value: co.website.replace("https://", ""), href: co.website },
              { icon: <MapPin size={14} />, label: "Address", value: co.address }].
              map(({ icon, label, value, href }) =>
              <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">{icon}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                    {href ?
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className="text-sm text-brand font-medium hover:underline break-all">{value}</a> :
                  <p className="text-sm text-gray-700 font-medium break-all">{value}</p>
                  }
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Company Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
              { label: "Industry", value: co.industry },
              { label: "Founded", value: co.founded },
              { label: "Company Size", value: co.size }].
              map(({ label, value }) =>
              <div key={label} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
