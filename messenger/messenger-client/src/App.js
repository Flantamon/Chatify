import React, { useState, useEffect, useContext, createContext } from 'react';
import ContactsList from './components/ContactsList';
import ChannelsList from './components/ChannelsList';
import ChatWindow from './components/ChatWindow';
import ProfileSettings from './components/ProfileSettings';
import Login from './components/Login';
import Register from './components/Register';
import ContextMenu from './components/ContextMenu';
import './App.css';
import { getToken, getUserIdFromToken, isTokenExpired, removeToken, getApiHost } from './utils/auth';

// Компонент для уведомления о блокировке
const BlockNotification = ({ language, onLogout }) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onLogout();
    }
  }, [countdown, onLogout]);

  const message = language === 'ru'
    ? `Вы получили блокировку в системе. Вы будете перемещены на страницу входа через ${countdown} секунд`
    : `You have been blocked in the system. You will be redirected to the login page in ${countdown} seconds`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '500px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      }}>
        <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>
          {language === 'ru' ? 'Аккаунт заблокирован' : 'Account Blocked'}
        </h2>
        <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#333' }}>
          {message}
        </p>
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#eee',
          borderRadius: '2px',
          marginTop: '20px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(countdown / 10) * 100}%`,
            height: '100%',
            backgroundColor: '#e74c3c',
            transition: 'width 1s linear',
          }} />
        </div>
      </div>
    </div>
  );
};

// Создаем контекст для темы и языка
const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

function App() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [activeChat, setActiveChat] = useState(null);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken() && !isTokenExpired());
  const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, contactId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshContacts, setRefreshContacts] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showBlockNotification, setShowBlockNotification] = useState(false);
  const { theme, language, setTheme, setLanguage } = useSettings();

  useEffect(() => {
    const checkAuth = () => {
      if (isTokenExpired()) {
        handleLogout();
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 60000); // Проверка каждую минуту

    return () => clearInterval(interval);
  }, []);

  const checkUserStatus = async () => {
    if (!isLoggedIn) return;

    try {
      const token = getToken();
      if (isTokenExpired(token)) {
        handleLogout();
        return;
      }

      const response = await fetch(`https://${getApiHost()}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        console.error('Failed to check user status');
        return;
      }

      const settings = await response.json();

      // Проверяем статус пользователя
      if (settings[0]?.status === 'blocked') {
        setShowBlockNotification(true);
        return;
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (isTokenExpired(token)) {
          handleLogout();
          return;
        }

        const response = await fetch(`https://${getApiHost()}/users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          handleLogout();
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const settings = await response.json();

        // Проверяем статус пользователя
        if (settings[0]?.status === 'blocked') {
          setShowBlockNotification(true);
          return;
        }

        setTheme(settings[0]?.theme || 'light');
        setLanguage(settings[0]?.language || 'en');
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Периодическая проверка статуса пользователя каждые 5 секунд
    const statusCheckInterval = setInterval(checkUserStatus, 5000);

    return () => clearInterval(statusCheckInterval);
  }, [isLoggedIn, setTheme, setLanguage]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadContacts = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (isTokenExpired(token)) {
          handleLogout();
          return;
        }

        const response = await fetch(`https://${getApiHost()}/contacts`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          handleLogout();
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }

        const fetchedContacts = await response.json();
        console.log('Fetched contacts:', fetchedContacts);
        const currentUserId = getUserIdFromToken();
        const validContact = fetchedContacts.find(contact => contact.contact.id !== currentUserId);

        if (validContact) {
          setActiveChat({ ...validContact.contact, type: 'contact' });
        }

        setContacts(fetchedContacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [isLoggedIn, refreshContacts]);

  // Загрузка контактов для модального окна
  const loadContactsForModal = async (search = '') => {
    try {
      const token = getToken();
      const searchParam = search ? `&searchTerm=${encodeURIComponent(search)}` : '';
      const response = await fetch(`https://${getApiHost()}/users?page=1&limit=50${searchParam}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Loaded contacts for modal:', data);
      setFilteredContacts(data.users || []);
    } catch (error) {
      console.error('Error fetching contacts for modal:', error);
      setFilteredContacts([]);
    }
  };

  useEffect(() => {
    const loadContacts = async () => {
      if (searchTerm.length < 3 && !isAddContactModalOpen) {
        setFilteredContacts([]);
        return;
      }

      if (isAddContactModalOpen) {
        await loadContactsForModal(searchTerm);
      }
    };

    const debounceTimer = setTimeout(loadContacts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, isAddContactModalOpen]);

  // Загружаем контакты при открытии модального окна
  useEffect(() => {
    if (isAddContactModalOpen) {
      loadContactsForModal();
    } else {
      setFilteredContacts([]);
      setSearchTerm('');
      setSelectedContacts([]);
    }
  }, [isAddContactModalOpen]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setRefreshContacts(prev => !prev);
  };

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setActiveChat(null);
    setError(null);
    setShowBlockNotification(false);
  };

  const handleSaveSettings = async (newTheme, newLanguage) => {
    try {
      setLoading(true);
      const token = getToken();
      if (isTokenExpired(token)) {
        handleLogout();
        return;
      }

      const userId = getUserIdFromToken();
      const response = await fetch(`https://${getApiHost()}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme, language: newLanguage }),
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save settings: ${errorText}`);
      }

      setTheme(newTheme);
      setLanguage(newLanguage);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!selectedContacts.length) return;

    try {
      setLoading(true);
      const token = getToken();
      if (isTokenExpired(token)) {
        handleLogout();
        return;
      }

      // Step 1: Fetch existing contacts
      const existingContactsResponse = await fetch(`https://${getApiHost()}/contacts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (existingContactsResponse.status === 401) {
        handleLogout();
        setLoading(false); // Stop loading on logout
        return;
      }

      if (!existingContactsResponse.ok) {
        setLoading(false); // Stop loading on error
        throw new Error('Failed to fetch existing contacts');
      }

      const existingContacts = await existingContactsResponse.json();
      const existingContactIds = existingContacts.map(contact => contact.contact.id);

      const contactsToAdd = [];
      const alreadyExisting = [];
      const failedToAdd = []; // Для отслеживания ошибок при добавлении новых

      // Step 2: Separate contacts to add and already existing
      selectedContacts.forEach(selectedId => {
        if (existingContactIds.includes(selectedId)) {
          const existingContact = filteredContacts.find(contact => contact.id === selectedId);
          if (existingContact) {
            alreadyExisting.push(existingContact.name);
          } else {
             alreadyExisting.push(`ID ${selectedId}`);
          }
        } else {
          contactsToAdd.push(selectedId);
        }
      });

      // Step 3: Inform the user if contacts already exist (optional, but good UX)
      if (alreadyExisting.length > 0) {
          const message = `${language === 'en' ? 'The following users were already in your contacts:' : 'Следующие пользователи уже были в ваших контактах:'} ${alreadyExisting.join(', ')}.`;
          // We can set a message here, but continue to add the new ones
          // setError(message); // Maybe combine messages later
          console.log(message); // Log or handle this message
      }

      // Step 4: Proceed only with contacts that are not already existing
      if (contactsToAdd.length === 0) {
          // If no new contacts to add, just close modal and clear state
          setAddContactModalOpen(false);
          setSelectedContacts([]);
          setSearchTerm('');
          setLoading(false);
          // If there were only existing contacts, show message now
          if (alreadyExisting.length > 0) {
               const message = `${language === 'en' ? 'All selected users were already in your contacts.' : 'Все выбранные пользователи уже были в ваших контактах.'}`;
               setError(message);
          }
          return;
      }

      // Step 5: Send POST requests for new contacts
      const promises = contactsToAdd.map(async (contactId) => {
        try {
          const response = await fetch(`https://${getApiHost()}/contacts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: contactId }),
          });

          // Проверяем статус ответа
          if (response.status === 409) {
             // Контакт уже существует - это не ошибка добавления, а информационное сообщение
             console.log(`Contact with ID ${contactId} already exists.`);
             // Можно добавить его в список "уже существующих" для финального сообщения
             const existingContact = filteredContacts.find(contact => contact.id === contactId);
             if (existingContact && !alreadyExisting.includes(existingContact.name)) {
                  alreadyExisting.push(existingContact.name);
             } else if (!alreadyExisting.includes(`ID ${contactId}`)) {
                  alreadyExisting.push(`ID ${contactId}`);
             }
             return; // Продолжаем выполнение Promise.all, но без обработки как ошибки
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to add contact ${contactId}: ${response.status} - ${errorText}`);
            failedToAdd.push(`ID ${contactId}`); // Отслеживаем ошибки добавления
            // Не выбрасываем исключение здесь, чтобы Promise.all завершился для всех запросов
          } else {
            const addedContact = await response.json();
            console.log('Added contact:', addedContact); // Лог успешного добавления
            // Возможно, здесь потребуется обновить локальное состояние контактов или полагаться на refreshContacts
          }
        } catch (error) {
           console.error('Error during POST for contact', contactId, error);
           failedToAdd.push(`ID ${contactId}`); // Отслеживаем ошибки запроса
        }
      });

      await Promise.all(promises); // Ожидаем завершения всех POST запросов

      // Step 6: Provide feedback based on results
      let feedbackMessage = '';
      if (alreadyExisting.length > 0) {
          feedbackMessage += `${language === 'en' ? 'Some users were already in your contacts:' : 'Некоторые пользователи уже были в ваших контактах:'} ${alreadyExisting.join(', ')}. `;
      }
      if (failedToAdd.length > 0) {
          feedbackMessage += `${language === 'en' ? 'Failed to add:' : 'Не удалось добавить:'} ${failedToAdd.join(', ')}. `;
      }
      if (alreadyExisting.length === 0 && failedToAdd.length === 0) {
           feedbackMessage = `${language === 'en' ? 'Contacts added successfully.' : 'Контакты успешно добавлены.'}`;
      } else if (contactsToAdd.length > 0 && failedToAdd.length === 0 && alreadyExisting.length === 0) {
          // All selected and new were added successfully
          feedbackMessage = `${language === 'en' ? 'Contacts added successfully.' : 'Контакты успешно добавлены.'}`;
      } else if (contactsToAdd.length > 0 && failedToAdd.length === 0 && alreadyExisting.length > 0) {
           // Some were new and added, some already existed
           feedbackMessage += `${language === 'en' ? 'New contacts added successfully.' : 'Новые контакты успешно добавлены.'}`;
      }


      if (feedbackMessage) {
          setError(feedbackMessage); // Use error state to show combined feedback
      }


      // Close modal and clear state after processing
      setAddContactModalOpen(false);
      setSelectedContacts([]);
      setRefreshContacts(prev => !prev); // Обновление списка контактов
      setSearchTerm('');

    } catch (error) {
      console.error('Overall error adding contact:', error);
      setError(error.message); // Show general error message
    } finally {
      setLoading(false); // Ensure loading is stopped
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      setLoading(true);
      const token = getToken();
      if (isTokenExpired(token)) {
        handleLogout();
        return;
      }

      const response = await fetch(`https://${getApiHost()}/contacts`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: contactId }),
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        setRefreshContacts(prev => !prev);
        setContextMenu({ visible: false, x: 0, y: 0, contactId: null });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSuccess = () => {
    handleLoginSuccess();
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage }}>
      {isLoggedIn ? (
        <div className={`app-container ${theme}`}>
          <div className="sidebar" style={{ backgroundColor: theme === 'dark' ? '#333' : '#fff' }}>
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
            <div className="list-container" style={{ backgroundColor: theme === 'dark' ? '#444' : '#f9f9f9' }}>
              {activeTab === 'contacts' ? (
                <>
                  <ContactsList
                    onSelect={(chat) => setActiveChat({ ...chat, type: 'contact' })}
                    refreshContacts={refreshContacts}
                    onContextMenu={(e, contactId) => {
                      e.preventDefault();
                      setContextMenu({
                        visible: true,
                        x: e.clientX,
                        y: e.clientY,
                        contactId: contactId,
                      });
                    }}
                  />
                  {contextMenu.visible && (
                    <ContextMenu 
                      x={contextMenu.x} 
                      y={contextMenu.y} 
                      onDelete={() => handleDeleteContact(contextMenu.contactId)} 
                      theme={theme} 
                      language={language} 
                      resourse='contact'
                    />
                  )}
                  <div
                    style={{ display: contextMenu.visible ? 'block' : 'none' }}
                    onClick={() => setContextMenu({ visible: false, x: 0, y: 0, contactId: null })}
                    className="context-menu-overlay"
                  />
                </>
              ) : (
                <ChannelsList onSelect={(chat) => setActiveChat({ ...chat, type: 'channel' })} />
              )}
            </div>
            <div className="profile-buttons" style={{ backgroundColor: theme === 'dark' ? '#444' : '#f9f9f9' }}>
              <button className="profile-button" onClick={() => setProfileOpen(true)}>
                {language === 'en' ? 'Profile' : 'Профиль'}
              </button>
              <button className="add-contact-button" onClick={() => setAddContactModalOpen(true)}>
                {language === 'en' ? 'Add Contact' : 'Добавить контакт'}
              </button>
            </div>
          </div>
  
          <div className="main" style={{ backgroundColor: theme === 'dark' ? '#222' : '#fff' }}>
            {activeChat ? (
              <ChatWindow chat={activeChat} theme={theme} language={language} />
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
            >
              <button className="logout-button" onClick={handleLogout}>
                {language === 'en' ? 'Log Out' : 'Выйти'}
              </button>
            </ProfileSettings>
          )}
  
          {isAddContactModalOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              animation: 'modalFadeIn 0.3s ease-out',
            }}>
              <div style={{
                background: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'hidden',
                boxShadow: theme === 'dark'
                  ? '0 25px 50px rgba(0, 0, 0, 0.5), 0 15px 35px rgba(0, 0, 0, 0.4)'
                  : '0 25px 50px rgba(0, 0, 0, 0.15), 0 15px 35px rgba(0, 0, 0, 0.1)',
                border: theme === 'dark' ? '1px solid #444' : '1px solid #e1e5e9',
                animation: 'modalSlideIn 0.3s ease-out',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  borderBottom: theme === 'dark' ? '1px solid #444' : '1px solid #e1e5e9',
                  paddingBottom: '16px',
                }}>
                  <h2 style={{
                    margin: 0,
                    color: theme === 'dark' ? '#ffffff' : '#333333',
                    fontSize: '24px',
                    fontWeight: '600',
                  }}>
                    👥 {language === 'en' ? 'Add Contact' : 'Добавить контакт'}
                  </h2>
                  <button
                    onClick={() => setAddContactModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '28px',
                      cursor: 'pointer',
                      color: theme === 'dark' ? '#cccccc' : '#666666',
                      padding: '4px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme === 'dark' ? '#444' : '#f0f0f0';
                      e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = theme === 'dark' ? '#cccccc' : '#666666';
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    position: 'relative',
                    marginBottom: '16px',
                  }}>
                    <input
                      type="text"
                      placeholder={language === 'en' ? '🔍 Search contacts...' : '🔍 Поиск контактов...'}
                      value={searchTerm}
                      onChange={handleSearchChange}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        paddingLeft: '44px',
                        border: theme === 'dark' ? '2px solid #555' : '2px solid #e1e5e9',
                        borderRadius: '12px',
                        fontSize: '16px',
                        backgroundColor: theme === 'dark' ? '#333' : '#ffffff',
                        color: theme === 'dark' ? '#ffffff' : '#333333',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme === 'dark' ? '#555' : '#e1e5e9';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: theme === 'dark' ? '#888' : '#666',
                      fontSize: '16px',
                      pointerEvents: 'none',
                    }}>
                      🔍
                    </div>
                  </div>

                  {searchTerm.length < 3 && (
                    <p style={{
                      color: theme === 'dark' ? '#888' : '#666',
                      fontSize: '14px',
                      margin: '8px 0',
                      fontStyle: 'italic',
                    }}>
                      {language === 'en' ? 'Type at least 3 characters to search' : 'Введите минимум 3 символа для поиска'}
                    </p>
                  )}
                </div>

                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  maxHeight: '300px',
                  marginBottom: '20px',
                }}>
                  {filteredContacts.length > 0 ? (
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                    }}>
                      {filteredContacts.map(contact => (
                        <li key={contact.id} style={{
                          marginBottom: '8px',
                          padding: '12px 16px',
                          backgroundColor: selectedContacts.includes(contact.id)
                            ? (theme === 'dark' ? '#4a4a4a' : '#e3f2fd')
                            : (theme === 'dark' ? '#3a3a3a' : '#f8f9fa'),
                          borderRadius: '8px',
                          border: selectedContacts.includes(contact.id)
                            ? '2px solid #667eea'
                            : (theme === 'dark' ? '1px solid #555' : '1px solid #e1e5e9'),
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                        onClick={() => {
                          const id = contact.id;
                          setSelectedContacts(prev =>
                            prev.includes(id)
                              ? prev.filter(contactId => contactId !== id)
                              : [...prev, id]
                          );
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => {}} // Обработчик в onClick выше
                            style={{
                              width: '18px',
                              height: '18px',
                              accentColor: '#667eea',
                              cursor: 'pointer',
                            }}
                          />
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <span style={{
                              fontSize: '20px',
                            }}>
                              👤
                            </span>
                            <span style={{
                              color: theme === 'dark' ? '#ffffff' : '#333333',
                              fontWeight: '500',
                            }}>
                              {contact.name}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : searchTerm.length >= 3 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: theme === 'dark' ? '#888' : '#666',
                    }}>
                      <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>🔍</span>
                      <p>{language === 'en' ? 'No contacts found' : 'Контакты не найдены'}</p>
                    </div>
                  ) : null}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}>
                  <button
                    onClick={() => setAddContactModalOpen(false)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: theme === 'dark' ? '#444' : '#f5f5f5',
                      color: theme === 'dark' ? '#ffffff' : '#333333',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme === 'dark' ? '#555' : '#e0e0e0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = theme === 'dark' ? '#444' : '#f5f5f5';
                    }}
                  >
                    {language === 'en' ? 'Cancel' : 'Отмена'}
                  </button>
                  <button
                    onClick={handleAddContact}
                    disabled={selectedContacts.length === 0 || loading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: selectedContacts.length === 0 || loading ? '#cccccc' : '#667eea',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: selectedContacts.length === 0 || loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: selectedContacts.length === 0 || loading ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedContacts.length > 0 && !loading) {
                        e.target.style.backgroundColor = '#5a67d8';
                        e.target.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedContacts.length > 0 && !loading) {
                        e.target.style.backgroundColor = '#667eea';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {loading
                      ? (language === 'en' ? 'Adding...' : 'Добавление...')
                      : `${language === 'en' ? 'Add Selected' : 'Добавить выбранные'} (${selectedContacts.length})`
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-page-container">
          <div className="auth-wrapper">
            {isRegistering ? (
              <Register 
                onRegisterSuccess={handleRegisterSuccess}
                switchToLogin={() => setIsRegistering(false)}
              />
            ) : (
              <Login 
                onLoginSuccess={handleLoginSuccess}
                switchToRegister={() => setIsRegistering(true)}
              />
            )}
          </div>
        </div>
      )}
  
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      {error && (
        <div className="error-modal">
          <div className="error-content">
            <span className="close-error" onClick={() => setError(null)}>&times;</span>
            <p>{error}</p>
            <button onClick={() => setError(null)}>OK</button>
          </div>
        </div>
      )}

      {showBlockNotification && (
        <BlockNotification
          language={language}
          onLogout={handleLogout}
        />
      )}
    </SettingsContext.Provider>
  );
}

// Компонент для управления настройками
const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default () => (
  <SettingsProvider>
    <App />
  </SettingsProvider>
);
