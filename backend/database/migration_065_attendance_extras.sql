-- Migration 065: attendance geofence configuration and overtime approval requests.
ALTER TABLE offices
  ADD COLUMN IF NOT EXISTS geo_latitude DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS geo_longitude DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS geo_radius_meters INT UNSIGNED NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS geo_fence_enabled TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS overtime_requests (
  overtime_request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  company_id INT NOT NULL,
  work_date DATE NOT NULL,
  overtime_minutes INT UNSIGNED NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  reviewed_by INT DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  remarks VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_overtime_company_status_date (company_id, status, work_date),
  CONSTRAINT fk_overtime_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_overtime_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  CONSTRAINT fk_overtime_reviewer FOREIGN KEY (reviewed_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
