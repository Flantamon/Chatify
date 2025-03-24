/* eslint-disable camelcase */
const multer = require('multer');
const path = require('path');
const { sequelize } = require('../config/database');
const { broadcastMessage } = require('../wss');
const logger = require('../utils/logger');

const getMessages = async (req, res) => {
  let additionalQuery = {};
  if (req.query.receiver_user_id) {
    additionalQuery = { receiver_user_id: req.query.receiver_user_id };
  }
  if (req.query.receiver_channel_id) {
    additionalQuery = { receiver_channel_id: req.query.receiver_channel_id };
  }
  try {
    logger.info(`Fetching messages for user ${req.user.id} with filters: ${JSON.stringify(additionalQuery)}`);

    const messages = await sequelize.query(
      'select * from getmessages(:userId, :additionalQuery)',
      {
        replacements: { userId: req.user.id, additionalQuery: JSON.stringify(additionalQuery) },
        type: sequelize.QueryTypes.RAW,
      },
    );

    logger.info(`Fetched ${messages[0].length} messages`);
    res.json(messages[0]);
  } catch (err) {
    logger.error(`Error fetching messages: ${err.message}`);
    res.status(500).send({ error: 'Error fetching messages' });
  }
};

const getChannels = async (req, res) => {
  try {
    logger.info('Fetching channels...');

    const channels = await sequelize.query('select * from getchannels()', {
      type: sequelize.QueryTypes.RAW,
    });

    logger.info(`Fetched ${channels[0].length} channels`);
    res.json(channels[0]);
  } catch (err) {
    logger.error(`Error fetching channels: ${err.message}`);
    res.status(500).send({ error: 'Error fetching channels' });
  }
};

const getContacts = async (req, res) => {
  try {
    logger.info(`Fetching contacts for user ${req.user.id}`);

    const contacts = await sequelize.query('select * from getcontacts(:userId)', {
      replacements: { userId: +req.user.id },
      type: sequelize.QueryTypes.RAW,
    });

    logger.info(`Fetched ${contacts[0].length} contacts`);
    res.json(contacts[0]);
  } catch (err) {
    logger.error(`Error fetching contacts: ${err.message}`);
    res.status(500).send({ error: 'Error fetching contacts' });
  }
};

const getSettings = async (req, res) => {
  try {
    logger.info(`Fetching settings for user ${req.user.id}`);

    const settings = await sequelize.query('select * from getsettings(:userId)', {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.RAW,
    });

    logger.info('Settings fetched successfully');
    res.json(settings[0]);
  } catch (err) {
    logger.error(`Error fetching settings: ${err.message}`);
    res.status(500).send({ error: 'Error fetching settings' });
  }
};

const updateSettings = async (req, res) => {
  const { theme, language } = req.body;
  try {
    logger.info(`Updating settings for user ${req.user.id} - Theme: ${theme}, Language: ${language}`);

    await sequelize.query('select * from updatesettings(:userId, :theme, :language)', {
      replacements: { userId: req.user.id, theme, language },
      type: sequelize.QueryTypes.RAW,
    });

    logger.info('Settings updated successfully');
    res.sendStatus(204);
  } catch (err) {
    logger.error(`Error updating settings: ${err.message}`);
    res.status(500).send({ error: 'Error updating settings' });
  }
};

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      return cb(new Error('Аудио и видео файлы не поддерживаются'));
    }
    return cb(null, true);
  },
}).single('file');

// Модифицируем функцию addMessage
const addMessage = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          logger.error(`File upload error: ${err.message}`);
          return reject(err);
        }
        return resolve();
      });
    });

    const { receiver_user_id, receiver_channel_id, text } = req.body;
    logger.info(`Adding message from user ${req.user.id}`);

    const fileData = req.file ? {
      file_url: `/uploads/${req.file.filename}`,
      file_name: req.file.originalname,
      file_type: req.file.mimetype,
      file_size: req.file.size,
    } : null;

    const [[body]] = await sequelize.query(
      'SELECT * FROM AddMessageWithFile(:senderId, :receiverUserId, :receiverChannelId, :text, :fileUrl, :fileName, :fileType, :fileSize)',
      {
        replacements: {
          senderId: req.user.id,
          receiverUserId: receiver_user_id || null,
          receiverChannelId: receiver_channel_id || null,
          text: text || null,
          fileUrl: fileData && fileData.file_url ? fileData.file_url : null,
          fileName: fileData && fileData.file_name ? fileData.file_name : null,
          fileType: fileData && fileData.file_type ? fileData.file_type : null,
          fileSize: fileData && fileData.file_size ? fileData.file_size : null,
        },
        type: sequelize.QueryTypes.RAW,
      },
    );

    const newMessage = {
      id: body.message_id,
      sender_id: body.sender_id_out,
      sender_name: body.sender_name,
      receiver_channel_id: body.receiver_channel_id_out,
      receiver_user_id: body.receiver_user_id_out,
      created_at: body.created_at_out,
      text: body.text_out,
      ...fileData,
    };

    logger.info(`Message added successfully: ${JSON.stringify(newMessage)}`);
    broadcastMessage({ operation: 'create', data: newMessage });
    return res.status(201).send(newMessage);
  } catch (err) {
    logger.error(`Error adding message: ${err.message}`);
    return res.status(500).send({ error: 'Error adding message' });
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  try {
    logger.info(`Deleting message with ID: ${messageId}`);

    await sequelize.query('SELECT * FROM deletemessage(:messageId)', {
      replacements: { messageId },
      type: sequelize.QueryTypes.RAW,
    });

    broadcastMessage({ operation: 'delete', data: { messageId } });
    logger.info('Message deleted successfully');
    res.sendStatus(204);
  } catch (err) {
    logger.error(`Error deleting message: ${err.message}`);
    res.status(500).send({ error: 'Error deleting message' });
  }
};

const updateMessage = async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;

  try {
    logger.info(`Updating message ID: ${messageId}, New text: "${text}"`);

    const [[body]] = await sequelize.query(
      'SELECT * FROM updatemessage(:messageId, :text)',
      {
        replacements: { messageId, text },
        type: sequelize.QueryTypes.RAW,
      },
    );

    const updatedMessage = {
      id: body.message_id,
      text: body.text_out,
      updated_at: body.updated_at,
    };

    broadcastMessage({ operation: 'update', data: updatedMessage });

    logger.info(`Message updated successfully: ${JSON.stringify(updatedMessage)}`);
    res.status(200).send(updatedMessage);
  } catch (err) {
    logger.error(`Error updating message ID ${messageId}: ${err.message}`);
    res.status(500).send({ error: 'Error updating message' });
  }
};

const searchUsers = async (req, res) => {
  const { searchTerm } = req.query;
  try {
    logger.info(`Searching users with term: ${searchTerm}`);

    const users = await sequelize.query('select * from searchusers(:searchTerm)', {
      replacements: { searchTerm },
      type: sequelize.QueryTypes.RAW,
    });

    logger.info(`Found ${users[0].length} users`);
    res.json(users[0]);
  } catch (err) {
    logger.error(`Error searching users: ${err.message}`);
    res.status(500).send({ error: 'Error searching users' });
  }
};

const addContact = async (req, res) => {
  const { userId } = req.body;

  try {
    logger.info(`Adding contact for user ${req.user.id}, Contact ID: ${userId}`);

    await sequelize.query('select * from addcontact(:userId, :contactId)', {
      replacements: { userId: req.user.id, contactId: userId },
      type: sequelize.QueryTypes.RAW,
    });

    logger.info(`Contact added successfully: User ${req.user.id} -> Contact ${userId}`);
    res.sendStatus(204);
  } catch (err) {
    logger.error(`Error adding contact for user ${req.user.id}: ${err.message}`);
    res.status(500).send({ error: 'Error adding contact' });
  }
};

const deleteContact = async (req, res) => {
  const { userId } = req.body;

  try {
    logger.info(`Deleting contact for user ${req.user.id}, Contact ID: ${userId}`);

    await sequelize.query('select * from deletecontact(:userId, :contactId)', {
      replacements: { userId: req.user.id, contactId: userId },
      type: sequelize.QueryTypes.RAW,
    });

    logger.info(`Contact deleted successfully: User ${req.user.id} -> Contact ${userId}`);
    res.sendStatus(204);
  } catch (err) {
    logger.error(`Error deleting contact for user ${req.user.id}: ${err.message}`);
    res.status(500).send({ error: 'Error deleting contact' });
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
  updateMessage,
};
