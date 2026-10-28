USE hrms_db;
UPDATE users SET 
  password_hash = '$2b$10$7d7tY9j89EC1LCT3j3JYG.qyTuXA/UguIhas0z2nX/TjdaI2mGWXq',
  status = 'Active',
  failed_login_attempts = 0,
  locked_until = NULL
WHERE email = 'admin@yopmail.com';
SELECT email, status, LEFT(password_hash,20) as hash_preview, failed_login_attempts FROM users WHERE email = 'admin@yopmail.com';
