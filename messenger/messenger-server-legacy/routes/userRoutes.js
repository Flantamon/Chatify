const express = require('express');
const {
  // eslint-disable-next-line max-len
  getMessages, addMessage, deleteMessage, updateMessage, getContacts, getChannels, getSettings, updateSettings, searchUsers, addContact, deleteContact,
} = require('../controllers/userController');
const { checkUserPermissions } = require('../utils/permissions');

const router = express.Router();

router.get('/settings', checkUserPermissions('user'), getSettings);
router.put('/settings', checkUserPermissions('user'), updateSettings);

router.get('/contacts', checkUserPermissions('user'), getContacts);
router.post('/contacts', checkUserPermissions('user'), addContact);
router.delete('/contacts', checkUserPermissions('user'), deleteContact);

router.get('/channels', checkUserPermissions('user'), getChannels);

router.get('/users', checkUserPermissions('user'), searchUsers);

router.get('/messages', checkUserPermissions('user'), getMessages);
router.post('/messages', checkUserPermissions('user'), addMessage);
router.put('/messages/:messageId', checkUserPermissions('user'), updateMessage);
router.delete('/messages/:messageId', checkUserPermissions('user'), deleteMessage);

module.exports = router;
