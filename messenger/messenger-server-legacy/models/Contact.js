const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  owner_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  contact_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, { tableName: 'contact', timestamps: false });

// Определение ассоциаций
Contact.belongsTo(User, { foreignKey: 'owner_user_id', as: 'owner' }); // Связь с владельцем
Contact.belongsTo(User, { foreignKey: 'contact_user_id', as: 'contact' }); // Связь с контактом

module.exports = Contact;
