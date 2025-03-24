const checkUserPermissions = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).send({ error: 'Access denied' });
  }
  return next();
};

module.exports = { checkUserPermissions };
