/**
 * Report Download Service
 * Generates downloadable Excel (.xlsx) and text files matching
 * the exact format of the uploaded HR report templates.
 */
const ExcelJS = require('exceljs');
const { callProcedure } = require('../config/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCompany() {
  const results = await callProcedure('sp_get_company()').catch(() => []);
  return (results[0] ?? [])[0] || { company_name: 'Company Name', address: '' };
}

function fmtDate(val) {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d)) return String(val);
    return d.toISOString().slice(0, 10);
  } catch { return String(val); }
}

function monthName(m) {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m) - 1] || '';
}

function headerStyle(bold = true, bg = 'FFD9E1F2', fontSize = 10) {
  return {
    font: { bold, size: fontSize, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
    border: {
      top:    { style: 'thin' }, bottom: { style: 'thin' },
      left:   { style: 'thin' }, right:  { style: 'thin' },
    },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  };
}

function dataStyle() {
  return {
    font: { size: 10, name: 'Calibri' },
    border: {
      top:    { style: 'thin' }, bottom: { style: 'thin' },
      left:   { style: 'thin' }, right:  { style: 'thin' },
    },
    alignment: { vertical: 'middle' },
  };
}

// ─── 1. EMP DATA ──────────────────────────────────────────────────────────────

async function generateEmpData() {
  const _empResults = await callProcedure('sp_report_emp_data()');
  const employees = _empResults[0] ?? [];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('EMP Data');

  const cols = [
    'S. No', 'Emp. ID', 'Biometric ID', 'Employee Name', 'Date of Joining',
    'Date of Birth', 'Actual D.O.B', 'PAN. No', 'Department', 'Project /Cost Centre',
    'Gender', 'Shift', 'Location', 'Bank Account No', 'Employment Type',
    'Contract End Date', 'Employment Status', 'Date of Confirmation',
    'Previous Designation', 'Current Designation', 'Reporting Manager / Supervisor',
    'Educational Qualification', 'Total Exp. before joining', 'Previous Employer',
    'Marital Status', 'Current Address', 'Permanent Address',
    'Contact-General', 'Contact-Emergency', 'Relation',
    'Official Mail ID', 'Personal E-Mail ID',
    'PF UAN Number', 'PF Number', 'ESI Number', 'Blood Group',
    'AADHAR Number', 'Name as per AADHAR', 'Fathers Name', 'Spouse Name', 'BGV Status',
    'Initial Salary',
    'Revision 1', 'Revision date', 'Revision 2', 'Revision date',
    'Revision 3', 'Revision 4', 'Revision 5', 'Revision 6',
    'Revision 7', 'Revision 8', 'Revision 9', 'Revision 10',
  ];

  // Row 1 blank, Row 2 headers
  ws.addRow([]);
  const hRow = ws.addRow(cols);
  hRow.eachCell((cell) => { Object.assign(cell, headerStyle()); });
  ws.getRow(2).height = 30;

  employees.forEach((e, i) => {
    ws.addRow([
      i + 1,
      e.emp_code || '',
      e.biometric_id || '',
      [e.first_name, e.last_name].filter(Boolean).join(' '),
      fmtDate(e.emp_joining_date),
      fmtDate(e.dob),
      fmtDate(e.actual_dob),
      e.pan_number || e.bank_pan || '',
      e.department_name || '',
      e.project_cost_centre || '',
      e.gender || '',
      e.shift || '',
      e.location || '',
      e.account_number || '',
      e.employee_type || '',
      fmtDate(e.contract_end_date),
      e.employee_status || '',
      fmtDate(e.date_of_confirmation),
      e.previous_designation || '',
      e.emp_job_title || e.designation_name || '',
      e.reporting_manager_name ? e.reporting_manager_name.trim() : '',
      e.educational_qualification || '',
      e.total_exp_before_joining || '',
      e.previous_employer || '',
      e.marital_status || '',
      e.current_address || '',
      e.permanent_address || '',
      e.mobile || '',
      e.emergency_contact_phone || '',
      e.emergency_contact_relation || '',
      e.email || '',
      e.personal_email || '',
      e.uan_number || '',
      e.pf_number || '',
      e.esi_number || '',
      e.blood_group || '',
      e.aadhaar_number || '',
      e.aadhaar_name || '',
      e.father_name || '',
      e.spouse_name || '',
      e.bgv_status || '',
      e.ctc || '',
      '', '', '', '', '', '', '', '', '', '', '', '',
    ]);
  });

  // Column widths
  const widths = [5,10,12,20,14,12,12,14,16,18,8,8,12,18,14,14,14,16,18,18,22,22,10,20,12,30,30,14,14,12,24,24,14,14,12,10,16,20,16,14,12,12,10,12,10,12,10,10,10,10,10,10,10,10];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  return wb;
}

// ─── 2. LEAVE BALANCE AS ON A DAY ────────────────────────────────────────────

async function generateLeaveBalance(asOnDate) {
  const co = await getCompany();
  const date = asOnDate ? new Date(asOnDate) : new Date();
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');

  const _lbResults = await callProcedure('sp_report_leave_balance()');
  const rows = _lbResults[0] ?? [];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Leave Balance');

  const titleStyle = { font: { bold: true, size: 11, name: 'Calibri' } };

  ws.addRow([co.company_name || 'Company']).getCell(1).style = titleStyle;
  ws.addRow([co.address || '']).getCell(1).style = { font: { size: 10, name: 'Calibri' } };
  ws.addRow([`Leave Balance As On ${dateStr}`]).getCell(1).style = titleStyle;
  ws.addRow([]);

  const headers = ['SL No', 'Employee No', 'Name', 'Manager No', 'Manager Name', 'Department',
    'Compensatory Off', 'Earned Leave', 'Paternity Leave', 'Restricted Holiday', 'Sick Leave'];
  const hRow = ws.addRow(headers);
  hRow.eachCell((cell) => { Object.assign(cell, headerStyle(true, 'FF4472C4')); cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } }; });
  ws.getRow(5).height = 22;

  rows.forEach((r, i) => {
    const dRow = ws.addRow([
      i + 1, r.emp_code, r.emp_name?.trim(), r.mgr_code || '',
      r.mgr_name?.trim() || '', r.department_name || '',
      Number(r.comp_off) || 0, Number(r.earned_leave) || 0,
      Number(r.paternity) || 0, Number(r.restricted_holiday) || 0,
      Number(r.sick_leave) || 0,
    ]);
    dRow.eachCell((cell) => { Object.assign(cell, dataStyle()); });
  });

  ws.mergeCells('A1:K1'); ws.mergeCells('A2:K2'); ws.mergeCells('A3:K3');
  [6,7,8,9,10,11].forEach((c) => { ws.getColumn(c).width = 18; });
  ws.getColumn(1).width = 6; ws.getColumn(2).width = 12; ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 12; ws.getColumn(5).width = 22; ws.getColumn(6).width = 18;

  return wb;
}

// ─── 3. LEAVE SUMMARY REPORT ─────────────────────────────────────────────────

async function generateLeaveSummary(fromDate, toDate) {
  const co = await getCompany();
  const from = fromDate || `${new Date().getFullYear()}-01-01`;
  const to   = toDate   || `${new Date().getFullYear()}-12-31`;

  const fromLabel = new Date(from).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  const toLabel   = new Date(to).toLocaleDateString('en-GB',   { day:'2-digit', month:'short', year:'numeric' });

  const _lsResults = await callProcedure('sp_report_leave_summary_data(?, ?)', [from, to]);
  const empRows   = _lsResults[0] ?? [];
  const leaveTypes = _lsResults[1] ?? [];
  const availed   = _lsResults[2] ?? [];
  const balances  = _lsResults[3] ?? [];

  const availedMap = {};
  availed.forEach((r) => {
    const k = `${r.employee_id}_${r.leave_type_id}`;
    availedMap[k] = Number(r.days_availed) || 0;
  });

  const balMap = {};
  balances.forEach((r) => {
    const k = `${r.employee_id}_${r.leave_type_id}`;
    balMap[k] = Number(r.balance_days) || 0;
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Leave Summary');

  ws.addRow([co.company_name || 'Company']).getCell(1).style = { font: { bold: true, size: 11 } };
  ws.addRow([co.address || '']).getCell(1).style = { font: { size: 10 } };
  ws.addRow([`Leave Summary Report from ${fromLabel} to ${toLabel}`]).getCell(1).style = { font: { bold: true, size: 10 } };
  ws.addRow([]);

  // Header row 1
  const fixedCols = ['Employee No', 'Name of the Employee', 'Status', 'Confirmation Date', 'Department', 'Designation', 'DOJ'];
  const ltNames   = leaveTypes.map((lt) => lt.short_code || lt.leave_type_name);
  const h1 = ws.addRow([...fixedCols, 'Opening Balance', ...Array(ltNames.length - 1).fill(''), 'Leave Availed', ...Array(ltNames.length - 1).fill(''), 'Closing Balance']);
  h1.eachCell((c) => { Object.assign(c, headerStyle(true, 'FF4472C4')); c.font = { ...c.font, color: { argb: 'FFFFFFFF' } }; });

  // Header row 2 - leave type names
  const h2 = ws.addRow([...Array(fixedCols.length).fill(''), ...ltNames, ...ltNames, '']);
  h2.eachCell((c) => { Object.assign(c, headerStyle(true, 'FFD9E1F2')); });

  // Data rows
  empRows.forEach((e) => {
    const opening  = leaveTypes.map((lt) => balMap[`${e.emp_code}_${lt.leave_type_id}`] || 0);
    const availedV = leaveTypes.map((lt) => availedMap[`${e.emp_code}_${lt.leave_type_id}`] || 0);
    const closing  = leaveTypes.map((lt, i) => Math.max(0, (opening[i] || 0) - (availedV[i] || 0)));

    const dRow = ws.addRow([
      e.emp_code, e.emp_name?.trim(), e.employee_status,
      fmtDate(e.date_of_confirmation), e.department_name || '', e.designation_name || '',
      fmtDate(e.emp_joining_date),
      ...opening, ...availedV,
      closing.reduce((a, b) => a + b, 0),
    ]);
    dRow.eachCell((c) => { Object.assign(c, dataStyle()); });
  });

  ws.getColumn(1).width = 12; ws.getColumn(2).width = 22; ws.getColumn(3).width = 10;
  ws.getColumn(4).width = 16; ws.getColumn(5).width = 18; ws.getColumn(6).width = 18;
  ws.getColumn(7).width = 12;
  for (let i = 8; i <= 8 + leaveTypes.length * 2; i++) ws.getColumn(i).width = 10;

  return wb;
}

// ─── 4. PF MONTHLY STATEMENT ─────────────────────────────────────────────────

async function generatePfStatement(month, year) {
  const co = await getCompany();
  const m  = Number(month) || new Date().getMonth() + 1;
  const y  = Number(year)  || new Date().getFullYear();
  const mLabel = `${monthName(m)} ${y}`;

  const _pfResults = await callProcedure('sp_report_pf_statement(?, ?)', [m, y]);
  const rows = _pfResults[0] ?? [];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('PF Statement');

  const ts = { font: { bold: true, size: 11 } };
  ws.addRow([co.company_name]).getCell(1).style = ts;
  ws.addRow([co.address || '']).getCell(1).style = { font: { size: 10 } };
  ws.addRow([`Provident Fund Statement For The Month ${mLabel}`]).getCell(1).style = ts;
  ws.addRow([]);

  // Complex 3-row merged header
  // Row 5: main labels
  const h1 = ws.addRow([
    'Sl No', 'Employee No', 'Name', 'Date of Joining', 'Date of Leaving',
    'PF No', 'UAN No', 'Gross Wages',
    "Employees' Contribution", '', '', '', '',
    "Employers' Contribution", '', '', '', '',
    'PF Basic', 'EPS Basic', 'EDLI Basic', 'PF Admin Acc 2', 'EDLI Contribution 21', 'EDLI Admin Charges 22',
  ]);
  h1.eachCell((c) => { Object.assign(c, headerStyle(true, 'FF4472C4')); c.font = { ...c.font, color: { argb: 'FFFFFFFF' } }; });

  // Row 6: sub-labels
  const h2 = ws.addRow(['', '', '', '', '', '', '', '', 'Basic + DA', '', 'PF', '', 'VPF', 'PF', '', 'EPS', '', 'Total', '', '', '', '', '', '']);
  h2.eachCell((c) => { Object.assign(c, headerStyle(true, 'FFD9E1F2')); });

  // Row 7: Regular/Arrear
  const h3 = ws.addRow(['', '', '', '', '', '', '', '', 'Regular', 'Arrear', 'Regular', 'Arrear', '', 'Regular', 'Arrear', 'Regular', 'Arrear', '', '', '', '', '', '', '']);
  h3.eachCell((c) => { Object.assign(c, headerStyle(true, 'FFE2EFDA')); });

  // Merge header cells
  ws.mergeCells('A5:A7'); ws.mergeCells('B5:B7'); ws.mergeCells('C5:C7');
  ws.mergeCells('D5:D7'); ws.mergeCells('E5:E7'); ws.mergeCells('F5:F7');
  ws.mergeCells('G5:G7'); ws.mergeCells('H5:H7');
  ws.mergeCells('I5:M5');  // Employee contrib span
  ws.mergeCells('N5:R5');  // Employer contrib span
  ws.mergeCells('S5:S7'); ws.mergeCells('T5:T7'); ws.mergeCells('U5:U7');
  ws.mergeCells('V5:V7'); ws.mergeCells('W5:W7'); ws.mergeCells('X5:X7');
  ws.mergeCells('I6:J6'); ws.mergeCells('K6:L6'); ws.mergeCells('M6:M7');
  ws.mergeCells('N6:O6'); ws.mergeCells('P6:Q6'); ws.mergeCells('R6:R7');

  let sl = 1;
  let totals = { gross: 0, basicEmpReg: 0, pfReg: 0, pfEmpReg: 0, epsReg: 0, total: 0, pfBasic: 0, epsBasic: 0 };

  rows.forEach((r) => {
    const gross   = Number(r.gross_earnings) || 0;
    const basic   = Number(r.basic) || 0;
    const pfBasic = Math.min(basic, 15000);
    const empPF   = Math.round(pfBasic * 0.12);
    const empEPS  = Math.round(Math.min(pfBasic, 15000) * 0.0833);
    const emplPF  = empPF - empEPS;
    const totalC  = empPF + emplPF + empEPS;

    totals.gross += gross; totals.basicEmpReg += basic;
    totals.pfReg += empPF; totals.pfEmpReg += emplPF;
    totals.epsReg += empEPS; totals.total += totalC;
    totals.pfBasic += pfBasic; totals.epsBasic += pfBasic;

    const dRow = ws.addRow([
      sl++,
      r.emp_code || '',
      r.emp_name?.trim() || '',
      fmtDate(r.emp_joining_date),
      fmtDate(r.emp_exit_date),
      r.pf_number || '',
      r.uan_number || '',
      gross,
      basic, 0, empPF, 0, 0,
      emplPF, 0, empEPS, 0, totalC,
      pfBasic, pfBasic, pfBasic, 0, 0, 0,
    ]);
    dRow.eachCell((c, ci) => {
      Object.assign(c, dataStyle());
      if (ci > 7) c.numFmt = '#,##0';
    });
  });

  // Totals row
  const tRow = ws.addRow(['', '', 'TOTAL', '', '', '', '', totals.gross,
    totals.basicEmpReg, 0, totals.pfReg, 0, 0,
    totals.pfEmpReg, 0, totals.epsReg, 0, totals.total,
    totals.pfBasic, totals.epsBasic, totals.epsBasic, 0, 0, 0]);
  tRow.eachCell((c, ci) => {
    Object.assign(c, headerStyle(true, 'FFFFF2CC'));
    if (ci > 7) c.numFmt = '#,##0';
  });

  ws.getColumn(1).width = 6;  ws.getColumn(2).width = 12; ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 13; ws.getColumn(5).width = 13; ws.getColumn(6).width = 14;
  ws.getColumn(7).width = 14; ws.getColumn(8).width = 12;
  for (let i = 9; i <= 24; i++) ws.getColumn(i).width = 10;

  return wb;
}

// ─── 5. PROFESSION TAX STATEMENT ─────────────────────────────────────────────

async function generateProfessionTax(month, year, state) {
  const co = await getCompany();
  const m  = Number(month) || new Date().getMonth() + 1;
  const y  = Number(year)  || new Date().getFullYear();
  const st = state || 'Telangana';
  const mLabel = `${monthName(m)} ${y}`;

  // PT slabs for Telangana
  const PT_SLABS = [
    { min: 0,     max: 15000, rate: 0   },
    { min: 15001, max: 20000, rate: 150 },
    { min: 20001, max: Infinity, rate: 200 },
  ];

  function getPT(gross) {
    const slab = PT_SLABS.find((s) => gross >= s.min && gross <= s.max);
    return slab ? slab.rate : 200;
  }

  const _ptResults = await callProcedure('sp_report_payslips_for_month(?, ?)', [m, y]);
  const rows = _ptResults[0] ?? [];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Profession Tax');

  const ts = { font: { bold: true, size: 11 } };
  ws.addRow([co.company_name]).getCell(1).style = ts;
  ws.addRow([`STATEMENT OF PROFESSION TAX FOR ${mLabel} (${st})`]).getCell(1).style = ts;
  ws.addRow([]);

  const hRow = ws.addRow(['Sr. No.', 'Employee No', 'Name', 'Prof Tax Basic', 'Amount']);
  hRow.eachCell((c) => { Object.assign(c, headerStyle(true, 'FF4472C4')); c.font = { ...c.font, color: { argb: 'FFFFFFFF' } }; });

  let sl = 1;
  const slabCounts = {};
  let grandTotal = 0;

  rows.forEach((r) => {
    const gross = Number(r.gross_earnings) || Number(r.basic) || 0;
    const pt    = getPT(gross);
    grandTotal += pt;
    slabCounts[pt] = (slabCounts[pt] || 0) + 1;

    const dRow = ws.addRow([sl++, r.emp_code, r.emp_name?.trim(), gross, pt]);
    dRow.eachCell((c) => { Object.assign(c, dataStyle()); });
  });

  // Blank rows before summary
  ws.addRow([]); ws.addRow([]);

  // Summary section
  const sumTitle = ws.addRow(['Summary', '', '', '', '']);
  sumTitle.getCell(1).style = { font: { bold: true, size: 11 } };

  const sumH = ws.addRow(['', '', 'Rate', 'No of employees', 'Amount']);
  sumH.eachCell((c) => { Object.assign(c, headerStyle()); });

  // Exempted
  ws.addRow(['', '', '', slabCounts[0] || 0, 'Exempted']).eachCell((c) => { Object.assign(c, dataStyle()); });

  // PT slabs with actual counts
  PT_SLABS.filter((s) => s.rate > 0).forEach((s) => {
    const cnt = slabCounts[s.rate] || 0;
    ws.addRow(['', '', s.rate, cnt, cnt * s.rate]).eachCell((c) => { Object.assign(c, dataStyle()); });
  });

  const totRow = ws.addRow(['', '', 'Total', rows.length, grandTotal]);
  totRow.eachCell((c) => { Object.assign(c, headerStyle(true, 'FFFFF2CC')); });

  ws.addRow([]);
  ws.addRow(['', 'PREPARED BY', '', '', 'CHECKED BY']);

  ws.getColumn(1).width = 8;  ws.getColumn(2).width = 14; ws.getColumn(3).width = 24;
  ws.getColumn(4).width = 16; ws.getColumn(5).width = 12;

  return wb;
}

// ─── 6. ECR FILE (TXT) ───────────────────────────────────────────────────────

async function generateEcrFile(month, year, estbCode) {
  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year)  || new Date().getFullYear();
  const code = estbCode || 'ESTBCODE';

  const _ecrResults = await callProcedure('sp_report_payslips_for_month(?, ?)', [m, y]);
  const rows = _ecrResults[0] ?? [];

  const lines = rows.map((r) => {
    const gross   = Math.round(Number(r.gross_earnings) || 0);
    const basic   = Math.round(Number(r.basic) || 0);
    const epsWages = Math.min(basic, 15000);
    const pf      = Math.round(Math.min(basic, 15000) * 0.12);
    const eps     = Math.round(Math.min(epsWages, 15000) * 0.0833);
    const epf     = pf - eps;
    const name    = (r.emp_name || '').trim().toUpperCase();

    return `${code}#~#${name}#~#${gross}#~#${basic}#~#${epsWages}#~#15000#~#${pf}#~#${eps}#~#${epf}#~#0#~#0`;
  });

  return lines.join('\n');
}

module.exports = {
  generateEmpData,
  generateLeaveBalance,
  generateLeaveSummary,
  generatePfStatement,
  generateProfessionTax,
  generateEcrFile,
};
