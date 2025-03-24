/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mainAdminRoutes = require('./routes/mainAdminRoutes');
const authRoutes = require('./routes/authRoutes');
const authController = require('./controllers/authController');
const { authenticateDatabase } = require('./config/database');
const { swaggerUi, swaggerDocs } = require('./utils/swagger');
const logger = require('./utils/logger');

function setup(app) {
  app.use(cors());

  // Middleware
  app.use(bodyParser.json());

  // Добавляем статическую директорию для файлов
  app.use('/uploads', express.static('uploads'));

  // Подключение маршрутов
  app.use('/auth', authRoutes);
  app.use('/user', authController.verifyToken, userRoutes);
  app.use('/admin', authController.verifyToken, adminRoutes);
  app.use('/main-admin', authController.verifyToken, mainAdminRoutes);

  // Swagger UI доступен по адресу /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  // Обработка ошибок
  app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    res.status(500).send({ error: 'Something went wrong!' });
    return next();
  });

  // Подключение к базе данных
  authenticateDatabase();
}

module.exports = setup;
