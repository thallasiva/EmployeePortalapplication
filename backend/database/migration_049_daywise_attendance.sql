-- Check-in/check-out are day-wise. A missing checkout on an earlier date never blocks today.
DROP PROCEDURE IF EXISTS sp_employee_checkin;
DELIMITER $$
CREATE PROCEDURE sp_employee_checkin (
  IN p_employee_id INT, IN p_date DATE, IN p_time TIME, IN p_shift_start TIME,
  IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
)
BEGIN
  DECLARE v_late_minutes INT DEFAULT 0;
  DECLARE v_existing_checkin TIME DEFAULT NULL;
  SELECT check_in INTO v_existing_checkin FROM attendance
   WHERE employee_id=p_employee_id AND attendance_date=p_date LIMIT 1;
  IF v_existing_checkin IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Already checked in for this date';
  END IF;
  IF p_shift_start IS NOT NULL AND p_time > p_shift_start THEN
    SET v_late_minutes=TIME_TO_SEC(TIMEDIFF(p_time,p_shift_start))/60;
  END IF;
  INSERT INTO attendance (employee_id,attendance_date,check_in,status,late_by_minutes,checkin_lat,checkin_lng,checkin_location,source)
  VALUES (p_employee_id,p_date,p_time,IF(v_late_minutes>0,'late','present'),v_late_minutes,p_lat,p_lng,p_location,'web')
  ON DUPLICATE KEY UPDATE check_in=IF(check_in IS NULL,VALUES(check_in),check_in),
    status=IF(check_in IS NULL,VALUES(status),status), late_by_minutes=IF(check_in IS NULL,VALUES(late_by_minutes),late_by_minutes),
    checkin_lat=IF(check_in IS NULL,VALUES(checkin_lat),checkin_lat), checkin_lng=IF(check_in IS NULL,VALUES(checkin_lng),checkin_lng),
    checkin_location=IF(check_in IS NULL,VALUES(checkin_location),checkin_location);
END $$
DELIMITER ;
