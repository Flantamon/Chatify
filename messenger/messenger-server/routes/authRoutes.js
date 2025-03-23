const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Роуты для авторизации и регистрации
router.post('/register', authController.register); // Регистрация
router.post('/login', authController.login); // Авторизация

module.exports = router;
