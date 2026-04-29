const AppError = require("./AppError");

function required(value, field) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new AppError(`Campo obrigatorio: ${field}.`);
  }
}

function toPositiveNumber(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`${field} deve ser um numero maior ou igual a zero.`);
  }
  return parsed;
}

function toNonNegativeInteger(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError(`${field} deve ser um inteiro maior ou igual a zero.`);
  }
  return parsed;
}

module.exports = {
  required,
  toPositiveNumber,
  toNonNegativeInteger
};
