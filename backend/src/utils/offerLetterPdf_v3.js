'use strict';

/**
 * Offer Letter PDF Generator - NAT IT Services Pvt Ltd
 * Matches the Word document exactly:
 *   - Header: company logo (banner image from header)
 *   - Footer: company name + full address on every page
 *   - Page 1: 15 clauses + acceptance + report-to
 *   - Page 2: ANNEXURE I (documents table)
 *   - Page 3: COMPENSATION para + ANNEXURE II CTC table
 */

const PDFDocument = require('pdfkit');
const path        = require('path');
const fs          = require('fs');
const { email: emailCfg } = require('../config/env');

/* ------------------------------------------------------------------ */
/*  Formatters                                                          */
/* ------------------------------------------------------------------ */
function fmtINR(n) {
  const num = Number(n) || 0;
  if (!num) return '-';
  return 'Rs.' + num.toLocaleString('en-IN');
}
function fmtDate(d) {
  if (!d) return '__________';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}
function fmtDateSlash(d) {
  const dt = d ? new Date(d) : new Date();
  if (isNaN(dt)) return '00/00/0000';
  return String(dt.getDate()).padStart(2,'0') + '/' +
         String(dt.getMonth()+1).padStart(2,'0') + '/' + dt.getFullYear();
}

/* ------------------------------------------------------------------ */
/*  Company config (from .env)                                         */
/* ------------------------------------------------------------------ */
function co() {
  return {
    name:     emailCfg.companyName     || 'NAT IT Services Pvt Ltd',
    address:  emailCfg.companyAddress  || 'Gachibowli, Hyderabad - 500032',
    phone:    emailCfg.companyPhone    || '',
    cin:      emailCfg.companyCIN      || '',
    email:    emailCfg.companyEmail    || 'hr@natit.in',
    reportTo: emailCfg.companyReportTo || '',
    logoPath: emailCfg.logoPath        || '',
  };
}

function resolveLogoPath(logoPath) {
  if (!logoPath) return null;
  const abs = path.isAbsolute(logoPath)
    ? logoPath
    : path.resolve(process.cwd(), logoPath);
  return fs.existsSync(abs) ? abs : null;
}

/* ================================================================== */
/*  MAIN EXPORT                                                        */
/* ================================================================== */
function generateOfferLetterPdf(opts) {
  const {
    candidateName      = 'Candidate',
    jobTitle           = '',
    offerCode          = '',
    dateOfJoining      = null,
    ctc                = 0,
    ctcInWords         = '',
    basic              = 0,
    hra                = 0,
    telephoneAllowance = 0,
    leaveTravel        = 0,
    specialAllowance   = 0,
    grossSalary        = 0,
    pfContribution     = 0,
    statutoryBonus     = 0,
    gratuity           = 0,
    esi                = 0,
  } = opts;

  const C        = co();
  const logoFile = resolveLogoPath(C.logoPath);
  const ctcNum   = Number(ctc) || 0;
  const mo       = (v) => Math.round((Number(v) || 0) / 12);

  /* ---- page geometry ---- */
  const MARGIN   = 50;
  const PW       = 595.28;
  const PH       = 841.89;
  const BW       = PW - MARGIN * 2;   /* 495.28 */

  /* Logo / header occupies top 75pt, footer occupies bottom 40pt */
  const LOGO_H   = 75;
  const FTR_H    = 40;
  const CONTENT_TOP    = MARGIN + LOGO_H + 8;
  const CONTENT_BOTTOM = PH - MARGIN - FTR_H - 8;

  /* colours */
  const COL_NAVY = '#1a3c6e';
  const COL_DARK = '#1a1a1a';
  const COL_MID  = '#333333';
  const COL_GREY = '#666666';
  const COL_GOLD = '#c8a130';
  const COL_WHITE= '#ffffff';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: 'A4', autoFirstPage: false,
      info: { Title: 'Offer Letter', Author: C.name } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    /* ============================================================
       HELPERS
    ============================================================ */

    function ensureSpace(needed) {
      if (doc.y + needed > CONTENT_BOTTOM) { newPage(); }
    }

    /** Draw logo banner + gold rule in header zone. */
    function drawHeader() {
      const hx = MARGIN;
      const hy = MARGIN;

      if (logoFile) {
        try {
          /* full-width banner style - fit in 495 x 65 */
          doc.image(logoFile, hx, hy, { width: BW, height: LOGO_H - 10, fit: [BW, LOGO_H - 10] });
        } catch (e) {
          /* fallback to text header */
          _textHeader(hx, hy);
        }
      } else {
        _textHeader(hx, hy);
      }

      /* gold rule below logo */
      const ruleY = MARGIN + LOGO_H;
      doc.moveTo(hx, ruleY).lineTo(hx + BW, ruleY).strokeColor(COL_GOLD).lineWidth(2).stroke();
    }

    function _textHeader(hx, hy) {
      doc.font('Helvetica-Bold').fontSize(16).fillColor(COL_NAVY)
         .text(C.name, hx, hy + 10, { width: BW, align: 'center' });
      doc.font('Helvetica').fontSize(8).fillColor(COL_GREY)
         .text(C.address + (C.phone ? '  Ph: ' + C.phone : ''),
               hx, hy + 30, { width: BW, align: 'center' });
    }

    /** Draw two-line footer. */
    function drawFooter() {
      const fy = PH - MARGIN - FTR_H + 6;
      doc.moveTo(MARGIN, fy - 4).lineTo(MARGIN + BW, fy - 4)
         .strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COL_NAVY)
         .text(C.name, MARGIN, fy, { width: BW, align: 'center' });
      const footerLine2 = C.address + (C.phone ? '  PH:' + C.phone : '') +
                          (C.cin ? '  CIN: ' + C.cin : '');
      doc.font('Helvetica').fontSize(7).fillColor(COL_GREY)
         .text(footerLine2, MARGIN, fy + 12, { width: BW, align: 'center' });
    }

    /** Add a new page, draw header+footer, reset y to CONTENT_TOP. */
    function newPage() {
      doc.addPage({ margin: MARGIN, size: 'A4' });
      drawHeader();
      drawFooter();
      doc.y = CONTENT_TOP;
    }

    /* ---- text helpers ---- */
    function text(str, opts2) {
      doc.font('Helvetica').fontSize(10).fillColor(COL_MID)
         .text(str, MARGIN, doc.y, { width: BW, lineGap: 2, ...opts2 });
    }
    function boldText(str, opts2) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COL_DARK)
         .text(str, MARGIN, doc.y, { width: BW, lineGap: 2, ...opts2 });
    }
    function heading(str) {
      ensureSpace(40);
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(COL_NAVY)
         .text(str, MARGIN, doc.y, { width: BW });
      doc.moveDown(0.2);
    }
    function clauseTitle(str) {
      ensureSpace(45);
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COL_DARK)
         .text(str, MARGIN, doc.y, { width: BW });
    }
    function clauseBody(str) {
      doc.font('Helvetica').fontSize(10).fillColor(COL_MID)
         .text(str, MARGIN, doc.y, { width: BW, lineGap: 2 });
    }
    function subHeading(str) {
      ensureSpace(30);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COL_DARK)
         .text(str, MARGIN + 20, doc.y, { width: BW - 20 });
    }
    function subBody(str) {
      ensureSpace(25);
      doc.font('Helvetica').fontSize(10).fillColor(COL_MID)
         .text(str, MARGIN + 20, doc.y, { width: BW - 20, lineGap: 2 });
    }
    function noteBody(str) {
      ensureSpace(25);
      doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(COL_GREY)
         .text(str, MARGIN + 20, doc.y, { width: BW - 20, lineGap: 2 });
    }
    function hr() {
      ensureSpace(12);
      doc.moveDown(0.3);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + BW, doc.y)
         .strokeColor('#dddddd').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
    }

    /* ============================================================
       PAGE 1 — OFFER LETTER
    ============================================================ */
    newPage();

    /* --- Ref + Date --- */
    const refCode = offerCode || (C.name.replace(/\s+/g,'').slice(0,3).toUpperCase() + '/HR/' + new Date().getFullYear() + '/001');
    const issueDate = fmtDateSlash(new Date());
    doc.font('Helvetica').fontSize(10).fillColor(COL_DARK)
       .text(refCode, MARGIN, doc.y, { continued: true, width: BW })
       .text('Dt: ' + issueDate, { align: 'right' });
    doc.moveDown(1);

    /* --- Candidate name --- */
    boldText(candidateName);
    doc.moveDown(0.8);

    /* --- "Offer Letter" title --- */
    doc.font('Helvetica-Bold').fontSize(14).fillColor(COL_DARK)
       .text('Offer Letter', MARGIN, doc.y, { width: BW });
    doc.moveDown(0.8);

    /* --- Salutation + opening para --- */
    text('Dear ' + candidateName + ',');
    doc.moveDown(0.3);
    text(
      'Thank you for your interest and time you have spent with us during the interview. ' +
      'Subsequent to the discussions you had with us, we are pleased to offer you the position ' +
      '“' + jobTitle + '” in our company with the following terms and conditions.'
    );
    doc.moveDown(0.5);

    /* =========================================================
       CLAUSES 01 - 15
    ========================================================= */

    /* 01 */
    clauseTitle('01. DATE OF JOINING:');
    clauseBody(
      'As agreed during the discussion, you are requested to join the services on or before ' +
      fmtDate(dateOfJoining) + '.'
    );

    /* 02 */
    clauseTitle('02. DESIGNATION:');
    clauseBody(
      'You will be designated as “' + jobTitle + '” and reporting’s to the authority ' +
      'notified by the Management from time to time.'
    );

    /* 03 */
    clauseTitle('03. PLACE OF POSTING:');
    clauseBody(
      'Your place of posting is as discussed during the interview. However, the Management may place you on any ' +
      'assignment in any unit/department/ associate concern of the Company in or out of the said place, as it ' +
      'may be necessary, in its absolute discretion from time to time, subject to the provision that your ' +
      'remuneration and facilities are not adversely affected.'
    );

    /* 04 */
    clauseTitle('04. PROBATION:');
    clauseBody(
      'You will be on probation for three months from the date of joining.  Your probationary period will be ' +
      'assumed to have been extended until such time you are informed in writing.'
    );

    /* 05 */
    clauseTitle('05.  COMPENSATION & BENEFITS:');
    clauseBody(
      'Please refer to Annexure II for the details as applicable to you. Your job title and compensation have ' +
      'been discussed with you and we have mutually agreed upon the same.'
    );

    /* 06 */
    clauseTitle('06.  DOUBLE EMPLOYMENT / OFFICE OF THE PROFIT:');
    clauseBody(
      'Company’s employees are whole time employees and they should not carry out any other job / employment ' +
      'or hold any other honorary office during the tenure of such employment. In the event, the Company finds ' +
      'that You have engaged in Double Employment, the Company shall be entitled to forthwith terminate Your ' +
      'Employment with immediate effect as per Clause 10. Further, You shall be liable to pay to the Company, ' +
      'the salary received by You from the Company, for the period for which You have engaged in the said ' +
      'Double Employment.'
    );

    /* 07 */
    clauseTitle('07.  SERVICE RULES');
    clauseBody(
      'You will be governed by the service rules and regulations including conduct, discipline and any such ' +
      'other rules or orders of the Company that may come in force from time to time.'
    );

    /* 08 */
    clauseTitle('08.   CONFIDENTIALITY');
    clauseBody(
      'The contents of the Agreement and any information passed on by the Company to You (“Confidential ' +
      'Information”) is highly confidential in nature and You agree and undertake to maintain the ' +
      'confidentiality of the information. All program(s), designs, modules, projects, manuals, literature ' +
      'or any new project(s) dealt / developed by You, during Your appointment shall be deemed to be the ' +
      'sole property of the Company and also be regarded as Confidential Information.'
    );
    clauseBody(
      'You shall ensure that the Confidential Information is not disclosed directly or indirectly to any ' +
      'person/ company/ firm and shall not use the Confidential Information for any purpose other than ' +
      'this Agreement.'
    );
    clauseBody(
      'You agree that the unauthorized disclosure or use of such information would cause irreparable harm ' +
      'and significant injury to the Company, the degree of which may be difficult to ascertain. Accordingly, ' +
      'you agree that the Company shall have the right to obtain an immediate injunction from any court of ' +
      'law ensuing breach of this Agreement and/or disclosure of the Confidential Information. The Company ' +
      'shall also have the right to pursue any other rights or remedies available at law or equity for such a breach.'
    );
    clauseBody('The provisions of this Clause shall survive the termination of your Appointment.');

    /* 09 */
    clauseTitle('09. MEDICAL FITNESS:');
    clauseBody(
      'You are required to submit a Medical Fitness Certificate certified by a Medical Practitioner at ' +
      'the time of joining.'
    );

    /* 10 */
    clauseTitle('10. TERMINATION:');
    subHeading('During Probation Period:');
    subBody('Your services can be terminated by giving 30 days’ notice or payment of 30-days gross salary.');
    subBody(
      'In case you decide to leave the company, you are required to give the company a notice period of ' +
      '30-days (or) payment of an amount equivalent to 30-day’s gross monthly salary.'
    );
    subBody(
      'In the event, the Company is not satisfied with your performance, the Company shall be entitled to ' +
      'terminate your services immediately without any notice.'
    );
    subHeading('On confirmation:');
    subBody(
      'Your services can be terminated by the Company by giving three month’s notice or payment of ' +
      'three month’s gross salary in lieu thereof. You shall be entitled to leave the Company by giving ' +
      'the Company prior notice of three months (or) upon payment of an amount equivalent to three months’ ' +
      'gross monthly salary. However, on your resignation, the Company in its sole discretion will have an ' +
      'option to accept the same and relieve you prior to the completion of the notice period of three months ' +
      'without any pay in lieu of notice period.'
    );
    noteBody(
      'Note: Your services are terminated by the company with immediate effect in case of disciplinary, ' +
      'non-performance and ethical matters in probation period and on confirmation of employment.'
    );

    /* 11 */
    clauseTitle('11. RETIREMENT FROM SERVICES:');
    clauseBody(
      'You will automatically retire from the services of the company on attaining the superannuating age of 58 years.'
    );

    /* 12 */
    clauseTitle('12. INDEMNITY:');
    clauseBody(
      'You agree to indemnify and keep safe the Company from and against claims, demands, actions, liabilities, ' +
      'costs, interest, damages and expenses of any nature whatsoever (including all legal and other costs, ' +
      'charges and expenses) incurred or suffered by the Company, arising out of any (a) Your wrongful or ' +
      'negligent act or omission of the Consultant; (b) any breach of Your obligations under this Agreement; ' +
      'and, (c) breach of any applicable laws/ terms or this Agreement by You, by reason of any actions ' +
      'undertaken by You arising out of his obligations under this Agreement.'
    );

    /* 13 */
    clauseTitle('13. ABANDONMENT:');
    clauseBody(
      'Any unauthorized absence from work for a continuous period of 5 working days (including absence upon ' +
      'leave applied for but not granted), shall automatically terminate your employment without any notice ' +
      'obligation on the company.'
    );

    /* 14 */
    clauseTitle('14. VARIABLE PAY:');
    clauseBody(
      'Employee should be active and not serving notice period at the time of disbursement of Variable Pay. ' +
      'Variable Pay will be disbursed on completion of one-year service with the Company. Variable Pay will ' +
      'be paid based on Individual and Company performance.'
    );

    /* 15 */
    clauseTitle('15. GENERAL');
    clauseBody(
      'The company will deduct all applicable Taxes and you will be responsible for your Tax liabilities ' +
      'under all applicable Tax Laws and Regulations.'
    );
    clauseBody(
      'In case particulars mentioned in your application are found be false, your services would be liable ' +
      'for termination at any time without assigning any reason or notice or compensation in lieu thereof.'
    );
    clauseBody(
      'During the course of your employment, in the event of being found guilty of misconduct, commit any ' +
      'breach of the terms of your employment or any other act of omission, you are liable for termination ' +
      'of your services without any notice or compensation.'
    );
    clauseBody(
      'You will be required to effectively carry out all duties and responsibilities assigned to you by your ' +
      'manager and others authorized by the Company to assign such duties and responsibilities. Your ' +
      'performance will be subject to periodic appraisal by your manager.'
    );
    clauseBody(
      'You acknowledge and agree that it would be impossible or extremely difficult to exactly quantify the ' +
      'loss incurred by the Company as a result of breach of terms and conditions of this Offer Letter by ' +
      'you, therefore the Parties mutually agree that you shall pay actual cost of loss/damages to the ' +
      'Company as liquidated damages for such losses incurred by the Company as result of breach of terms ' +
      'and conditions of this Offer Letter by you.'
    );
    clauseBody(
      'You should be prepared to work on any shift, as may be warranted by the Company’s or Client’s ' +
      'work requirements. Depending on organizational requirement or project contingencies your working ' +
      'hours’ / work days may be modified/ altered from time to time.'
    );
    clauseBody(
      'In case of any change in your residential address during your employment, it shall be your duty to ' +
      'intimate the same to the HR Department in writing within three days from the date of such change. ' +
      'All notices mailed to you by the Company to the last address given by you shall be deemed to have ' +
      'been received by you.'
    );
    clauseBody(
      'The work timings are at the sole discretion of the Management and would normally consist of a 45 ' +
      'hours workweek. These are subject to changes, as per business requirements.'
    );
    clauseBody(
      'The Company shall be entitled to carry out a background check in relation to your past employments ' +
      'and you shall assist the Company by providing all such information and assistance as may be required ' +
      'in this connection.'
    );
    clauseBody(
      'This Offer Letter shall be governed and construed under the laws of India. Any disputes or differences ' +
      'arising out of or pertaining to this Offer Letter shall be subject to the exclusive jurisdiction of ' +
      'the competent Courts at Hyderabad, Telangana.'
    );

    /* --- Closing --- */
    ensureSpace(70);
    doc.moveDown(0.8);
    text('We look forward for a long and mutually rewarding association.');
    doc.moveDown(1.5);
    text('Sincerely,');
    doc.moveDown(2.0);
    boldText('HR Manager');
    text(C.name);

    /* --- Acceptance --- */
    ensureSpace(100);
    doc.moveDown(1.0);
    hr();
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COL_DARK)
       .text('Acceptance', MARGIN, doc.y, { width: BW });
    doc.moveDown(0.4);
    text(
      'I have read and understood the above Terms & Conditions hereby signify my acceptance. ' +
      'I would be joining the duties on __________________.'
    );
    doc.moveDown(1.2);
    text('Name  \t:  ' + candidateName);
    doc.moveDown(0.6);
    text('Signature\t:  ___________________________');
    doc.moveDown(0.6);
    text('Date\t\t:  ________________');

    /* --- Report to --- */
    ensureSpace(80);
    doc.moveDown(1.2);
    hr();
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COL_DARK)
       .text('Report to', MARGIN, doc.y, { width: BW });
    doc.moveDown(0.2);
    text(C.name + '.');
    text(C.reportTo || C.address);

    /* ============================================================
       PAGE 2 — ANNEXURE I
    ============================================================ */
    newPage();

    doc.font('Helvetica-Bold').fontSize(14).fillColor(COL_NAVY)
       .text('ANNEXURE I', MARGIN, doc.y, { width: BW });
    doc.moveDown(0.6);

    /* Documents table header */
    const tblHdrText =
      'List of Documents/ Information to be submitted on Date Of Joining to facilitate Joining, ' +
      'Background verification / Validation and Appointment process at ' + C.name;

    const A1_X  = MARGIN;
    const A1_W  = BW;
    const A1_COL= 50;  /* S.No column width */

    /* merged header row */
    ensureSpace(40);
    const a1Hy = doc.y;
    doc.rect(A1_X, a1Hy, A1_W, 36).fillColor(COL_NAVY).fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COL_WHITE)
       .text(tblHdrText, A1_X + 6, a1Hy + 6, { width: A1_W - 12, lineGap: 2 });
    doc.y = a1Hy + 38;

    /* sub-header row */
    ensureSpace(22);
    const a1Sh = doc.y;
    doc.rect(A1_X, a1Sh, A1_COL, 20).fillColor('#e8edf5').fill();
    doc.rect(A1_X + A1_COL, a1Sh, A1_W - A1_COL, 20).fillColor('#e8edf5').fill();
    doc.rect(A1_X, a1Sh, A1_W, 20).strokeColor('#b0b8c8').lineWidth(0.5).stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COL_DARK)
       .text('S.No', A1_X + 6, a1Sh + 5, { width: A1_COL - 8, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COL_DARK)
       .text('Particulars', A1_X + A1_COL + 6, a1Sh + 5, { width: A1_W - A1_COL - 10, lineBreak: false });
    doc.y = a1Sh + 22;

    const annexIItems = [
      '1 copy of this Offer letter duly signed and dated by you',
      'Passport sized photographs - 2',
      'Copies of all education certificates and all year mark sheets. Photocopies should include both front and back sides of the certificate.',
      'Relieving letter or Service Certificate from your all past employers. Include your employee number with such previous employer(s).',
      'Copies of Aadhar card, Passport',
      'Copy of PAN Card or acknowledgement slip of Form 49, if applied for PAN No.',
      'ICICI Bank Account Number (if available)',
      'Joinees family (Parents, Spouse, Children) details including their DOB',
      'Blood Group of Self',
      'If you have stated in your application to ' + C.name + ' that you are differently abled, please bring the disability certificate as per the prescribed format, duly filed & signed.',
    ];

    annexIItems.forEach((item, idx) => {
      /* estimate row height */
      const rowH = item.length > 100 ? 36 : (item.length > 60 ? 28 : 22);
      ensureSpace(rowH + 4);
      const ry = doc.y;
      const shade = idx % 2 === 1;
      if (shade) {
        doc.rect(A1_X, ry, A1_W, rowH).fillColor('#f5f7fa').fill();
      }
      doc.rect(A1_X, ry, A1_W, rowH).strokeColor('#d0d8e8').lineWidth(0.5).stroke();
      doc.font('Helvetica').fontSize(9).fillColor(COL_DARK)
         .text(String(idx + 1), A1_X + 16, ry + 6, { width: A1_COL - 20, lineBreak: false });
      doc.font('Helvetica').fontSize(9).fillColor(COL_MID)
         .text(item, A1_X + A1_COL + 6, ry + 6, { width: A1_W - A1_COL - 12, lineGap: 2 });
      doc.y = ry + rowH + 2;
    });

    ensureSpace(50);
    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#cc0000')
       .text(
         '* Please note that all of the above documents are mandatory and you will not be allowed to join without them. ' +
         'Also you should bring all originals documents for verification on the Date Of Joining.',
         MARGIN, doc.y, { width: BW }
       );
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9).fillColor(COL_GREY)
       .text('Please contact us via ' + C.email + ' for any queries regarding your employment offer.',
         MARGIN, doc.y, { width: BW });

    /* ============================================================
       PAGE 3 — COMPENSATION + ANNEXURE II
    ============================================================ */
    newPage();

    /* COMPENSATION heading */
    doc.font('Helvetica-Bold').fontSize(13).fillColor(COL_NAVY)
       .text('COMPENSATION', MARGIN, doc.y, { width: BW });
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(10).fillColor(COL_MID)
       .text(
         'Your annual compensation (Cost To Company) will be ' +
         'Rs ' + Number(ctcNum).toLocaleString('en-IN') + '/- ' +
         (ctcInWords ? '(' + ctcInWords + ')' : '') +
         '. Employees are prohibited from discussing their salary with other employees. ' +
         'Any employee violating this policy will be considered to have committed a breach of ' +
         'confidentiality and will be subject to disciplinary action, up to and possibly including ' +
         'termination of employment.',
         MARGIN, doc.y, { width: BW, lineGap: 2 }
       );

    doc.moveDown(1.0);

    /* ANNEXURE II heading */
    doc.font('Helvetica-Bold').fontSize(13).fillColor(COL_NAVY)
       .text('ANNEXURE II', MARGIN, doc.y, { width: BW });
    doc.moveDown(0.5);

    /* CTC TABLE */
    const T_X  = MARGIN;
    const T_W  = BW;
    const T_C1 = T_X + 280;   /* MONTHLY col start */
    const T_C2 = T_X + 390;   /* YEARLY col start */
    const T_W0 = 275;
    const T_W1 = 105;
    const T_W2 = T_W - 280 - 110 + 5;
    const T_RH = 24;

    /* Table title row (merged) */
    ensureSpace(T_RH + 6);
    const ttY = doc.y;
    doc.rect(T_X, ttY, T_W, T_RH).fillColor(COL_NAVY).fill();
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COL_WHITE)
       .text('CTC STRUCTURE', T_X, ttY + 6, { width: T_W, align: 'center' });
    doc.y = ttY + T_RH + 2;

    /* Column header row */
    ensureSpace(T_RH + 4);
    const thY = doc.y;
    doc.rect(T_X, thY, T_W, T_RH).fillColor('#2c5282').fill();
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COL_WHITE)
       .text('COMPONENTS', T_X + 8, thY + 7, { width: T_W0, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COL_WHITE)
       .text('MONTHLY', T_C1, thY + 7, { width: T_W1, align: 'right', lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COL_WHITE)
       .text('YEARLY', T_C2, thY + 7, { width: T_W2, align: 'right', lineBreak: false });
    doc.y = thY + T_RH + 2;

    function ctcRow(label, annualVal, isBold, isSub) {
      const yearly  = Number(annualVal) || 0;
      const monthly = mo(yearly);
      ensureSpace(T_RH + 4);
      const ry = doc.y;
      const bgColor = isBold ? '#dbeafe' : (isSub ? '#f0f4ff' : COL_WHITE);
      doc.rect(T_X, ry, T_W, T_RH).fillColor(bgColor).fill();
      doc.rect(T_X, ry, T_W, T_RH).strokeColor('#c8d4e8').lineWidth(0.5).stroke();

      const fn = isBold ? 'Helvetica-Bold' : 'Helvetica';
      const fc = isBold ? COL_NAVY : COL_DARK;

      doc.font(fn).fontSize(10).fillColor(fc)
         .text(label, T_X + 8, ry + 6, { width: T_W0, lineBreak: false });
      doc.font(fn).fontSize(10).fillColor(fc)
         .text(monthly ? fmtINR(monthly) : '-', T_C1, ry + 6, { width: T_W1, align: 'right', lineBreak: false });
      doc.font(fn).fontSize(10).fillColor(fc)
         .text(yearly ? fmtINR(yearly) : '-', T_C2, ry + 6, { width: T_W2, align: 'right', lineBreak: false });
      doc.y = ry + T_RH + 2;
    }

    ctcRow('Basic',                       basic,              false, false);
    ctcRow('HRA',                         hra,                false, false);
    ctcRow('Telephone/Internet Expenses', telephoneAllowance, false, false);
    if (Number(leaveTravel)) ctcRow('Leave Travel Allowance', leaveTravel, false, false);
    ctcRow('Spl. Allowance',              specialAllowance,   false, false);
    ctcRow('Gross Salary',                grossSalary,        true,  false);
    ctcRow("Company's PF Contribution",   pfContribution,     false, true);
    if (Number(statutoryBonus)) ctcRow('Statutory Bonus',     statutoryBonus, false, true);
    if (Number(gratuity))       ctcRow('Gratuity',            gratuity,       false, true);
    if (Number(esi))            ctcRow('ESI (Employer)',       esi,            false, true);
    ctcRow('Cost To Company',             ctcNum,             true,  false);

    /* Signature */
    ensureSpace(60);
    doc.moveDown(2.0);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COL_DARK)
       .text('HR Manager', MARGIN, doc.y, { width: BW });
    doc.font('Helvetica').fontSize(10).fillColor(COL_MID)
       .text(C.name, MARGIN, doc.y, { width: BW });

    doc.end();
  });
}

module.exports = { generateOfferLetterPdf };
