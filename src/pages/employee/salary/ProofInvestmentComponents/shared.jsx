const fmt = n => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const INVEST_TYPES = ["ELSS Mutual Fund", "Life Insurance", "PPF", "NSC", "Public Provident Fund", "Home Loan Principal", "Home Loan Interest", "Tuition Fees", "NPS", "ULIP", "Fixed Deposit (5yr)", "Sukanya Samriddhi", "Medical Insurance", "Other"];
export { fmt, INVEST_TYPES };
