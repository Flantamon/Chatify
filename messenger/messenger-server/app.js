const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mainAdminRoutes = require('./routes/mainAdminRoutes');
const authRoutes = require('./routes/authRoutes');
const authController = require('./controllers/authController');
const { authenticateDatabase } = require('./config/database');

function setup(app) {
  app.use(cors());

  // Middleware
  app.use(bodyParser.json());
  
  // Подключение маршрутов
  app.use('/auth', authRoutes);
  app.use('/user', authController.verifyToken, userRoutes);
  app.use('/admin', authController.verifyToken, adminRoutes);
  app.use('/main-admin', authController.verifyToken, mainAdminRoutes);
  
  // Обработка ошибок
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
  });
  
  // Подключение к базе данных
  authenticateDatabase();
}


module.exports = setup;
