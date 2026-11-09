'use strict';
const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

function requireCompany(companyId) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
  return company;
}

class AssetService {
  // async list(companyId) {
  //   const company = requireCompany(companyId);
  //   return query(
  //     `SELECT a.*, COALESCE(c.category_name, a.category) AS category,
  //             aa.assignment_id, aa.employee_id, aa.assigned_at,
  //             CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
  //             e.emp_code
  //        FROM company_assets a
  //        LEFT JOIN asset_categories c ON c.category_id = a.category_id AND c.company_id = a.company_id
  //        LEFT JOIN asset_assignments aa ON aa.asset_id = a.asset_id AND aa.company_id = a.company_id AND aa.returned_at IS NULL
  //        LEFT JOIN employees e ON e.employee_id = aa.employee_id AND e.company_id = a.company_id
  //       WHERE a.company_id = ?
  //       ORDER BY a.created_at DESC`,
  //     [company]
  //   );
  // }
  async list(companyId) {
    const company = requireCompany(companyId);

    const [rows] = await query(
      'CALL sp_asset_list(?)',
      [company]
    );

    return rows;
  }

  // async dashboard(companyId) {
  //   const company = requireCompany(companyId);
  //   const [assets, trend, recentAllocations] = await Promise.all([
  //     query(
  //       `SELECT a.asset_id, a.asset_tag, a.asset_name, COALESCE(c.category_name, a.category) AS category,
  //               a.serial_number, a.status, a.updated_at
  //          FROM company_assets a
  //          LEFT JOIN asset_categories c ON c.category_id = a.category_id AND c.company_id = a.company_id
  //         WHERE a.company_id = ?
  //         ORDER BY a.asset_name`,
  //       [company]
  //     ),
  //     query(
  //       `WITH RECURSIVE months AS (
  //          SELECT DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01') AS month_start
  //          UNION ALL
  //          SELECT DATE_ADD(month_start, INTERVAL 1 MONTH)
  //            FROM months
  //           WHERE month_start < DATE_FORMAT(CURDATE(), '%Y-%m-01')
  //        )
  //        SELECT DATE_FORMAT(m.month_start, '%Y-%m') AS month,
  //               DATE_FORMAT(m.month_start, '%b') AS label,
  //               (SELECT COUNT(*)
  //                  FROM company_assets a
  //                 WHERE a.company_id = ?
  //                   AND a.created_at < IF(m.month_start = DATE_FORMAT(CURDATE(), '%Y-%m-01'), NOW(), DATE_ADD(m.month_start, INTERVAL 1 MONTH))
  //               ) AS total_assets,
  //               (SELECT COUNT(*)
  //                  FROM asset_assignments aa
  //                  JOIN company_assets a ON a.asset_id = aa.asset_id AND a.company_id = aa.company_id
  //                 WHERE aa.company_id = ?
  //                   AND aa.assigned_at < IF(m.month_start = DATE_FORMAT(CURDATE(), '%Y-%m-01'), NOW(), DATE_ADD(m.month_start, INTERVAL 1 MONTH))
  //                   AND (aa.returned_at IS NULL OR aa.returned_at >= IF(m.month_start = DATE_FORMAT(CURDATE(), '%Y-%m-01'), NOW(), DATE_ADD(m.month_start, INTERVAL 1 MONTH)))
  //               ) AS allocated
  //          FROM months m
  //         ORDER BY m.month_start`,
  //       [company, company]
  //     ),
  //     query(
  //       `SELECT a.asset_id, a.asset_tag, a.asset_name, COALESCE(c.category_name, a.category) AS category, a.status,
  //               aa.assigned_at, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name
  //          FROM asset_assignments aa
  //          JOIN company_assets a ON a.asset_id = aa.asset_id AND a.company_id = aa.company_id
  //          LEFT JOIN asset_categories c ON c.category_id = a.category_id AND c.company_id = a.company_id
  //          JOIN employees e ON e.employee_id = aa.employee_id AND e.company_id = aa.company_id
  //         WHERE aa.company_id = ? AND aa.returned_at IS NULL
  //         ORDER BY aa.assigned_at DESC
  //         LIMIT 5`,
  //       [company]
  //     ),
  //   ]);

  //   const statusCounts = assets.reduce((counts, asset) => {
  //     counts[asset.status] = (counts[asset.status] || 0) + 1;
  //     return counts;
  //   }, {});
  //   const categoryCounts = assets.reduce((counts, asset) => {
  //     const category = asset.category?.trim() || 'Uncategorized';
  //     counts[category] = (counts[category] || 0) + 1;
  //     return counts;
  //   }, {});
  //   const categories = Object.entries(categoryCounts)
  //     .map(([category, count]) => ({ category, count }))
  //     .sort((a, b) => b.count - a.count);
  //   const alerts = assets
  //     .filter((asset) => asset.status === 'Maintenance' || !asset.serial_number)
  //     .slice(0, 6)
  //     .map((asset) => ({
  //       asset_id: asset.asset_id,
  //       asset_tag: asset.asset_tag,
  //       asset_name: asset.asset_name,
  //       status: asset.status,
  //       updated_at: asset.updated_at,
  //       alert: asset.status === 'Maintenance' ? 'Under maintenance' : 'Missing serial number',
  //     }));

  //   return {
  //     summary: {
  //       total: assets.length,
  //       allocated: statusCounts.Assigned || 0,
  //       available: statusCounts.Available || 0,
  //       maintenance: statusCounts.Maintenance || 0,
  //       retired: statusCounts.Retired || 0,
  //     },
  //     categories,
  //     trend,
  //     recentAllocations,
  //     alerts,
  //   };
  // }

  async dashboard(companyId) {
    const company = requireCompany(companyId);

    const [assetResult, trendResult, allocationResult] =
      await Promise.all([
        query(
          'CALL sp_asset_dashboard_assets(?)',
          [company]
        ),
        query(
          'CALL sp_asset_dashboard_trend(?)',
          [company]
        ),
        query(
          'CALL sp_asset_dashboard_recent_allocations(?)',
          [company]
        )
      ]);

    // Extract first result set from MySQL stored procedures
    const assets = assetResult[0] || [];
    const trend = trendResult[0] || [];
    const recentAllocations = allocationResult[0] || [];

    // Status counts
    const statusCounts = assets.reduce((counts, asset) => {
      counts[asset.status] = (counts[asset.status] || 0) + 1;
      return counts;
    }, {});

    // Category counts
    const categoryCounts = assets.reduce((counts, asset) => {
      const category = asset.category?.trim() || 'Uncategorized';

      counts[category] = (counts[category] || 0) + 1;

      return counts;
    }, {});

    const categories = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count
      }))
      .sort((a, b) => b.count - a.count);

    // Asset alerts
    const alerts = assets
      .filter(
        asset =>
          asset.status === 'Maintenance' ||
          !asset.serial_number
      )
      .slice(0, 6)
      .map(asset => ({
        asset_id: asset.asset_id,
        asset_tag: asset.asset_tag,
        asset_name: asset.asset_name,
        status: asset.status,
        updated_at: asset.updated_at,
        alert:
          asset.status === 'Maintenance'
            ? 'Under maintenance'
            : 'Missing serial number'
      }));

    return {
      summary: {
        total: assets.length,
        allocated: statusCounts.Assigned || 0,
        available: statusCounts.Available || 0,
        maintenance: statusCounts.Maintenance || 0,
        retired: statusCounts.Retired || 0
      },
      categories,
      trend,
      recentAllocations,
      alerts
    };
  }
  // async create(data, companyId, actorId) {
  //   const company = requireCompany(companyId);
  //   if (!data.asset_tag?.trim() || !data.asset_name?.trim()) throw ApiError.badRequest('Asset tag and name are required');
  //   let categoryName = data.category?.trim() || null;
  //   if (data.category_id) {
  //     const categories = await query(
  //       'SELECT category_id, category_name FROM asset_categories WHERE category_id = ? AND company_id = ? AND is_active = 1',
  //       [data.category_id, company]
  //     );
  //     if (!categories.length) throw ApiError.badRequest('Select an active category belonging to this company');
  //     categoryName = categories[0].category_name;
  //   }
  //   const result = await query(
  //     `INSERT INTO company_assets (company_id, asset_tag, asset_name, category, category_id, serial_number, purchase_date, location, notes, created_by)
  //      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  //     [company, data.asset_tag.trim(), data.asset_name.trim(), categoryName, data.category_id || null,
  //       data.serial_number || null, data.purchase_date || null, data.location || null, data.notes || null, actorId || null]
  //   );
  //   return (await this.list(company)).find((asset) => Number(asset.asset_id) === Number(result.insertId));
  // }
  async create(data, companyId, actorId) {
    const company = requireCompany(companyId);

    if (!data.asset_tag?.trim() || !data.asset_name?.trim()) {
      throw ApiError.badRequest('Asset tag and name are required');
    }

    try {
      await query(
        `CALL sp_asset_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company,
          data.asset_tag.trim(),
          data.asset_name.trim(),
          data.category?.trim() || null,
          data.category_id || null,
          data.serial_number || null,
          data.purchase_date || null,
          data.location || null,
          data.notes || null,
          actorId || null
        ]
      );

      // Fetch newly created asset using asset code
      const assets = await this.list(company);

      return assets.find(
        asset => asset.asset_code === data.asset_tag.trim()
      );

    } catch (error) {
      if (error.sqlState === '45000') {
        throw ApiError.badRequest(error.sqlMessage);
      }

      throw error;
    }
  }

  // async assign(assetId, employeeId, companyId, actorId) {
  //   const company = requireCompany(companyId);
  //   await withTransaction(async (connection) => {
  //     const [assets] = await connection.execute(
  //       'SELECT asset_id, status FROM company_assets WHERE asset_id = ? AND company_id = ? FOR UPDATE',
  //       [assetId, company]
  //     );
  //     if (!assets.length) throw ApiError.notFound('Asset not found');
  //     if (assets[0].status !== 'Available') throw ApiError.conflict('Only available assets can be assigned');
  //     const [employees] = await connection.execute(
  //       'SELECT employee_id FROM employees WHERE employee_id = ? AND company_id = ? AND employee_status = ?',
  //       [employeeId, company, 'Active']
  //     );
  //     if (!employees.length) throw ApiError.notFound('Active employee not found in this company');
  //     await connection.execute(
  //       'INSERT INTO asset_assignments (company_id, asset_id, employee_id, assigned_by) VALUES (?, ?, ?, ?)',
  //       [company, assetId, employeeId, actorId || null]
  //     );
  //     await connection.execute(
  //       "UPDATE company_assets SET status = 'Assigned' WHERE asset_id = ? AND company_id = ?",
  //       [assetId, company]
  //     );
  //   });
  //   return (await this.list(company)).find((asset) => Number(asset.asset_id) === Number(assetId));
  // }

  async assign(assetId, employeeId, companyId, actorId) {
    const company = requireCompany(companyId);

    try {
      await query(
        'CALL sp_asset_assign(?, ?, ?, ?)',
        [
          assetId,
          employeeId,
          company,
          actorId || null
        ]
      );

      // Return updated asset details
      const assets = await this.list(company);

      return assets.find(
        asset => Number(asset.asset_id) === Number(assetId)
      );

    } catch (error) {

      const message = error.sqlMessage || error.message;

      if (message === 'Asset not found') {
        throw ApiError.notFound(message);
      }

      if (message === 'Active employee not found in this company') {
        throw ApiError.notFound(message);
      }

      if (message === 'Only available assets can be assigned') {
        throw ApiError.conflict(message);
      }

      throw error;
    }
  }

  // async returnAsset(assetId, condition, companyId, actorId) {
  //   const company = requireCompany(companyId);
  //   const result = await withTransaction(async (connection) => {
  //     const [assets] = await connection.execute(
  //       'SELECT asset_id, status FROM company_assets WHERE asset_id = ? AND company_id = ? FOR UPDATE',
  //       [assetId, company]
  //     );
  //     if (!assets.length) throw ApiError.notFound('Asset not found');
  //     if (assets[0].status !== 'Assigned') throw ApiError.conflict('Asset is not currently assigned');
  //     const [assignments] = await connection.execute(
  //       'SELECT assignment_id FROM asset_assignments WHERE asset_id = ? AND company_id = ? AND returned_at IS NULL FOR UPDATE',
  //       [assetId, company]
  //     );
  //     if (!assignments.length) throw ApiError.conflict('Active assignment record was not found');
  //     await connection.execute(
  //       'UPDATE asset_assignments SET returned_by = ?, returned_at = NOW(), return_condition = ? WHERE assignment_id = ?',
  //       [actorId || null, condition || null, assignments[0].assignment_id]
  //     );
  //     await connection.execute(
  //       "UPDATE company_assets SET status = 'Available' WHERE asset_id = ? AND company_id = ?",
  //       [assetId, company]
  //     );
  //     return true;
  //   });
  //   if (!result) throw ApiError.internal('Asset return could not be completed');
  //   return (await this.list(company)).find((asset) => Number(asset.asset_id) === Number(assetId));
  // }

  async returnAsset(assetId, condition, companyId, actorId) {
    const company = requireCompany(companyId);

    try {
      await query(
        'CALL sp_asset_return(?, ?, ?, ?)',
        [
          assetId,
          condition || null,
          company,
          actorId || null
        ]
      );

      const assets = await this.list(company);

      return assets.find(
        (asset) => Number(asset.asset_id) === Number(assetId)
      );

    } catch (error) {
      const message = error.sqlMessage || error.message;

      if (message === 'Asset not found') {
        throw ApiError.notFound(message);
      }

      if (
        message === 'Asset is not currently assigned' ||
        message === 'Active assignment record was not found'
      ) {
        throw ApiError.conflict(message);
      }

      throw error;
    }
  }

  // async setStatus(assetId, status, companyId) {
  //   const company = requireCompany(companyId);
  //   if (!['Available', 'Maintenance', 'Retired'].includes(status)) throw ApiError.badRequest('Invalid asset status');
  //   const result = await query(
  //     `UPDATE company_assets SET status = ?
  //       WHERE asset_id = ? AND company_id = ? AND status <> 'Assigned'`,
  //     [status, assetId, company]
  //   );
  //   if (!result.affectedRows) throw ApiError.notFound('Unassigned asset not found');
  //   return (await this.list(company)).find((asset) => Number(asset.asset_id) === Number(assetId));
  // }

  async setStatus(assetId, status, companyId) {
    const company = requireCompany(companyId);

    try {
      await query(
        'CALL sp_asset_set_status(?, ?, ?)',
        [assetId, status, company]
      );

      const assets = await this.list(company);

      return assets.find(
        (asset) => Number(asset.asset_id) === Number(assetId)
      );

    } catch (error) {
      const message = error.sqlMessage || error.message;

      if (message === 'Invalid asset status') {
        throw ApiError.badRequest(message);
      }

      if (message === 'Unassigned asset not found') {
        throw ApiError.notFound(message);
      }

      throw error;
    }
  }

  // async listMine(employeeId, companyId) {
  //   const company = requireCompany(companyId);
  //   return query(
  //     `SELECT a.asset_id, a.asset_tag, a.asset_name, COALESCE(c.category_name, a.category) AS category,
  //             a.serial_number, a.location, aa.assigned_at
  //        FROM asset_assignments aa
  //        JOIN company_assets a ON a.asset_id = aa.asset_id AND a.company_id = aa.company_id
  //        LEFT JOIN asset_categories c ON c.category_id = a.category_id AND c.company_id = a.company_id
  //        JOIN employees e ON e.employee_id = aa.employee_id AND e.company_id = aa.company_id
  //       WHERE aa.company_id = ? AND aa.employee_id = ? AND aa.returned_at IS NULL
  //       ORDER BY aa.assigned_at DESC`,
  //     [company, employeeId]
  //   );
  // }

  async listMine(employeeId, companyId) {
    const company = requireCompany(companyId);

    const [rows] = await query(
      'CALL sp_asset_list_mine(?, ?)',
      [company, employeeId]
    );

    return rows;
  }

  // async categories(companyId, includeInactive = true) {
  //   const company = requireCompany(companyId);
  //   return query(
  //     `SELECT c.category_id, c.category_name, c.description, c.icon, c.is_active,
  //             COUNT(a.asset_id) AS asset_count
  //        FROM asset_categories c
  //        LEFT JOIN company_assets a ON a.category_id = c.category_id AND a.company_id = c.company_id
  //       WHERE c.company_id = ? AND (? = 1 OR c.is_active = 1)
  //       GROUP BY c.category_id
  //       ORDER BY c.is_active DESC, c.category_name`,
  //     [company, includeInactive ? 1 : 0]
  //   );
  // }

  async categories(companyId, includeInactive = true) {
    const company = requireCompany(companyId);

    const [rows] = await query(
      'CALL sp_asset_categories(?, ?)',
      [
        company,
        includeInactive ? 1 : 0
      ]
    );

    return rows;
  }

  // async saveCategory(id, data, companyId) {
  //   const company = requireCompany(companyId);
  //   const name = data.category_name?.trim();
  //   if (!name) throw ApiError.badRequest('Category name is required');
  //   if (id) {
  //     const result = await query(
  //       `UPDATE asset_categories SET category_name = ?, description = ?, icon = ?,
  //               is_active = COALESCE(?, is_active)
  //         WHERE category_id = ? AND company_id = ?`,
  //       [name, data.description || null, data.icon || null,
  //         data.is_active == null ? null : (data.is_active ? 1 : 0), id, company]
  //     );
  //     if (!result.affectedRows) throw ApiError.notFound('Asset category not found');
  //     await query('UPDATE company_assets SET category = ? WHERE category_id = ? AND company_id = ?', [name, id, company]);
  //     return (await this.categories(company)).find((item) => Number(item.category_id) === Number(id));
  //   }
  //   const result = await query(
  //     'INSERT INTO asset_categories (company_id, category_name, description, icon) VALUES (?, ?, ?, ?)',
  //     [company, name, data.description || null, data.icon || null]
  //   );
  //   return (await this.categories(company)).find((item) => Number(item.category_id) === Number(result.insertId));
  // }

  async saveCategory(id, data, companyId) {
    const company = requireCompany(companyId);
    const name = data.category_name?.trim();

    if (!name) {
      throw ApiError.badRequest('Category name is required');
    }

    try {
      const result = await query(
        'CALL sp_asset_save_category(?, ?, ?, ?, ?, ?)',
        [
          id || null,
          company,
          name,
          data.description || null,
          data.icon || null,
          data.is_active == null
            ? null
            : (data.is_active ? 1 : 0)
        ]
      );

      // Extract the category ID from the procedure result.
      // Supports a query helper returning either raw MySQL2 results
      // or just the rows.
      const categoryId = Array.isArray(result?.[0]?.[0])
        ? result[0][0][0]?.category_id
        : result?.[0]?.category_id;

      if (!categoryId) {
        throw ApiError.internal('Category could not be saved');
      }

      const categories = await this.categories(company);

      return categories.find(
        (item) => Number(item.category_id) === Number(categoryId)
      );

    } catch (error) {
      const message = error.sqlMessage || error.message;

      if (message === 'Asset category not found') {
        throw ApiError.notFound(message);
      }

      throw error;
    }
  }

  // async allocations(companyId, filters = {}) {
  //   const company = requireCompany(companyId);
  //   const conditions = ['aa.company_id = ?', 'aa.returned_at IS NULL'];
  //   const params = [company];
  //   if (filters.employeeId) {
  //     conditions.push('aa.employee_id = ?');
  //     params.push(Number(filters.employeeId));
  //   }
  //   if (filters.categoryId) {
  //     conditions.push('a.category_id = ?');
  //     params.push(Number(filters.categoryId));
  //   }
  //   if (filters.search?.trim()) {
  //     const like = `%${filters.search.trim()}%`;
  //     conditions.push('(a.asset_tag LIKE ? OR a.asset_name LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)');
  //     params.push(like, like, like, like);
  //   }
  //   return query(
  //     `SELECT aa.assignment_id, aa.asset_id, aa.employee_id, aa.assigned_at,
  //             a.asset_tag, a.asset_name, COALESCE(c.category_name, a.category) AS category, a.location,
  //             e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name
  //        FROM asset_assignments aa
  //        JOIN company_assets a ON a.asset_id = aa.asset_id AND a.company_id = aa.company_id
  //        LEFT JOIN asset_categories c ON c.category_id = a.category_id AND c.company_id = a.company_id
  //        JOIN employees e ON e.employee_id = aa.employee_id AND e.company_id = aa.company_id
  //       WHERE ${conditions.join(' AND ')}
  //       ORDER BY aa.assigned_at DESC`,
  //     params
  //   );
  // }

  async allocations(companyId, filters = {}) {
    const company = requireCompany(companyId);

    const employeeId = filters.employeeId
      ? Number(filters.employeeId)
      : null;

    const categoryId = filters.categoryId
      ? Number(filters.categoryId)
      : null;

    const search = filters.search?.trim() || null;

    const [rows] = await query(
      'CALL sp_asset_allocations(?, ?, ?, ?)',
      [
        company,
        employeeId,
        categoryId,
        search
      ]
    );

    return rows;
  }

  // async returns(companyId) {
  //   const company = requireCompany(companyId);
  //   return query(
  //     `SELECT aa.assignment_id, aa.asset_id, a.asset_tag, a.asset_name,
  //             CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
  //             aa.assigned_at, aa.returned_at, aa.return_condition
  //        FROM asset_assignments aa
  //        JOIN company_assets a ON a.asset_id = aa.asset_id AND a.company_id = aa.company_id
  //        JOIN employees e ON e.employee_id = aa.employee_id AND e.company_id = aa.company_id
  //       WHERE aa.company_id = ? AND aa.returned_at IS NOT NULL
  //         AND COALESCE(aa.return_condition, '') <> 'Transferred'
  //       ORDER BY aa.returned_at DESC`,
  //     [company]
  //   );
  // }

  async returns(companyId) {
    const company = requireCompany(companyId);

    const [rows] = await query(
      'CALL sp_asset_returns(?)',
      [company]
    );

    return rows;
  }


  async requests(companyId, employeeId = null) {
    const company = requireCompany(companyId);
    const result = await query('CALL sp_asset_requests(?, ?)', [company, employeeId]);
    return result[0];
  }

  async createRequest(data, companyId, employeeId) {
    const company = requireCompany(companyId);
    try {
      const result = await query('CALL sp_asset_create_request(?, ?, ?, ?, ?, ?)', [
        company, employeeId, data.request_type, data.category_id || null,
        data.justification?.trim() || null, data.priority || 'Medium'
      ]);
      const id = result[0][0].request_id;
      return (await this.requests(company, employeeId)).find(r => Number(r.request_id) === Number(id));
    } catch (error) {
      const message = error.sqlMessage || error.message;
      if (message === 'Active employee company context is required') throw ApiError.forbidden(message);
      if (['Select an active company asset category', 'Justification is required'].includes(message)) throw ApiError.badRequest(message);
      throw error;
    }
  }

  async reviewRequest(requestId, decision, notes, companyId, reviewerId) {
    const company = requireCompany(companyId);
    if (!['Approved', 'Rejected'].includes(decision)) throw ApiError.badRequest('Decision must be Approved or Rejected');
    try {
      await query('CALL sp_asset_review_request(?, ?, ?, ?, ?)', [requestId, decision, notes || null, company, reviewerId || null]);
      return (await this.requests(company)).find(r => Number(r.request_id) === Number(requestId));
    } catch (error) {
      const message = error.sqlMessage || error.message;
      if (message === 'Pending asset request not found') throw ApiError.conflict(message);
      throw error;
    }
  }

  async fulfillRequest(requestId, assetId, companyId, actorId) {
    const company = requireCompany(companyId);
    try {
      await query('CALL sp_asset_fulfill_request(?, ?, ?, ?)', [requestId, assetId, company, actorId || null]);
      return (await this.requests(company)).find(r => Number(r.request_id) === Number(requestId));
    } catch (error) {
      const message = error.sqlMessage || error.message;
      if (message === 'Selected asset does not match the requested category') throw ApiError.badRequest(message);
      if (['Approved asset request not found', 'Selected asset is unavailable'].includes(message)) throw ApiError.conflict(message);
      throw error;
    }
  }

  async maintenance(companyId) {
    const company = requireCompany(companyId);
    const result = await query('CALL sp_asset_maintenance(?)', [company]);
    return result[0];
  }

  async createMaintenance(data, companyId, actorId) {
    const company = requireCompany(companyId);
    try {
      await query('CALL sp_asset_create_maintenance(?, ?, ?, ?, ?)', [
        data.asset_id, data.issue?.trim() || null, data.priority || 'Medium', company, actorId || null
      ]);
      return this.maintenance(company);
    } catch (error) {
      const message = error.sqlMessage || error.message;
      if (message === 'Asset not found') throw ApiError.notFound(message);
      if (message === 'Maintenance issue is required') throw ApiError.badRequest(message);
      if (['Return the assigned asset before sending it for maintenance', 'Retired assets cannot be sent for maintenance', 'This asset already has an active maintenance record'].includes(message)) throw ApiError.conflict(message);
      throw error;
    }
  }

  async updateMaintenance(id, status, notes, companyId, actorId) {
    const company = requireCompany(companyId);
    if (!['In Progress', 'Resolved', 'Cancelled'].includes(status)) throw ApiError.badRequest('Invalid maintenance status');
    try {
      await query('CALL sp_asset_update_maintenance(?, ?, ?, ?, ?)', [id, status, notes || null, company, actorId || null]);
      return this.maintenance(company);
    } catch (error) {
      const message = error.sqlMessage || error.message;
      if (message === 'Maintenance record not found') throw ApiError.notFound(message);
      if (message === 'Maintenance record is already closed') throw ApiError.conflict(message);
      throw error;
    }
  }

  async transfer(assetId, toEmployeeId, remarks, companyId, actorId) {
    const company = requireCompany(companyId);
    try {
      await query('CALL sp_asset_transfer(?, ?, ?, ?, ?)', [assetId, toEmployeeId, remarks || null, company, actorId || null]);
      return this.allocations(company);
    } catch (error) {
      const message = error.sqlMessage || error.message;
      if (message === 'Choose a different employee') throw ApiError.badRequest(message);
      if (message === 'Active target employee not found in this company') throw ApiError.notFound(message);
      if (['Asset must be actively assigned to transfer', 'Active assignment not found'].includes(message)) throw ApiError.conflict(message);
      throw error;
    }
  }

  async transfers(companyId) {
    const company = requireCompany(companyId);
    const result = await query('CALL sp_asset_transfers(?)', [company]);
    return result[0];
  }

  async report(companyId, filters = {}) {
    const company = requireCompany(companyId);
    const type = ['inventory', 'allocations', 'maintenance'].includes(filters.type) ? filters.type : 'inventory';
    const result = await query('CALL sp_asset_report(?, ?, ?, ?, ?, ?)', [
      company, type, filters.categoryId ? Number(filters.categoryId) : null,
      filters.status && filters.status !== 'All' ? filters.status : null,
      filters.fromDate || null, filters.toDate || null
    ]);
    const records = result[0];
    return { type, records, total: records.length };
  }

}
module.exports = new AssetService();
