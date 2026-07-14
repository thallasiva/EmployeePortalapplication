const { callProcedure, query } = require("../../config/db");
const BaseService = require("../base.service");
const ApiError = require("../../utils/ApiError");
const notify = require("../mailNotify.service");

class OfferService extends BaseService {
  constructor() {
    super("rec_offers", "offer_id");
  }

  /** Fetch TL email via candidate's recruiter reporting_to */
  async _getRecruiterTL(recruiterId) {
    if (!recruiterId) return {};
    const rows = await query(
      `SELECT tl.email AS tl_email,
              CONCAT(tl.first_name, ' ', IFNULL(tl.last_name, '')) AS tl_name,
              CONCAT(r.first_name,  ' ', IFNULL(r.last_name,  '')) AS recruiter_name
         FROM employees r
         LEFT JOIN employees tl ON tl.employee_id = r.reporting_to
        WHERE r.employee_id = ? LIMIT 1`,
      [recruiterId]
    );
    return rows[0] ?? {};
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
      "sp_rec_create_offer(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @offer_id, @offer_code)",
      [
        data.candidateId,
        data.jobReqId,
        data.designation,
        data.dateOfJoining || null,
        data.basic || 0,
        data.hra || 0,
        data.telephoneAllowance || 0,
        data.specialAllowance || 0,
        data.grossSalary || 0,
        data.pfContribution || 0,
        data.statutoryBonus || 0,
        data.gratuity || 0,
        data.esi || 0,
        data.ctc,
        data.ctcInWords || null,
        createdBy,
        ip,
      ]
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
      const candidateEmail = row.candidate_email || row.email;
      const candidateName  = row.candidate_name  || row.name || 'Candidate';
      const jobTitle       = row.designation     || row.job_title || '';
      const ctc            = row.ctc             || 0;
      const dateOfJoining  = row.date_of_joining || row.joining_date || null;
      const offerCode      = row.offer_code      || row.offer_id;

      // Notify candidate
      if (candidateEmail) {
        notify.offerLetter({ candidateEmail, candidateName, jobTitle, ctc, dateOfJoining, offerCode });
      }

      // Notify TL that offer was released for their team's candidate
      const recruiterId = row.recruiter_id || row.recruiter_employee_id || null;
      this._getRecruiterTL(recruiterId).then((tl) => {
        if (tl.tl_email) {
          notify.tlOfferUpdate({
            tlEmail:       tl.tl_email,
            tlName:        tl.tl_name        || 'Team Lead',
            recruiterName: tl.recruiter_name  || 'Recruiter',
            candidateName,
            jobTitle,
            event:         'Released',
            ctc,
            dateOfJoining,
          });
        }
      }).catch(() => {});
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
      const jobTitle      = row.designation    || row.job_title || '';
      const r             = (response || '').toLowerCase();
      const isAccepted    = r === 'accepted';
      const isRejected    = r === 'rejected' || r === 'declined';

      // Notify HR
      if (isAccepted) {
        notify.offerAccepted({ hrEmail: row.hr_email || null, candidateName, jobTitle, dateOfJoining: row.date_of_joining || null });
      } else if (isRejected) {
        notify.offerRejected({ hrEmail: row.hr_email || null, candidateName, jobTitle });
      }

      // Notify TL of candidate's decision
      if (isAccepted || isRejected) {
        const recruiterId = row.recruiter_id || row.recruiter_employee_id || null;
        this._getRecruiterTL(recruiterId).then((tl) => {
          if (tl.tl_email) {
            notify.tlOfferUpdate({
              tlEmail:       tl.tl_email,
              tlName:        tl.tl_name        || 'Team Lead',
              recruiterName: tl.recruiter_name  || 'Recruiter',
              candidateName,
              jobTitle,
              event:         isAccepted ? 'Accepted' : 'Rejected',
              ctc:           row.ctc            || null,
              dateOfJoining: row.date_of_joining || null,
            });
          }
        }).catch(() => {});
      }
    }
    return row;
  }
}

module.exports = new OfferService();
