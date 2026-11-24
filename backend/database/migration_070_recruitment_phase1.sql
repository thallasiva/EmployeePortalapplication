ALTER TABLE rec_interviews
  MODIFY COLUMN interview_type ENUM('Video Call','Phone','In-Person','Teams','GoogleMeet','Zoom') NOT NULL DEFAULT 'Video Call',
  ADD COLUMN feedback_rating TINYINT UNSIGNED NULL;

CREATE TABLE IF NOT EXISTS rec_interviewer_availability (
  availability_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  interviewer_name VARCHAR(200) NOT NULL,
  available_from DATETIME NOT NULL,
  available_to DATETIME NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (availability_id),
  KEY idx_rec_availability_interviewer_time (interviewer_name, available_from, available_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rec_candidate_followups (
  followup_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  candidate_id INT NOT NULL,
  assigned_to INT NOT NULL,
  due_at DATETIME NOT NULL,
  note TEXT NOT NULL,
  status ENUM('open','completed','cancelled') NOT NULL DEFAULT 'open',
  reminder_sent_at DATETIME DEFAULT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME DEFAULT NULL,
  PRIMARY KEY (followup_id),
  KEY idx_rec_followup_candidate (candidate_id, status, due_at),
  KEY idx_rec_followup_reminder (status, due_at, reminder_sent_at),
  CONSTRAINT fk_rec_followup_candidate
    FOREIGN KEY (candidate_id) REFERENCES rec_candidates (candidate_id),
  CONSTRAINT fk_rec_followup_assignee
    FOREIGN KEY (assigned_to) REFERENCES employees (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rec_interview_reminder_log (
  reminder_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  interview_id INT NOT NULL,
  reminder_type ENUM('24h','1h') NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (reminder_id),
  UNIQUE KEY uq_rec_interview_reminder (interview_id, reminder_type),
  CONSTRAINT fk_rec_interview_reminder
    FOREIGN KEY (interview_id) REFERENCES rec_interviews (interview_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
