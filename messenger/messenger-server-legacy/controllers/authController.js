/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-vars */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { User, SettingsSet } = require('../models'); // Убедитесь, что путь к модели User корректен
require('dotenv').config(); // Для использования переменных окружения, таких как секрет JWT
const logger = require('../utils/logger');

// Регистрация нового пользователя
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    logger.info(`User registration attempt: ${email}`);

    const [newUser] = await sequelize.query(
      'SELECT * FROM register_user(:username, :email, :password, :role)',
      {
        replacements: {
          username, email, password, role: 'user',
        },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const settingsSet = new SettingsSet({ user_id: newUser.user_id });
    await settingsSet.save();

    logger.info(`User registered successfully: ${email} (ID: ${newUser.user_id})`);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    logger.error(`User registration failed for ${req.body.email}: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// Аутентификация пользователя
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info(`Login attempt: ${email}`);

    const [user] = await sequelize.query(
      'SELECT * FROM authenticate_user(:email, :password)',
      {
        replacements: { email, password },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (!user) {
      logger.warn(`Failed login attempt: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: '360d' },
    );

    logger.info(`User logged in successfully: ${email}`);
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.user_name,
        email: user.user_email,
        role: user.user_role,
        status: user.user_status,
      },
    });
  } catch (err) {
    logger.error(`Login error for user ${req.body.email}: ${err.message}`);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware для проверки токена
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    logger.warn('Unauthorized access attempt (no token provided)');
    return res.status(403).json({ message: 'Token not provided' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    logger.info(`Token verified successfully, user ID: ${decoded.id}`);
    return next();
  } catch (err) {
    logger.error(`Token verification failed: ${err.message}`);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
