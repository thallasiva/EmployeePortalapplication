'use strict';














const crypto = require('crypto');
const {
  TOTP,
  NobleCryptoPlugin,
  ScureBase32Plugin,
  generateSecret
} = require('otplib');
const { generateTOTP: buildUri } = require('@otplib/uri');
const QRCode = require('qrcode');
const { encrypt, decrypt } = require('./encryption');

const APP_NAME = process.env.APP_NAME || 'HRMS';


const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  window: 1
});








async function generateMfaSetup(email) {
  const rawSecret = generateSecret(32);

  const otpauthUrl = buildUri({ secret: rawSecret, label: email, issuer: APP_NAME });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
  const encryptedSecret = encrypt(rawSecret);
  return { encryptedSecret, otpauthUrl, qrDataUrl };
}








async function verifyTotp(token, encryptedSecret) {
  if (!token || !encryptedSecret) return false;
  const rawSecret = decrypt(encryptedSecret);
  if (!rawSecret) return false;
  try {
    const result = await totp.verify(String(token).replace(/\s/g, ''), { secret: rawSecret });
    return result?.valid === true;
  } catch {
    return false;
  }
}







function generateBackupCodes() {
  const plainCodes = Array.from({ length: 8 }, () =>
  crypto.randomBytes(5).toString('hex').toUpperCase()
  );
  const hashedCodes = plainCodes.map((c) =>
  crypto.createHash('sha256').update(c).digest('hex')
  );
  return { plainCodes, hashedCodesJson: JSON.stringify(hashedCodes) };
}








function consumeBackupCode(submittedCode, hashedCodesJson) {
  if (!submittedCode || !hashedCodesJson) return { valid: false, updatedJson: hashedCodesJson };
  let hashes;
  try {hashes = JSON.parse(hashedCodesJson);} catch {return { valid: false, updatedJson: hashedCodesJson };}

  const submitted = crypto.createHash('sha256').update(submittedCode.trim().toUpperCase()).digest('hex');
  const idx = hashes.indexOf(submitted);
  if (idx === -1) return { valid: false, updatedJson: hashedCodesJson };

  hashes.splice(idx, 1);
  return { valid: true, updatedJson: JSON.stringify(hashes) };
}

module.exports = { generateMfaSetup, verifyTotp, generateBackupCodes, consumeBackupCode };
