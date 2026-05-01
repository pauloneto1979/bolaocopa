const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { verifyToken } = require("../utils/jwt");

function getPoolId(req) {
  return req.params.poolId || req.body.poolId || req.query.poolId;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return next(new AppError("Autenticacao obrigatoria.", 401));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

function requirePoolRole(roles, options = {}) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const allowPending = Boolean(options.allowPending);

  return async (req, res, next) => {
    try {
      if (!req.user?.id) throw new AppError("Autenticacao obrigatoria.", 401);

      const poolId = options.poolIdFrom ? options.poolIdFrom(req) : getPoolId(req);
      if (!poolId) throw new AppError("poolId obrigatorio para validar permissao.", 400);

      const member = await prisma.poolMember.findUnique({
        where: {
          poolId_userId: {
            poolId,
            userId: req.user.id
          }
        },
        include: { pool: true }
      });

      if (!member) throw new AppError("Usuario nao participa deste bolao.", 403);
      if (member.status === "BLOCKED") throw new AppError("Usuario bloqueado neste bolao.", 403);
      if (!allowPending && member.status !== "ACTIVE") {
        throw new AppError("Usuario pendente nao pode executar esta acao.", 403);
      }
      if (!allowedRoles.includes(member.role)) {
        throw new AppError("Perfil sem permissao para esta acao.", 403);
      }

      req.poolMember = member;
      req.pool = member.pool;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  requireAuth,
  requirePoolRole,
  getPoolId
};
