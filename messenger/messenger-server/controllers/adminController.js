const { sequelize } = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await sequelize.query('SELECT * FROM get_all_users(:role)', {
      replacements: { role: req.user.role },
      type: sequelize.QueryTypes.SELECT
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.blockUser = async (req, res) => {
  const { id } = req.params;
  try {
    await sequelize.query('CALL block_user(:role, :userId)', {
      replacements: { 
        role: req.user.role,
        userId: id 
      },
      type: sequelize.QueryTypes.RAW
    });
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  const { id } = req.params;
  try {
    await sequelize.query('CALL unblock_user(:role, :userId)', {
      replacements: { 
        role: req.user.role,
        userId: id 
      },
      type: sequelize.QueryTypes.RAW
    });
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getChannels = async (req, res) => {
  try {
    const result = await sequelize.query('SELECT * FROM GetChannels()', {
      type: sequelize.QueryTypes.SELECT
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.addChannel = async (req, res) => {
  const { name, tag } = req.body;
  try {
    await sequelize.query('CALL add_channel(:role, :name, :tag)', {
      replacements: { 
        role: req.user.role,
        name,
        tag 
      },
      type: sequelize.QueryTypes.RAW
    });
    res.json({ message: 'Channel added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.editChannel = async (req, res) => {
  const { id } = req.params;
  const { name, tag } = req.body;
  try {
    await sequelize.query('CALL edit_channel(:role, :channelId, :name, :tag)', {
      replacements: { 
        role: req.user.role,
        channelId: id,
        name,
        tag 
      },
      type: sequelize.QueryTypes.RAW
    });
    res.json({ message: 'Channel updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteChannel = async (req, res) => {
  const { id } = req.params;
  try {
    await sequelize.query('CALL delete_channel(:role, :channelId)', {
      replacements: { 
        role: req.user.role,
        channelId: id 
      },
      type: sequelize.QueryTypes.RAW
    });
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};