import React, { useState, useEffect } from 'react';

const ProfileSettings = ({ onClose, onSave, currentTheme, currentLanguage }) => {
  // Для отслеживания изменений до сохранения
  const [tempTheme, setTempTheme] = useState(currentTheme);
  const [tempLanguage, setTempLanguage] = useState(currentLanguage);

  // Эффект для синхронизации при первом открытии
  useEffect(() => {
    setTempTheme(currentTheme);
    setTempLanguage(currentLanguage);
  }, [currentTheme, currentLanguage]);

  const handleSave = () => {
    // Сохраняем изменения
    onSave(tempTheme || currentTheme, tempLanguage || currentLanguage);
    onClose(); // Закрываем окно после сохранения
  };

  const handleCancel = () => {
    setTempTheme(currentTheme);
    setTempLanguage(currentLanguage);
    onClose(); // Закрываем окно без изменений
  };

  return (
    <div className={`profile-settings ${currentTheme === 'dark' ? 'dark' : ''}`}>
      <h2>{currentLanguage === 'en' ? 'Profile Settings' : 'Настройки Профиля'}</h2>
      <div className="settings-content">
        <div className="setting-item">
          <label>{currentLanguage === 'en' ? 'Theme' : 'Тема'}</label>
          <select 
            value={tempTheme} 
            onChange={(e) => setTempTheme(e.target.value)}
          >
            <option value="light">{currentLanguage === 'en' ? 'Light' : 'Светлая'}</option>
            <option value="dark">{currentLanguage === 'en' ? 'Dark' : 'Темная'}</option>
          </select>
        </div>
        
        <div className="setting-item">
          <label>{currentLanguage === 'en' ? 'Language' : 'Язык'}</label>
          <select 
            value={tempLanguage} 
            onChange={(e) => setTempLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </div>
      </div>
      
      <div className="settings-buttons">
        <button onClick={handleSave}>
          {currentLanguage === 'en' ? 'Save' : 'Сохранить'}
        </button>
        <button className="cancel" onClick={handleCancel}>
          {currentLanguage === 'en' ? 'Cancel' : 'Отменить'}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
