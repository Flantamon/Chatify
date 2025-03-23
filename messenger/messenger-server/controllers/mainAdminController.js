const { sequelize } = require('../config/database');

exports.getAllUsers = async (req, res) => {
    try {
      const result = await sequelize.query('SELECT * FROM get_all_users_and_admins(:role)', {
          replacements: { role: req.user.role },
          type: sequelize.QueryTypes.SELECT
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  exports.changeUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
      await sequelize.query('CALL change_user_role(:currentRole, :userId, :newRole)', {
        replacements: { 
          currentRole: req.user.role,
          userId: id,
          newRole: role
        },
        type: sequelize.QueryTypes.RAW
      });
      res.json({ message: `User role successfully changed to ${role}` });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  };

  exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
      await sequelize.query('CALL delete_user_by_admin(:currentRole, :id)', {
        replacements: { 
          currentRole: req.user.role,
          id: id 
        },
        type: sequelize.QueryTypes.RAW
      });
      res.json({ message: 'User and all related data deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  };

  exports.getMostActiveUsers = async (req, res) => {
    const { role } = req.user;
    const limitCount = req.query.limit || 10; 
  
    try {
      const result = await sequelize.query(
        'SELECT * FROM get_most_active_users(:role, :limitCount)', 
        {
          replacements: { role, limitCount },
          type: sequelize.QueryTypes.SELECT
        }
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  exports.getTotalUserCount = async (req, res) => {
    try {
      const [result] = await sequelize.query('SELECT * FROM get_total_user_count(:role)', {
        replacements: { role: req.user.role },
        type: sequelize.QueryTypes.SELECT
      });
      res.json({ count: result.get_total_user_count });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };