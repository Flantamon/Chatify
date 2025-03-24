const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

exports.getAllUsers = async (req, res) => {
  try {
    logger.info(`Fetching all users for role: ${req.user.role}`);
    const result = await sequelize.query('SELECT * FROM get_all_users(:role)', {
      replacements: { role: req.user.role },
      type: sequelize.QueryTypes.SELECT,
    });
    res.json(result);
    logger.info(`Successfully retrieved ${result.length} users.`);
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.blockUser = async (req, res) => {
  const { id } = req.params;
  try {
    logger.info(`Blocking user. User ID: ${id}, Requested by: ${req.user.role}`);
    await sequelize.query('CALL block_user(:role, :userId)', {
      replacements: {
        role: req.user.role,
        userId: id,
      },
      type: sequelize.QueryTypes.RAW,
    });
    logger.info(`User ID: ${id} successfully blocked.`);
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    logger.error(`Error blocking user (User ID: ${id}): ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  const { id } = req.params;
  try {
    logger.info(`Unblocking user. User ID: ${id}, Requested by: ${req.user.role}`);
    await sequelize.query('CALL unblock_user(:role, :userId)', {
      replacements: {
        role: req.user.role,
        userId: id,
      },
      type: sequelize.QueryTypes.RAW,
    });
    logger.info(`User ID: ${id} successfully unblocked.`);
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    logger.error(`Error unblocking user (User ID: ${id}): ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.getChannels = async (req, res) => {
  try {
    logger.info('Fetching all channels.');
    const result = await sequelize.query('SELECT * FROM GetChannels()', {
      type: sequelize.QueryTypes.SELECT,
    });
    res.json(result);
    logger.info(`Successfully retrieved ${result.length} channels.`);
  } catch (error) {
    logger.error(`Error fetching channels: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.addChannel = async (req, res) => {
  const { name, tag } = req.body;
  try {
    logger.info(`Adding channel. Name: ${name}, Tag: ${tag}, Requested by: ${req.user.role}`);
    await sequelize.query('CALL add_channel(:role, :name, :tag)', {
      replacements: {
        role: req.user.role,
        name,
        tag,
      },
      type: sequelize.QueryTypes.RAW,
    });
    logger.info(`Channel '${name}' successfully added.`);
    res.json({ message: 'Channel added successfully' });
  } catch (error) {
    logger.error(`Error adding channel (Name: ${name}): ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.editChannel = async (req, res) => {
  const { id } = req.params;
  const { name, tag } = req.body;
  try {
    logger.info(`Editing channel. Channel ID: ${id}, Name: ${name}, Tag: ${tag}, Requested by: ${req.user.role}`);
    await sequelize.query('CALL edit_channel(:role, :channelId, :name, :tag)', {
      replacements: {
        role: req.user.role,
        channelId: id,
        name,
        tag,
      },
      type: sequelize.QueryTypes.RAW,
    });
    logger.info(`Channel ID: ${id} successfully updated.`);
    res.json({ message: 'Channel updated successfully' });
  } catch (error) {
    logger.error(`Error editing channel (Channel ID: ${id}): ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteChannel = async (req, res) => {
  const { id } = req.params;
  try {
    logger.info(`Deleting channel. Channel ID: ${id}, Requested by: ${req.user.role}`);
    await sequelize.query('CALL delete_channel(:role, :channelId)', {
      replacements: {
        role: req.user.role,
        channelId: id,
      },
      type: sequelize.QueryTypes.RAW,
    });
    logger.info(`Channel ID: ${id} successfully deleted.`);
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting channel (Channel ID: ${id}): ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
