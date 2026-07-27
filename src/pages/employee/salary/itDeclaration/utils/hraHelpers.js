import { MN } from "../constants";

export function getFYMonths() {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const months = [];
  for (let i = 3; i <= 14; i++) {
    months.push(`${MN[i % 12]} ${fyStart + Math.floor(i / 12)}`);
  }
  return months;
}

export function countMonths(from, to) {
  if (!from || !to) return 0;
  const [fm, fy] = from.split(" ");
  const [tm, ty] = to.split(" ");
  const a = new Date(`${fm} 1, ${fy}`);
  const b = new Date(`${tm} 1, ${ty}`);
  const diff = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return diff >= 0 ? diff + 1 : 0;
}

export function blankHouse(fyMonths) {
  return {
    from: fyMonths[0] || "",
    to: fyMonths[fyMonths.length - 1] || "",
    monthlyRent: 0,
    houseName: "",
    street: "",
    city: "",
    pincode: "",
    landlordHasPan: false,
    landlordName: "",
    landlordPan: "",
    landlordRelationship: "",
    landlordHouseName: "",
    landlordStreet: "",
    landlordCity: "",
    landlordPincode: "",
  };
}
