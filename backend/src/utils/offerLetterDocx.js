'use strict';

const fs   = require('fs');
const path = require('path');
const PizZip        = require('pizzip');
const Docxtemplater = require('docxtemplater');

const TEMPLATE_PATH = path.join(__dirname, '../../templates/offer_letter_template.docx');

/** Indian number-to-words (e.g. 456000 => "Four Lakh Fifty Six Thousand Rupees Only") */
function toWords(num) {
  if (!num) return 'Zero Rupees Only';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function convert(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred ' + convert(n%100);
    if (n < 100000) return convert(Math.floor(n/1000)) + 'Thousand ' + convert(n%1000);
    if (n < 10000000) return convert(Math.floor(n/100000)) + 'Lakh ' + convert(n%100000);
    return convert(Math.floor(n/10000000)) + 'Crore ' + convert(n%10000000);
  }
  return convert(Math.round(num)).trim() + ' Rupees Only';
}

/** Indian currency format e.g. 456000 => "Rs.4,56,000/-" */
function fmtRs(n) {
  if (!n) return 'Rs.0/-';
  const s = Math.round(n).toString();
  if (s.length <= 3) return 'Rs.' + s + '/-';
  const last3   = s.slice(-3);
  const rest    = s.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return 'Rs.' + grouped + ',' + last3 + '/-';
}

/** Monthly display e.g. 19000 => "19,000" */
function fmtM(n) {
  if (!n && n !== 0) return '';
  return Math.round(Number(n)).toLocaleString('en-IN');
}

/** Date display e.g. "2026-08-07" => "07 August 2026" */
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
}

/**
 * Generate a filled offer-letter .docx buffer.
 * All monetary DB values are ANNUAL. CTC breakdown falls back to computed
 * values when stored values are 0 (covers offers created before breakdown columns existed).
 */
function generateOfferLetterDocx(data) {
  const {
    offerCode           = '',
    offerDate           = new Date().toISOString(),
    candidateName       = '',
    designation         = '',
    dateOfJoining       = '',
    ctc                 = 0,
    ctcInWords,
    companyName         = 'NAT IT Services Pvt Ltd',
    companyEmail        = 'hr@natit.in',
    reportTo            = companyName,
    basic               = 0,
    hra                 = 0,
    telephoneAllowance  = 0,
    leaveTravel         = 0,
    specialAllowance    = 0,
    grossSalary         = 0,
    pfContribution      = 0,
    statutoryBonus      = 0,
    gratuity            = 0,
    esi                 = 0,
  } = data;

  // Monthly helpers (DB values are annual)
  const m = (v) => fmtM(Number(v) / 12);
  const a = (v) => fmtM(Number(v));

  // Fallback: compute breakdown from CTC when stored values are 0
  const annualCTC = Number(ctc) || 0;
  const ctcM      = Math.round(annualCTC / 12);
  const basicM    = Math.round(ctcM * 0.5);
  const hraM      = Math.round(basicM * 0.4);
  const telM      = 1500;
  const ltaM      = 3333;
  const pfM       = Math.min(Math.round(basicM * 0.12), 1800);
  const sbM       = basicM <= 21000 ? 1400 : 0;
  const grossM    = ctcM - pfM - sbM;
  const splM      = grossM - (basicM + hraM + telM + ltaM);

  function useStored(stored, computed) {
    return (Number(stored) > 0) ? Number(stored) : computed;
  }

  const eff_basic  = useStored(basic,             basicM * 12);
  const eff_hra    = useStored(hra,               hraM   * 12);
  const eff_tel    = useStored(telephoneAllowance, telM  * 12);
  const eff_lta    = useStored(leaveTravel,        ltaM  * 12);
  const eff_spl    = useStored(specialAllowance,   splM  * 12);
  const eff_gross  = useStored(grossSalary,        grossM * 12);
  const eff_pf     = useStored(pfContribution,     pfM   * 12);
  const eff_sb     = useStored(statutoryBonus,     sbM   * 12);
  const eff_grat   = Number(gratuity) || 0;
  const eff_esi    = Number(esi)      || 0;

  const templateBuf = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks:    true,
    delimiters:    { start: '{{', end: '}}' },
  });

  doc.render({
    OfferCode:     offerCode,
    OfferDate:     fmtDate(offerDate),
    CandidateName: candidateName,
    Designation:   designation,
    DateOfJoining: fmtDate(dateOfJoining),
    CTC_Amount:    fmtRs(annualCTC),
    CTC_Words:     ctcInWords || toWords(annualCTC),
    CompanyName:   companyName,
    CompanyEmail:  companyEmail,
    ReportTo:      reportTo,

    Basic_M:    m(eff_basic),   Basic_A:    a(eff_basic),
    HRA_M:      m(eff_hra),     HRA_A:      a(eff_hra),
    Tel_M:      m(eff_tel),     Tel_A:      a(eff_tel),
    LTA_M:      m(eff_lta),     LTA_A:      a(eff_lta),
    Spl_M:      m(eff_spl),     Spl_A:      a(eff_spl),
    Gross_M:    m(eff_gross),   Gross_A:    a(eff_gross),
    PF_M:       m(eff_pf),      PF_A:       a(eff_pf),
    SB_M:       m(eff_sb),      SB_A:       a(eff_sb),
    Gratuity_M: m(eff_grat),    Gratuity_A: a(eff_grat),
    ESI_M:      m(eff_esi),     ESI_A:      a(eff_esi),
    CTC_M:      m(annualCTC),   CTC_A:      a(annualCTC),
  });

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = { generateOfferLetterDocx };
