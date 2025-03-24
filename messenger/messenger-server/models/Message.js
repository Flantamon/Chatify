const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  receiver_channel_id: {
    type: DataTypes.INTEGER,
  },
  receiver_user_id: {
    type: DataTypes.INTEGER,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
  },
  text: {
    type: DataTypes.STRING,
  },
  file_name: {
    type: DataTypes.STRING,
  },
  file_content: {
    type: DataTypes.TEXT,
  },
  file_url: {
    type: DataTypes.STRING,
  },
  file_type: {
    type: DataTypes.STRING(50),
  },
  file_size: {
    type: DataTypes.INTEGER,
  },
}, { tableName: 'message', timestamps: false });

module.exports = Message;
