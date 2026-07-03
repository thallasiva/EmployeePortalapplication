const { callProcedure } = require("../../config/db");
const BaseService = require("../base.service");
const ApiError = require("../../utils/ApiError");

class OfferService extends BaseService {
  constructor() {
    super("rec_offers", "offer_id");
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
    return (results[0] ?? [])[0];
  }

  async respond(offerId, response, respondedBy, ip) {
    const results = await callProcedure(
      "sp_rec_respond_offer(?, ?, ?, ?)",
      [offerId, response, respondedBy, ip]
    );
    return (results[0] ?? [])[0];
  }
}

module.exports = new OfferService();
