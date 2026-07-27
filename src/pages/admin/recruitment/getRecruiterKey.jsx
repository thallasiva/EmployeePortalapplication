import { RECRUITERS } from "./data";

function getRecruiterKey(user)
{
  const email = user?.email?.toLowerCase();
  return RECRUITERS.find((item) => item.email === email)?.key || "Mike W.";
}
export default getRecruiterKey;
