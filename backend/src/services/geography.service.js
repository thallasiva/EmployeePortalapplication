const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

class GeographyService {
  constructor() {
    this.countries = new BaseService('countries', 'country_id', [
      'country_code', 'country_name', 'default_currency', 'default_timezone', 'status',
    ]);
    this.regions = new BaseService('regions', 'region_id', [
      'country_id', 'region_code', 'region_name', 'status',
    ]);
  }

  listCountries({ status } = {}) {
    return this.countries.findAll({
      where: status ? 'status = ?' : '1 = 1',
      params: status ? [status] : [],
      orderBy: 'country_name ASC',
    });
  }

  async createCountry(data) {
    return this.countries.create(data);
  }

  async updateCountry(id, data) {
    const exists = await this.countries.findById(id);
    if (!exists) throw ApiError.notFound('Country not found');
    return this.countries.update(id, data);
  }

  async deleteCountry(id) {
    if (!await this.countries.findById(id)) throw ApiError.notFound('Country not found');
    const refs = await query(
      `SELECT
         (SELECT COUNT(*) FROM regions WHERE country_id = ?) AS region_count,
         (SELECT COUNT(*) FROM offices WHERE country_id = ?) AS branch_count,
         (SELECT COUNT(*) FROM companies WHERE country_id = ? OR registration_country_id = ?) AS company_count`,
      [id, id, id, id]
    );
    if (Object.values(refs[0] || {}).some((count) => Number(count) > 0)) {
      throw ApiError.conflict('This country is in use. Deactivate it instead of deleting it.');
    }
    return this.countries.remove(id);
  }

  listRegions({ country_id: countryId, status } = {}) {
    const clauses = [];
    const params = [];
    if (countryId !== undefined && countryId !== null && countryId !== '') {
      const id = Number(countryId);
      if (!Number.isInteger(id) || id < 1) throw ApiError.badRequest('A valid country_id is required');
      clauses.push('country_id = ?');
      params.push(id);
    }
    if (status) {
      clauses.push('status = ?');
      params.push(status);
    }
    return this.regions.findAll({
      where: clauses.length ? clauses.join(' AND ') : '1 = 1',
      params,
      orderBy: 'region_name ASC',
    });
  }

  async createRegion(data) {
    const country = await this.countries.findById(data.country_id);
    if (!country || country.status !== 'Active') throw ApiError.badRequest('Select an active country');
    return this.regions.create(data);
  }

  async updateRegion(id, data) {
    const region = await this.regions.findById(id);
    if (!region) throw ApiError.notFound('Region not found');
    if (data.country_id !== undefined) {
      const country = await this.countries.findById(data.country_id);
      if (!country || country.status !== 'Active') throw ApiError.badRequest('Select an active country');
    }
    return this.regions.update(id, data);
  }

  async deleteRegion(id) {
    if (!await this.regions.findById(id)) throw ApiError.notFound('Region not found');
    const refs = await query('SELECT COUNT(*) AS total FROM offices WHERE region_id = ?', [id]);
    if (Number(refs[0]?.total || 0)) {
      throw ApiError.conflict('This region is assigned to a branch. Deactivate it instead of deleting it.');
    }
    return this.regions.remove(id);
  }
}

module.exports = new GeographyService();
