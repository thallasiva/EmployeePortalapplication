import React from "react";
import { INPUT_CLS } from "../constants";

const CompanyProfile = React.memo(function CompanyProfile({ selectedCompany, profile, setProfile }) {
  return (
    <section className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-slate-900">Company Profile</h2>
      <p className="mt-1 text-sm text-gray-500">
        Settings for <strong>{selectedCompany.name}</strong>
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Company name</span>
          <input value={profile.name} onChange={(e) => setProfile('name', e.target.value)} className={INPUT_CLS} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Industry</span>
          <select value={profile.industry} onChange={(e) => setProfile('industry', e.target.value)} className={INPUT_CLS}>
            <option>Technology</option>
            <option>Financial Services</option>
            <option>Healthcare</option>
            <option>Education</option>
            <option>Life Sciences</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Company size</span>
          <select value={profile.size} onChange={(e) => setProfile('size', e.target.value)} className={INPUT_CLS}>
            <option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Timezone</span>
          <select value={profile.timezone} onChange={(e) => setProfile('timezone', e.target.value)} className={INPUT_CLS}>
            <option>America/Los_Angeles</option>
            <option>America/New_York</option>
            <option>Europe/London</option>
            <option>Asia/Kolkata</option>
          </select>
        </label>
        <label className="md:col-span-2 space-y-2">
          <span className="text-sm font-medium text-slate-700">Address</span>
          <input value={profile.address} onChange={(e) => setProfile('address', e.target.value)} className={INPUT_CLS} />
        </label>
      </div>
    </section>
  );
});

export default CompanyProfile;
