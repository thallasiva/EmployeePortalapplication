CREATE TABLE IF NOT EXISTS rec_interviewer_weekly_availability (
  weekly_availability_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  interviewer_name VARCHAR(200) NOT NULL,
  weekday TINYINT UNSIGNED NOT NULL,
  available_from TIME NOT NULL,
  available_to TIME NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE DEFAULT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (weekly_availability_id),
  KEY idx_rec_weekly_availability (interviewer_name, weekday, effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
