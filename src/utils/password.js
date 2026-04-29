const crypto = require("crypto");

const iterations = 120000;
const keyLength = 32;
const digest = "sha256";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, iterations, keyLength, digest).toString("hex");
  return `${iterations}:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return true;

  const [storedIterations, salt, hash] = String(storedHash).split(":");
  if (!storedIterations || !salt || !hash) return false;

  const candidate = crypto
    .pbkdf2Sync(String(password), salt, Number(storedIterations), keyLength, digest)
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

module.exports = {
  hashPassword,
  verifyPassword
};
