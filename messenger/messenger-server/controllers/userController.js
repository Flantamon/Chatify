const { sequelize } = require('../config/database');
const { broadcastMessage } = require('../wss');

const getMessages = async (req, res) => {
  let additionalQuery = {};
  if (req.query.receiver_user_id) {
    additionalQuery = {
      receiver_user_id: req.query.receiver_user_id
    };
  }
  if (req.query.receiver_channel_id) {
    additionalQuery = {
      receiver_channel_id: req.query.receiver_channel_id
    };
  }
  try {
    const messages = await sequelize.query('select * from getmessages(:userId, :additionalQuery)', {
      replacements: { userId: req.user.id, additionalQuery: JSON.stringify(additionalQuery) },
      type: sequelize.QueryTypes.RAW
    });
    res.json(messages[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error fetching messages'
    });
  }
};

const getChannels = async (req, res) => {
  try {
    const channels = await sequelize.query('select * from getchannels()', {
      type: sequelize.QueryTypes.RAW
    });
    res.json(channels[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error fetching channels'
    });
  }
};

const getContacts = async (req, res) => {
  try {
    const contacts = await sequelize.query('select * from getcontacts(:userId)', {
      replacements: { userId: +req.user.id },
      type: sequelize.QueryTypes.RAW
    });
    res.json(contacts[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error fetching contacts'
    });
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await sequelize.query('select * from getsettings(:userId)', {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.RAW
    });
    res.json(settings[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error fetching settings'
    });
  }
};

const updateSettings = async (req, res) => {
  const { theme, language } = req.body;
  try {
    await sequelize.query('select * from updatesettings(:userId, :theme, :language)', {
      replacements: { userId: req.user.id, theme, language },
      type: sequelize.QueryTypes.RAW
    });
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error updating settings'
    });
  }
};

const addMessage = async (req, res) => {
  const { receiver_user_id, receiver_channel_id, text } = req.body;
  try {
    const [[body]] = await sequelize.query('select * from addmessage(:senderId, :receiverUserId, :receiverChannelId, :text)', {
      replacements: { senderId: req.user.id, receiverUserId: receiver_user_id || null, receiverChannelId: receiver_channel_id || null, text },
      type: sequelize.QueryTypes.RAW
    });
    const newMessage = {id: body.message_id, sender_id: body.sender_id_out, sender_name: body.sender_name, receiver_channel_id: body.receiver_channel_id_out, receiver_user_id: body.receiver_user_id_out, created_at: body.created_at_out, text: body.text_out};
    broadcastMessage({ operation: 'create', data: newMessage});
    res.status(201).send(newMessage);
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: 'Error adding message'
    });
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  try {
    await sequelize.query('SELECT * FROM deletemessage(:messageId)', {
      replacements: { messageId },
      type: sequelize.QueryTypes.RAW
    });
    broadcastMessage({ operation: 'delete', data: { messageId }});
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error deleting message'
    });
  }
};

const updateMessage = async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  console.log(messageId);
  try {
    const [[body]] = await sequelize.query('SELECT * FROM updatemessage(:messageId, :text)', {
      replacements: { messageId, text },
      type: sequelize.QueryTypes.RAW
    });
    broadcastMessage({ operation: 'update', data: {id: messageId, text}});
    res.status(200).send({
      id: body.message_id,
      text: body.text_out,
      updated_at: body.updated_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error editing message'
    });
  }
};

const searchUsers = async (req, res) => {
  const { searchTerm } = req.query;
  try {
    const users = await sequelize.query('select * from searchusers(:searchTerm)', {
      replacements: { searchTerm },
      type: sequelize.QueryTypes.RAW
    });
    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error searching users'
    });
  }
};

const addContact = async (req, res) => {
  const { userId } = req.body;
  try {
    await sequelize.query('select * from addcontact(:userId, :contactId)', {
      replacements: { userId: req.user.id, contactId: userId },
      type: sequelize.QueryTypes.RAW
    });
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error adding contact'
    });
  }
};

const deleteContact = async (req, res) => {
  const { userId } = req.body;
  try {
    await sequelize.query('select * from deletecontact(:userId, :contactId)', {
      replacements: { userId: req.user.id, contactId: userId },
      type: sequelize.QueryTypes.RAW
    });
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: 'Error deleting contact'
    });
  }
};

module.exports = {
  getMessages,
  getContacts,
  getChannels,
  getSettings,
  updateSettings,
  searchUsers,
  addContact,
  deleteContact,
  addMessage,
  deleteMessage,
  updateMessage
};