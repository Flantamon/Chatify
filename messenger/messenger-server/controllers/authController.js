const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { User, SettingsSet } = require('../models'); // Убедитесь, что путь к модели User корректен
require('dotenv').config(); // Для использования переменных окружения, таких как секрет JWT

// Регистрация нового пользователя
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const [newUser] = await sequelize.query(
      'SELECT * FROM register_user(:username, :email, :password, :role)',
      {
        replacements: {
          username,
          email,
          password,
          role: 'user'
        },
        type: sequelize.QueryTypes.SELECT
      }
    );
    const settingsSet = new SettingsSet({ // Предполагается, что модель SettingsSet импортирована
      user_id: newUser.user_id, // Связываем настройки с пользователем
      // Добавьте другие необходимые поля для settings_set
    });

    await settingsSet.save(); // Сохраняем настройки


    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Авторизация пользователя
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await sequelize.query(
      'SELECT * FROM authenticate_user(:email, :password)',
      {
        replacements: { email, password },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Если пользователь не найден или пароль неверный
    if (!user) {
      return res.status(401).json({ 
        message: 'Неверный email или пароль' 
      });
    }

    // Генерация JWT
    const token = jwt.sign(
      { id: user.user_id, role: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: '360d' }
    );

    res.status(200).json({
      message: 'Авторизация успешна',
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
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Middleware для проверки токена
exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET); // Уберите "Bearer", если он есть
    req.user = decoded; // Добавляем декодированную информацию в запрос
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Неверный или истёкший токен' });
  }
};
