-- ============================================================================
--  FIX: "Illegal mix of collations (utf8mb4_unicode_ci, utf8mb4_0900_ai_ci)"
--  Your tables are utf8mb4_unicode_ci, but MySQL 8's stored procedures &
--  parameters default to utf8mb4_0900_ai_ci. This converts the database and
--  EVERY table to utf8mb4_0900_ai_ci so nothing clashes with the procedures.
--
--  Run in MySQL Workbench -> Execute All.  Run it ONCE, then restart the backend.
--  CONVERT TO keeps your data; it only changes collation metadata.
-- ============================================================================

-- 1) Database default -> MySQL 8 native collation
ALTER DATABASE `hrms_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 2) Convert every base table in one pass
DROP PROCEDURE IF EXISTS _fix_collation_all;
DELIMITER $$
CREATE PROCEDURE _fix_collation_all()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE tbl VARCHAR(255);
  DECLARE cur CURSOR FOR
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'hrms_db' AND table_type = 'BASE TABLE';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO tbl;
    IF done = 1 THEN LEAVE read_loop; END IF;
    SET @s = CONCAT('ALTER TABLE `', tbl,
                    '` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END LOOP;
  CLOSE cur;
END$$
DELIMITER ;

CALL _fix_collation_all();
DROP PROCEDURE _fix_collation_all;

-- 3) Verify — should return NO rows (nothing left on the old collation)
SELECT table_name, table_collation
FROM information_schema.tables
WHERE table_schema = 'hrms_db'
  AND table_collation <> 'utf8mb4_0900_ai_ci'
  AND table_type = 'BASE TABLE';
