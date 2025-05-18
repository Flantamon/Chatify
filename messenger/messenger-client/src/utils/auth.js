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

const isTokenExpired = (token = getToken()) => {
  if (!token) return true;
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

const removeToken = () => {
  localStorage.removeItem('accessToken');
};

export { getToken, getUserIdFromToken, isTokenExpired, removeToken }; 