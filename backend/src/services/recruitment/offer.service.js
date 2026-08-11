'use strict';

const { callProcedure } = require("../../config/db");
const BaseService = require("../base.service");
const ApiError = require("../../utils/ApiError");
const notify = require("../mailNotify.service");
const joiningSvc = require("../joining.service");
const { generateOfferLetterPdf } = require("../../utils/offerLetterPdf");
const { generateOfferLetterDocx } = require("../../utils/offerLetterDocx");
const libre = require("libreoffice-convert");







process.on('uncaughtException', (err) => {
  if (
  err && err.code === 'ENOTEMPTY' && err.syscall === 'rmdir' &&
  typeof err.path === 'string' && err.path.includes('libreofficeConvert_'))
  {
    console.info('[offer] Suppressed libreoffice-convert Windows tmp-cleanup error (known bug)');
    return;
  }

  throw err;
});

function docxToPdf(docxBuffer) {
  return new Promise((resolve) => {
    libre.convert(docxBuffer, '.pdf', undefined, (err, result) => {
      if (err) {
        console.warn('[offer] LibreOffice convert failed:', err.message, '— falling back to pdfkit');
        resolve(null);
      } else {
        console.info('[offer] LibreOffice PDF ready, size=', result?.length);
        resolve(result);
      }
    });
  });
}

class OfferService extends BaseService {
  constructor() {
    super("rec_offers", "offer_id");
  }

  async _getRecruiterTL(recruiterId) {
    if (!recruiterId) return {};
    const results = await callProcedure('sp_rec_get_recruiter_team_lead(?)', [recruiterId]);
    return (results[0] ?? [])[0] ?? {};
  }

  async list({ status, search, limit = 20, offset = 0 } = {}) {
    const results = await callProcedure(
      "sp_rec_list_offers(?, ?, ?, ?)",
      [status || null, search || null, limit, offset]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getById(offerId) {
    const results = await callProcedure("sp_rec_get_offer(?)", [offerId]);
    const row = (results[0] ?? [])[0];
    if (!row) throw new ApiError(404, "Offer not found");
    return row;
  }

  async create(data, createdBy, ip) {
    const results = await callProcedure(
      "sp_rec_create_offer(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @offer_id, @offer_code)",
      [
      data.candidateId,
      data.jobReqId,
      data.designation,
      data.dateOfJoining || null,
      data.basic ?? 0,
      data.hra ?? 0,
      data.telephoneAllowance ?? 0,
      data.leaveTravel ?? 0,
      data.specialAllowance ?? 0,
      data.grossSalary ?? 0,
      data.pfContribution ?? 0,
      data.statutoryBonus ?? 0,
      data.gratuity ?? 0,
      data.esi ?? 0,
      data.ctc,
      data.ctcInWords || null,
      createdBy,
      ip]

    );
    return (results[0] ?? [])[0];
  }

  async release(offerId, releasedBy, ip) {
    const results = await callProcedure(
      "sp_rec_release_offer(?, ?, ?)",
      [offerId, releasedBy, ip]
    );
    const row = (results[0] ?? [])[0];

    if (row) {
      const candidateEmail = row.candidate_email || row.email || null;
      const candidateName = row.candidate_name || row.name || 'Candidate';
      const jobTitle = row.designation || row.job_title || '';
      const ctc = row.ctc || 0;
      const dateOfJoining = row.date_of_joining || row.joining_date || null;
      const ctcData = {
        offerCode: row.offer_code || null,
        ctc,
        ctcInWords: row.ctc_in_words || null,
        dateOfJoining,
        basic: row.basic || 0,
        hra: row.hra || 0,
        telephoneAllowance: row.telephone_allowance || 0,
        leaveTravel: row.leave_travel || 0,
        specialAllowance: row.special_allowance || 0,
        grossSalary: row.gross_salary || 0,
        pfContribution: row.pf_contribution || 0,
        statutoryBonus: row.statutory_bonus || 0,
        gratuity: row.gratuity || 0,
        esi: row.esi || 0
      };

      const recruiterId = row.recruiter_id || row.recruiter_employee_id || null;
      this._getRecruiterTL(recruiterId).then((tl) => {
        if (tl.tl_email) {
          notify.offerReleasedToHR({
            hrEmail: tl.tl_email,
            hrName: tl.tl_name || 'HR Manager',
            candidateName, jobTitle, ctc, dateOfJoining
          });
        }
      }).catch(() => {});

      console.info('[offer] release: candidateEmail=', candidateEmail, 'candidateName=', candidateName);
      if (candidateEmail) {
        const candidateId = row.candidate_id || null;
        Promise.resolve().then(async () => {
          let pdfBuffer = null;
          try {

            const docxBuf = generateOfferLetterDocx({
              offerCode: ctcData.offerCode || '',
              offerDate: row.created_at || new Date(),
              candidateName,
              designation: jobTitle,
              dateOfJoining: ctcData.dateOfJoining || '',
              ctc: ctcData.ctc || 0,
              ctcInWords: ctcData.ctcInWords || '',
              companyName: process.env.COMPANY_NAME || 'NAT IT Services Pvt Ltd',
              companyEmail: process.env.COMPANY_EMAIL || 'hr@natit.in',
              reportTo: process.env.COMPANY_NAME || 'NAT IT Services Pvt Ltd',
              basic: ctcData.basic || 0,
              hra: ctcData.hra || 0,
              telephoneAllowance: ctcData.telephoneAllowance || 0,
              leaveTravel: ctcData.leaveTravel || 0,
              specialAllowance: ctcData.specialAllowance || 0,
              grossSalary: ctcData.grossSalary || 0,
              pfContribution: ctcData.pfContribution || 0,
              statutoryBonus: ctcData.statutoryBonus || 0,
              gratuity: ctcData.gratuity || 0,
              esi: ctcData.esi || 0
            });
            pdfBuffer = await docxToPdf(docxBuf);

            if (!pdfBuffer) {
              pdfBuffer = await generateOfferLetterPdf({
                candidateName, jobTitle,
                hrManagerName: process.env.HR_MANAGER_NAME || '',
                ...ctcData
              });
            }
            console.info('[offer] offer letter PDF ready, size=', pdfBuffer?.length);
          } catch (pdfErr) {
            console.error('[offer] PDF generation failed:', pdfErr.message);
          }

          let invitation = null;
          try {
            invitation = await joiningSvc.createInvitation({
              candidateId, offerId, candidateName, candidateEmail, jobTitle
            });
            console.info('[offer] invitation token=', invitation?.token);
          } catch (invErr) {
            console.warn('[offer] createInvitation failed:', invErr.message, '-- trying getByOffer fallback');
            try {
              invitation = await joiningSvc.getByOffer(offerId);
              console.info('[offer] fallback invitation token=', invitation?.token);
            } catch (fbErr) {
              console.error('[offer] getByOffer fallback also failed:', fbErr.message);
            }
          }

          if (!invitation?.token) {
            console.error('[offer] No invitation token available -- email not sent');
            return;
          }

          const joiningUrl = (process.env.FRONTEND_URL || 'http://localhost:3000') +
          '/joining/' + invitation.token;

          notify.joiningInvitation({
            candidateName, candidateEmail, jobTitle, joiningUrl,
            expiresAt: invitation.expires_at,
            pdfBuffer,
            pdfFilename: 'Offer_Letter_' + (ctcData.offerCode || offerId) + '.pdf',
            ...ctcData
          });
          console.info('[offer] joiningInvitation email sent to:', candidateEmail,
          '| PDF attached:', !!pdfBuffer);
        });
      } else {
        console.warn('[offer] release: no candidateEmail -- row keys:', Object.keys(row || {}));
      }
    }
    return row;
  }

  async respond(offerId, response, respondedBy, ip) {
    const results = await callProcedure(
      "sp_rec_respond_offer(?, ?, ?, ?)",
      [offerId, response, respondedBy, ip]
    );
    const row = (results[0] ?? [])[0];

    if (row) {
      const candidateName = row.candidate_name || row.name || 'Candidate';
      const jobTitle = row.designation || row.job_title || '';
      const dateOfJoining = row.date_of_joining || null;
      const r = (response || '').toLowerCase();
      const isAccepted = r === 'accepted';
      const isRejected = r === 'rejected' || r === 'declined';

      if (isAccepted) {
        notify.offerAcceptedAdmin({ candidateName, jobTitle, dateOfJoining });
      }

      if (isAccepted || isRejected) {
        const recruiterId = row.recruiter_id || row.recruiter_employee_id || null;
        this._getRecruiterTL(recruiterId).then((tl) => {
          if (tl.tl_email) {
            notify.tlOfferUpdate({
              tlEmail: tl.tl_email,
              tlName: tl.tl_name || 'HR Manager',
              recruiterName: tl.recruiter_name || 'Recruiter',
              candidateName, jobTitle,
              event: isAccepted ? 'Accepted' : 'Rejected',
              ctc: row.ctc || null,
              dateOfJoining
            });
          }
        }).catch(() => {});
      }
    }
    return row;
  }
}

module.exports = new OfferService();
