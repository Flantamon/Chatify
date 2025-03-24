const express = require('express');

const router = express.Router();
const {
  getAllUsers,
  changeUserRole,
  deleteUser,
  getMostActiveUsers,
  getTotalUserCount,
} = require('../controllers/mainAdminController');
const { checkUserPermissions } = require('../utils/permissions');

router.use(checkUserPermissions('main-admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);
router.get('/users/most-active', getMostActiveUsers);
router.get('/users/count', getTotalUserCount);

module.exports = router;
