const express = require('express');

const router = express.Router();
const {
  getAllUsers,
  blockUser,
  unblockUser,
  getChannels,
  addChannel,
  editChannel,
  deleteChannel,
} = require('../controllers/adminController');
const { checkUserPermissions } = require('../utils/permissions');

router.use(checkUserPermissions('admin'));

// Маршруты для работы с пользователями
router.get('/users', getAllUsers);
router.post('/users/:id/block', blockUser);
router.post('/users/:id/unblock', unblockUser);

// Маршруты для работы с каналами
router.get('/channels', getChannels);
router.post('/channels', addChannel);
router.put('/channels/:id', editChannel);
router.delete('/channels/:id', deleteChannel);

module.exports = router;
