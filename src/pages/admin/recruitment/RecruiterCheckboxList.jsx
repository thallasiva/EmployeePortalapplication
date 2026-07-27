import { RECRUITERS } from "./data";

function RecruiterCheckboxList()
{
  return (
    <div className="flex flex-wrap gap-2">
      {RECRUITERS.map((recruiter) => (
        <label key={recruiter.key} className="inline-flex cursor-pointer items-center gap-1.5 rounded border-[0.5px] border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700">
          <input type="checkbox" defaultChecked={recruiter.key === "Mike W."} />
          {recruiter.name}
        </label>
      ))}
    </div>
  );
}

export default RecruiterCheckboxList;
