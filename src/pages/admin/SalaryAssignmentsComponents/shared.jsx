const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400";
const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white";
function fmt(n) {
  if (!n) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  });
}
export { inp, sel, fmt };
