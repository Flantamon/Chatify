import React, { useState, useEffect } from 'react';
import ContactsList from './components/ContactsList';
import ChannelsList from './components/ChannelsList';
import ChatWindow from './components/ChatWindow';
import ProfileSettings from './components/ProfileSettings';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';
import { getToken } from './utils/auth';

function App() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [activeChat, setActiveChat] = useState(null);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState('light'); 
  const [language, setLanguage] = useState('en'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isAddContactModalOpen, setAddContactModalOpen] = useState(false); 
  const [contacts, setContacts] = useState([]); 
  const [selectedContacts, setSelectedContacts] = useState([]); 
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, contactId: null });
  const [searchTerm, setSearchTerm] = useState(''); 
  const [refreshContacts, setRefreshContacts] = useState(true); 
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = getToken();
        const response = await fetch('http://localhost:3001/user/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const settings = await response.json();
        setTheme(settings[0]?.theme); // Set theme from server
        setLanguage(settings[0]?.language); // Set language from server
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    if (isLoggedIn) {
      fetchSettings(); // Call the function to fetch settings only if logged in
    }
  }, [isLoggedIn]); // Dependency on isLoggedIn

  const handleLoginSuccess = () => {
    setIsLoggedIn(true); // Update login status
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // Remove token from localStorage
    setIsLoggedIn(false); // Update login status
    window.location.reload(); // Reload the page
  };

  const handleSaveSettings = async (newTheme, newLanguage) => {
    setTheme(newTheme);
    setLanguage(newLanguage);

    try {
      const token = getToken();
      const response = await fetch('http://localhost:3001/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme, language: newLanguage }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleAddContact = async () => {
    try {
      const token = getToken(); // Получаем токен для авторизации

      // Проходим по каждому выбранному контакту и отправляем отдельный запрос
      for (const contactId of selectedContacts) {
        const response = await fetch('http://localhost:3001/user/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: contactId }), // Отправляем объект с userId
        });

        if (!response.ok) {
          throw new Error(`Failed to add contact with ID ${contactId}`);
        }

        console.log(`Контакт с ID ${contactId} успешно добавлен.`);
      }

      setAddContactModalOpen(false); // Закрываем модальное окно
      setSelectedContacts([]); // Очищаем выбранные контакты
      setRefreshContacts(!refreshContacts);
    } catch (error) {
      console.error('Ошибка при добавлении контактов:', error);
    }
  };

  const handleDeleteContact = async (contactId) => {
  try {
    const response = await fetch('http://localhost:3001/user/contacts', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: contactId }),
    });

    if (response.ok) {
      setRefreshContacts(!refreshContacts); // Обновляем список контактов
      setContextMenu({ visible: false, x: 0, y: 0, contactId: null }); // Скрываем контекстное меню
    }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  // useEffect для загрузки контактов при изменении строки поиска
  useEffect(() => {
    const loadContacts = async () => {
      if (searchTerm.length >= 3) { // Проверка на количество символов
        try {
          const token = getToken();
          const response = await fetch(`http://localhost:3001/user/users/?searchTerm=${encodeURIComponent(searchTerm)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch contacts');
          }

          const fetchedContacts = await response.json();
          setContacts(fetchedContacts); // Обновляем состояние контактов
        } catch (error) {
          console.error('Error fetching contacts:', error);
        }
      }
    };

    loadContacts(); // Вызываем функцию загрузки контактов
  }, [searchTerm]); // Зависимость от searchTerm

  const handleRegisterSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div>
      {!isLoggedIn && !isRegistering && (
        <button onClick={() => setIsRegistering(true)} style={{ marginTop: "10px" }}>
          Register
        </button>
      )}
      {!isLoggedIn && isRegistering && (
        <button onClick={() => setIsRegistering(false)} style={{ marginTop: "10px" }}>
          Back to Login
        </button>
      )}
      <div className={`app-container ${theme}`}>
        {isLoggedIn ? (
          <>
            <div className="sidebar">
              <div className="tabs">
                <button
                  className={activeTab === 'contacts' ? 'active' : ''}
                  onClick={() => setActiveTab('contacts')}>
                  {language === 'en' ? 'Contacts' : 'Контакты'}
                </button>
                <button
                  className={activeTab === 'channels' ? 'active' : ''}
                  onClick={() => setActiveTab('channels')}>
                  {language === 'en' ? 'Channels' : 'Каналы'}
                </button>
              </div>
              <div className="list-container">
                {activeTab === 'contacts' ? (
                  <>
                  <ContactsList 
                    onSelect={(chat) => setActiveChat({...chat, type: 'contact'})}
                    refreshContacts={refreshContacts}
                    onContextMenu={(e, contactId) => {
                      e.preventDefault();
                      setContextMenu({
                        visible: true,
                        x: e.clientX,
                        y: e.clientY,
                        contactId: contactId
                      });
                    }}
                  />
                  {contextMenu.visible && (
                    <div 
                      className="context-menu"
                      style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 1000
                      }}
                    >
                      <button 
                        onClick={() => handleDeleteContact(contextMenu.contactId)}
                        className="context-menu-item"
                      >
                        {language === 'en' ? 'Delete' : 'Удалить'}
                      </button>
                    </div>
                  )}
                  <div 
                    style={{ display: contextMenu.visible ? 'block' : 'none' }}
                    onClick={() => setContextMenu({ visible: false, x: 0, y: 0, contactId: null })}
                    className="context-menu-overlay"
                  />
                </>
                  //<ContactsList onSelect={(chat) => setActiveChat({...chat, type: 'contact'})} refreshContacts={refreshContacts}/>
                ) : (
                  <ChannelsList onSelect={(chat) => setActiveChat({...chat, type: 'channel'})} />
                )}
              </div>
              <div className="profile-buttons">
                <button className="profile-button" onClick={() => setProfileOpen(true)}>
                  {language === 'en' ? 'Profile' : 'Профиль'}
                </button>
                <button className="logout-button" onClick={handleLogout}>
                  {language === 'en' ? 'Log Out' : 'Выйти'}
                </button>
                <button className="add-contact-button" onClick={() => { setAddContactModalOpen(true); }}>
                  {language === 'en' ? 'Add Contact' : 'Добавить контакт'}
                </button>
              </div>
            </div>

            <div className="main">
              {activeChat ? (
                <ChatWindow chat={activeChat} theme={theme} />
              ) : (
                <div className="placeholder">
                  {language === 'en' ? 'Select a contact or channel to start chatting.' : 'Выберите контакт или канал для начала чата.'}
                </div>
              )}
            </div>

            {isProfileOpen && (
              <ProfileSettings
                onClose={() => setProfileOpen(false)}
                onSave={handleSaveSettings}
                currentTheme={theme}
                currentLanguage={language}
              />
            )}

            {isAddContactModalOpen && (
              <div className="modal">
                <div className="modal-content">
                  <span className="close" onClick={() => setAddContactModalOpen(false)}>&times;</span>
                  <h2>{language === 'en' ? 'Add Contact' : 'Добавить контакт'}</h2>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Search contacts...' : 'Поиск контактов...'}
                    value={searchTerm} // Устанавливаем значение из состояния
                    onChange={(e) => setSearchTerm(e.target.value)} // Обработчик изменения
                  />
                  <ul>
                    {contacts.map(contact => (
                      <li key={contact.id}>
                        <input
                          type="checkbox"
                          value={contact.user_id}
                          onChange={(e) => {
                            const id = parseInt(e.target.value);
                            setSelectedContacts(prev => 
                              e.target.checked 
                                ? [...prev, id] 
                                : prev.filter(contactId => contactId !== id)
                            );
                          }}
                        />
                        {contact.name}
                      </li>
                    ))}
                  </ul>
                  <button onClick={handleAddContact}>
                    {language === 'en' ? 'Add Selected' : 'Добавить выбранные'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : isRegistering ? (
          <Register onRegisterSuccess={handleRegisterSuccess} />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
        
      </div>
    </div>
  );
}

export default App;
