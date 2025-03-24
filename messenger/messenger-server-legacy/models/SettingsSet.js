const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SettingsSet = sequelize.define('SettingsSet', {
  settings_set_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  theme: {
    type: DataTypes.STRING,
    defaultValue: 'light',
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en',
  },
}, { tableName: 'settings_set', timestamps: false });

module.exports = SettingsSet;
