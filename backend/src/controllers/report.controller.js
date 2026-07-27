const reportService = require('../services/report.service');
const dlService = require('../services/reportDownload.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const employeeSummary = asyncHandler(async (req, res) => {
  const data = await reportService.employeeSummary();
  new ApiResponse(200, data, 'Employee report fetched').send(res);
});

const attendanceReport = asyncHandler(async (req, res) => {
  const { from_date, to_date, department_id } = req.query;
  const data = await reportService.attendanceReport({ from_date, to_date, department_id });
  new ApiResponse(200, data, 'Attendance report fetched').send(res);
});

const leaveReport = asyncHandler(async (req, res) => {
  const { year, department_id, status } = req.query;
  const data = await reportService.leaveReport({ year, department_id, status });
  new ApiResponse(200, data, 'Leave report fetched').send(res);
});

const payrollReport = asyncHandler(async (req, res) => {
  const { month, year, department_id } = req.query;
  const data = await reportService.payrollReport({ month, year, department_id });
  new ApiResponse(200, data, 'Payroll report fetched').send(res);
});

const helpdeskReport = asyncHandler(async (req, res) => {
  const { from_date, to_date } = req.query;
  const data = await reportService.helpdeskReport({ from_date, to_date });
  new ApiResponse(200, data, 'Helpdesk report fetched').send(res);
});

const hiringReport = asyncHandler(async (req, res) => {
  const data = await reportService.hiringReport();
  new ApiResponse(200, data, 'Hiring report fetched').send(res);
});

const reviewReport = asyncHandler(async (req, res) => {
  const { review_type_id, status } = req.query;
  const data = await reportService.reviewReport({ review_type_id, status });
  new ApiResponse(200, data, 'Review report fetched').send(res);
});



async function sendWorkbook(res, wb, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

const downloadEmpData = asyncHandler(async (req, res) => {
  const wb = await dlService.generateEmpData();
  const month = new Date().toLocaleString('en-GB', { month: 'short', year: 'numeric' }).replace(' ', '');
  await sendWorkbook(res, wb, `EMP_Data_${month}.xlsx`);
});

const downloadLeaveBalance = asyncHandler(async (req, res) => {
  const wb = await dlService.generateLeaveBalance(req.query.date);
  const tag = (req.query.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  await sendWorkbook(res, wb, `Leave_Balance_${tag}.xlsx`);
});

const downloadLeaveSummary = asyncHandler(async (req, res) => {
  const wb = await dlService.generateLeaveSummary(req.query.from, req.query.to);
  await sendWorkbook(res, wb, `Leave_Summary_Report.xlsx`);
});

const downloadPfStatement = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const wb = await dlService.generatePfStatement(month, year);
  await sendWorkbook(res, wb, `PF_Statement_${year || new Date().getFullYear()}_${String(month || new Date().getMonth() + 1).padStart(2, '0')}.xlsx`);
});

const downloadProfessionTax = asyncHandler(async (req, res) => {
  const { month, year, state } = req.query;
  const wb = await dlService.generateProfessionTax(month, year, state);
  await sendWorkbook(res, wb, `Profession_Tax_${year || new Date().getFullYear()}_${String(month || new Date().getMonth() + 1).padStart(2, '0')}.xlsx`);
});

const downloadEcrFile = asyncHandler(async (req, res) => {
  const { month, year, estb_code } = req.query;
  const content = await dlService.generateEcrFile(month, year, estb_code);
  const m = String(month || new Date().getMonth() + 1).padStart(2, '0');
  const y = year || new Date().getFullYear();
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="ECR_${y}${m}.txt"`);
  res.send(content);
});

module.exports = {
  employeeSummary,
  attendanceReport,
  leaveReport,
  payrollReport,
  helpdeskReport,
  hiringReport,
  reviewReport,
  downloadEmpData,
  downloadLeaveBalance,
  downloadLeaveSummary,
  downloadPfStatement,
  downloadProfessionTax,
  downloadEcrFile
};
