const crypto = require("crypto");
const AppError = require("./AppError");

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError("JWT_SECRET nao configurado.", 500);
  return secret;
}

function signToken(payload, options = {}) {
  const expiresInSeconds = options.expiresInSeconds || 60 * 60 * 12;
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const content = base64Url(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(`${header}.${content}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${content}.${signature}`;
}

function verifyToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new AppError("Token invalido.", 401);

  const [header, content, signature] = parts;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(`${header}.${content}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new AppError("Token invalido.", 401);
  }

  const payload = JSON.parse(decodeBase64Url(content));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError("Token expirado.", 401);
  }

  return payload;
}

module.exports = {
  signToken,
  verifyToken
};
