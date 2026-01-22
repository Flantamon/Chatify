import React, { useState, useEffect } from 'react';
import useTranslation from '../hooks/useTranslation';

const ProfileSettings = ({ onClose, onSave, currentTheme, currentLanguage, children }) => {
  const { t } = useTranslation(currentLanguage);
  const [tempTheme, setTempTheme] = useState(currentTheme);
  const [tempLanguage, setTempLanguage] = useState(currentLanguage);

  useEffect(() => {
    setTempTheme(currentTheme);
    setTempLanguage(currentLanguage);
  }, [currentTheme, currentLanguage]);

  const handleSave = () => {
    onSave(tempTheme || currentTheme, tempLanguage || currentLanguage);
    onClose();
  };

  const handleCancel = () => {
    setTempTheme(currentTheme);
    setTempLanguage(currentLanguage);
    onClose();
  };

  return (
    <div className={`profile-settings ${currentTheme === 'dark' ? 'dark' : ''}`}>
      <h2>{t('profileSettings.title')}</h2>
      <div className="settings-content">
        <div className="setting-item">
          <label>{t('profileSettings.theme')}</label>
          <select
            value={tempTheme}
            onChange={(e) => setTempTheme(e.target.value)}
          >
            <option value="light">{t('profileSettings.themeLight')}</option>
            <option value="dark">{t('profileSettings.themeDark')}</option>
          </select>
        </div>

        <div className="setting-item">
          <label>{t('profileSettings.language')}</label>
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
          {t('profileSettings.save')}
        </button>
        <button className="cancel" onClick={handleCancel}>
          {t('profileSettings.cancel')}
        </button>
      </div>

      {/* Separate container for the logout button */}
      <div className="logout-button-container">
        {children} {/* Render the logout button here */}
      </div>
    </div>
  );
};

export default ProfileSettings;
