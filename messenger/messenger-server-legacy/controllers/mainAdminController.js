const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

exports.getAllUsers = async (req, res) => {
  try {
    logger.info(`Fetching all users and admins for role: ${req.user.role}`);
    const result = await sequelize.query('SELECT * FROM get_all_users_and_admins(:role)', {
      replacements: { role: req.user.role },
      type: sequelize.QueryTypes.SELECT,
    });
    res.json(result);
    logger.info(`Successfully retrieved users for role: ${req.user.role}`);
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.changeUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    logger.info(`User role change requested. User ID: ${id}, New Role: ${role}, Requested by: ${req.user.role}`);

    await sequelize.query('CALL change_user_role(:currentRole, :userId, :newRole)', {
      replacements: {
        currentRole: req.user.role,
        userId: id,
        newRole: role,
      },
      type: sequelize.QueryTypes.RAW,
    });

    logger.info(`User role changed successfully. User ID: ${id}, New Role: ${role}`);
    res.json({ message: `User role successfully changed to ${role}` });
  } catch (error) {
    logger.error(`Error changing user role (User ID: ${id}): ${error.message}`);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    logger.info(`Delete user request received. User ID: ${id}, Requested by: ${req.user.role}`);

    await sequelize.query('CALL delete_user_by_admin(:currentRole, :id)', {
      replacements: {
        currentRole: req.user.role,
        id,
      },
      type: sequelize.QueryTypes.RAW,
    });

    logger.info(`User deleted successfully. User ID: ${id}`);
    res.json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting user (User ID: ${id}): ${error.message}`);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

exports.getMostActiveUsers = async (req, res) => {
  const { role } = req.user;
  const limitCount = req.query.limit || 10;

  try {
    logger.info(`Fetching most active users for role: ${role}, Limit: ${limitCount}`);
    const result = await sequelize.query(
      'SELECT * FROM get_most_active_users(:role, :limitCount)',
      {
        replacements: { role, limitCount },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    logger.info(`Successfully retrieved ${result.length} most active users for role: ${role}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error fetching most active users: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getTotalUserCount = async (req, res) => {
  try {
    logger.info(`Fetching total user count for role: ${req.user.role}`);
    const [result] = await sequelize.query('SELECT * FROM get_total_user_count(:role)', {
      replacements: { role: req.user.role },
      type: sequelize.QueryTypes.SELECT,
    });

    logger.info(`Total user count retrieved: ${result.get_total_user_count}`);
    res.json({ count: result.get_total_user_count });
  } catch (error) {
    logger.error(`Error fetching total user count: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};
