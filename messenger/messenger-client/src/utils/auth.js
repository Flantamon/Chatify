const getToken = () => {
  return localStorage.getItem('accessToken');
};

const getUserIdFromToken = () => {
  const token = getToken();
  if (token) {
    try {
      // Разделяем токен на части
      const payload = token.split('.')[1]; // Получаем часть с полезной нагрузкой
      // Декодируем из Base64
      const decodedPayload = JSON.parse(atob(payload)); // atob декодирует строку Base64
      return decodedPayload.id; // Предполагается, что идентификатор пользователя хранится в поле 'id'
    } catch (error) {
      console.error('Ошибка декодирования токена:', error);
      return null;
    }
  }
  return null;
};

export { getToken, getUserIdFromToken }; 