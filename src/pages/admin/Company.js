import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Globe, Mail, MapPin, Phone, ExternalLink, Building2, Tag, Activity, CheckCircle2 } from 'lucide-react';import { cssClass, joinClasses } from "../../utils/classStyles";

const COMPANIES = [
{
  id: 'natit',
  name: 'NAT IT Services Pvt. Ltd.',
  short: 'NAT IT',
  logo: 'https://www.natit.in/assets/images/logo.png',
  banner: 'linear-gradient(135deg, #f18200 0%, #e05c00 100%)',
  address: 'Plot no. 21, Sruthi Sadan, Gachibowli, Hyderabad, Telangana',
  phone: '+91 9010877718',
  email: 'hr@natit.in',
  website: 'https://www.natit.in',
  language: 'English',
  currency: 'Indian Rupee (₹)',
  source: 'Direct',
  createdOn: '01 Jan 2004',
  lastModified: 'Today',
  tags: ['IT Services', 'Consulting', 'Product'],
  about: 'NAT IT Services is a newly emerging one-stop solution provider for all your IT needs. It currently focuses on Consulting services, Application Implementations, Support and Maintenance. We provide a complete suite of All IT services to our clients.',
  products: [
  { name: 'HiTrack', url: 'https://www.natsoft.us/hitrack', desc: 'Project tracking & management platform' },
  { name: 'Optio', url: 'https://www.natsoft.us/optio', desc: 'Business intelligence & analytics tool' },
  { name: 'NatCoin', url: 'https://www.natsoft.us/nat-coin', desc: 'Blockchain-powered digital asset solution' },
  { name: 'Gauge', url: 'https://www.natsoft.us/gauge', desc: 'Performance monitoring & KPI dashboard' }],

  services: [
  { name: 'Blockchain', url: 'https://www.natsoft.us/blockchain' },
  { name: 'Legacy Modernization', url: 'https://www.natsoft.us/modernization' },
  { name: 'Artificial Intelligence', url: 'https://www.natsoft.us/ai-ml' },
  { name: 'Salesforce', url: 'https://www.natsoft.us/salesforce' },
  { name: 'Cloud', url: 'https://www.natsoft.us/cloud' },
  { name: 'Power Apps', url: 'https://www.natsoft.us/powerapps' },
  { name: 'Data Solutions', url: 'https://www.natsoft.us/data-solutions' },
  { name: 'System Integration', url: 'https://www.natsoft.us/system-integration' }],

  social: { linkedin: 'https://www.linkedin.com/company/nat-it-services', twitter: 'https://twitter.com/natitservices', instagram: 'https://instagram.com/natitservices' }
},
{
  id: 'natsoft-corp',
  name: 'Natsoft Corporation',
  short: 'Natsoft Corp',
  logo: 'https://natsoft.us/assets/images/logo.png',
  banner: 'linear-gradient(135deg, #1a56db 0%, #0e3a8a 100%)',
  address: '100 Technology Drive, Austin, TX 78701, United States',
  phone: '+1 (512) 900-0000',
  email: 'contact@natsoft.us',
  website: 'https://natsoft.us',
  language: 'English',
  currency: 'US Dollar ($)',
  source: 'Parent',
  createdOn: '15 Mar 2015',
  lastModified: 'Today',
  tags: ['Digital Transformation', 'Legacy Modernization', 'Global'],
  about: 'Natsoft Corporation is a global digital transformation services company. Reach the future faster with fully automated legacy modernization and migration solutions that deliver success every time.',
  products: [],
  services: [],
  social: { linkedin: 'https://www.linkedin.com/company/natsoft' }
},
{
  id: 'kognitic',
  name: 'Kognitic',
  short: 'Kognitic',
  logo: 'https://kognitic.com/_astro/logo-kognitic.NzrletX4_Z12DURN.webp',
  banner: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
  address: 'United States',
  phone: '',
  email: 'info@kognitic.com',
  website: 'https://natsoft.us',
  language: 'English',
  currency: 'US Dollar ($)',
  source: 'Subsidiary',
  createdOn: '01 Jan 2020',
  lastModified: 'Today',
  tags: ['Life Sciences', 'AI', 'Commercial Decision Engine'],
  about: 'Kognitic is The Commercial Decision Engine for Life Sciences — delivering intelligent, data-driven commercial insights that help life sciences organizations make faster, smarter decisions.',
  products: [],
  services: [],
  social: {}
},
{
  id: 'updraftworks',
  name: 'UpdraftWorks',
  short: 'UpdraftWorks',
  logo: 'https://updraftworks.com/images/theme-images/new-logo-1.png',
  banner: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
  address: 'United States',
  phone: '',
  email: 'info@updraftworks.com',
  website: 'https://updraftworks.com',
  language: 'English',
  currency: 'US Dollar ($)',
  source: 'Partner',
  createdOn: '01 Jan 2021',
  lastModified: 'Today',
  tags: ['Technology', 'Innovation', 'Consulting'],
  about: 'UpdraftWorks delivers cutting-edge technology solutions and consulting services to help businesses transform and grow.',
  products: [],
  services: [],
  social: {}
}];


function LinkedInIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.98 1.98 0 0 1-1.981-1.98c0-1.094.887-1.981 1.981-1.981s1.98.887 1.98 1.98a1.98 1.98 0 0 1-1.98 1.981zm1.706 13.019H3.63V9h3.414v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
}
function TwitterIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}
function InstagramIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>;
}

function CompanySwitcher({ companies, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) {if (ref.current && !ref.current.contains(e.target)) setOpen(false);}
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
      className="flex items-center gap-2 border border-slate-300 bg-white rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
        {selected.logo ?
        <img src={selected.logo} alt="" className="h-5 w-auto object-contain" onError={(e) => {e.target.style.display = 'none';}} /> :
        <span className="w-5 h-5 rounded bg-brand text-white flex items-center justify-center text-[10px] font-bold">{selected.short[0]}</span>}
        {selected.name}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open &&
      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[260px] py-1">
          {companies.map((co) =>
        <button key={co.id} type="button" onClick={() => {onSelect(co);setOpen(false);}}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 text-left ${co.id === selected.id ? 'bg-brand-50 text-brand font-medium' : 'text-slate-700'}`}>
              {co.logo ?
          <img src={co.logo} alt="" className="h-5 w-auto object-contain" onError={(e) => {e.target.style.display = 'none';}} /> :
          <span className="w-6 h-6 rounded bg-brand text-white flex items-center justify-center text-[10px] font-bold shrink-0">{co.short[0]}</span>}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{co.name}</p>
                {co.email && <p className="text-[11px] text-slate-400 truncate">{co.email}</p>}
              </div>
              {co.id === selected.id && <CheckCircle2 size={14} className="text-brand shrink-0" />}
            </button>
        )}
        </div>
      }
    </div>);

}

export default function Company() {
  const [company, setCompany] = useState(COMPANIES[0]);
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-slate-400">Admin / Company</p>
          <h1 className="text-lg font-semibold text-slate-800">Company Profile</h1>
        </div>
        <CompanySwitcher companies={COMPANIES} selected={company} onSelect={setCompany} />
      </div>

      <div className="px-6 flex gap-6 items-start">
        {}
        <div className="w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={joinClasses("h-24 w-full", cssClass({ background: company.banner }))} />
            <div className="px-5 pb-4">
              <div className="-mt-8 mb-3">
                <div className="w-16 h-16 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                  {company.logo ?
                  <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-1" onError={(e) => {e.target.style.display = 'none';e.target.nextSibling.style.display = 'flex';}} /> :
                  null}
                  <div className={joinClasses("w-full h-full bg-brand text-white text-xl font-bold items-center justify-center", cssClass({ display: company.logo ? 'none' : 'flex' }))}>
                    {company.short[0]}
                  </div>
                </div>
              </div>
              <h2 className="font-semibold text-slate-900 text-base leading-tight">
                {company.name}
                <span className="inline-block ml-1 w-3 h-3 rounded-full bg-green-500 align-middle" title="Verified" />
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><MapPin size={11} /> {company.address}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Basic Information</h3>
            <div className="space-y-3 text-sm">
              {company.phone &&
              <div className="flex items-start gap-2">
                  <Phone size={13} className="text-slate-400 mt-0.5 shrink-0" />
                  <div><p className="text-[11px] text-slate-400">Phone</p><p className="text-slate-700 font-medium">{company.phone}</p></div>
                </div>
              }
              <div className="flex items-start gap-2">
                <Mail size={13} className="text-slate-400 mt-0.5 shrink-0" />
                <div><p className="text-[11px] text-slate-400">Email</p>
                  <a href={`mailto:${company.email}`} className="text-brand font-medium hover:underline break-all">{company.email}</a></div>
              </div>
              <div className="flex items-start gap-2">
                <Globe size={13} className="text-slate-400 mt-0.5 shrink-0" />
                <div><p className="text-[11px] text-slate-400">Website</p>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-brand font-medium hover:underline flex items-center gap-1">
                    {company.website.replace('https://', '')} <ExternalLink size={10} /></a></div>
              </div>
              <div className="flex items-start gap-2">
                <Activity size={13} className="text-slate-400 mt-0.5 shrink-0" />
                <div><p className="text-[11px] text-slate-400">Created On</p><p className="text-slate-700 font-medium">{company.createdOn}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Other Information</h3>
            <div className="space-y-2 text-sm">
              {[['Language', company.language], ['Currency', company.currency], ['Last Modified', company.lastModified], ['Source', company.source]].map(([label, value]) =>
              <div key={label} className="flex justify-between items-center">
                  <span className="text-slate-400 text-[12px]">{label}</span>
                  <span className="text-slate-700 text-[12px] font-medium">{value}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5"><Tag size={13} /> Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {company.tags.map((tag) =>
              <span key={tag} className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-brand text-brand bg-brand-50">{tag}</span>
              )}
            </div>
          </div>

          {company.social && Object.keys(company.social).length > 0 &&
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Social Links</h3>
              <div className="flex gap-3">
                {company.social.instagram &&
              <a href={company.social.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:opacity-90"><InstagramIcon /></a>
              }
                {company.social.twitter &&
              <a href={company.social.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white hover:opacity-90"><TwitterIcon /></a>
              }
                {company.social.linkedin &&
              <a href={company.social.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#0a66c2] flex items-center justify-center text-white hover:opacity-90"><LinkedInIcon /></a>
              }
              </div>
            </div>
          }
        </div>

        {}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button type="button" className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 border-brand text-brand bg-brand-50/40">
                <Building2 size={15} /> Overview
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">About {company.short}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{company.about}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Registered Office</p>
                  <p className="text-sm font-medium text-slate-700 flex items-start gap-1">
                    <MapPin size={13} className="mt-0.5 text-brand shrink-0" />{company.address}
                  </p>
                </div>
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Contact</p>
                  {company.phone && <p className="text-sm font-medium text-slate-700 flex items-center gap-1"><Phone size={13} className="text-brand shrink-0" />{company.phone}</p>}
                  <p className="text-sm font-medium text-brand flex items-center gap-1 mt-1"><Mail size={13} className="shrink-0" />{company.email}</p>
                </div>
              </div>

              {company.products.length > 0 &&
              <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Products</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {company.products.map((p) =>
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 hover:border-brand hover:bg-brand-50/30 transition-colors group">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-brand">{p.name}</p>
                          {p.desc && <p className="text-[11px] text-slate-400">{p.desc}</p>}
                        </div>
                        <ExternalLink size={13} className="text-slate-300 group-hover:text-brand" />
                      </a>
                  )}
                  </div>
                </div>
              }

              {company.services.length > 0 &&
              <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {company.services.map((s) =>
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-brand hover:text-brand hover:bg-brand-50 transition-colors">
                        {s.name} <ExternalLink size={11} />
                      </a>
                  )}
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>);

}
