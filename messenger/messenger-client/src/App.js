import React, { useState, useEffect, useContext, createContext } from 'react';
import ContactsList from './components/ContactsList';
import ChannelsList from './components/ChannelsList';
import ChatWindow from './components/ChatWindow';
import ProfileSettings from './components/ProfileSettings';
import Login from './components/Login';
import Register from './components/Register';
import ContextMenu from './components/ContextMenu';
import './App.css';
import { getToken, getUserIdFromToken, isTokenExpired, removeToken } from './utils/auth';

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

        const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/users`, {
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
        setTheme(settings[0]?.theme || 'light');
        setLanguage(settings[0]?.language || 'en');
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
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

        const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/contacts`, {
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

  useEffect(() => {
    const loadContacts = async () => {
      if (searchTerm.length < 3) {
        setContacts([]);
        return;
      }

      try {
        const token = getToken();
        const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/users?searchTerm=${encodeURIComponent(searchTerm)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const fetchedContacts = await response.json();
        console.log(fetchedContacts);
        setFilteredContacts(fetchedContacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setFilteredContacts([]);
      }
    };

    const debounceTimer = setTimeout(loadContacts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setRefreshContacts(prev => !prev);
  };

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setActiveChat(null);
    setError(null);
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
      const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/users/${userId}`, {
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
      const existingContactsResponse = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/contacts`, {
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
          const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/contacts`, {
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

      const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/contacts`, {
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
            <div className="modal">
              <div className="modal-content" style={{ background: theme === 'dark' ? 'var(--dark-modal-bg)' : 'var(--modal-bg)' }}>
                <span className="close" onClick={() => setAddContactModalOpen(false)}>&times;</span>
                <h2>{language === 'en' ? 'Add Contact' : 'Добавить контакт'}</h2>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search contacts...' : 'Поиск контактов...'}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <ul>
                  {filteredContacts.map(contact => (
                    <li key={contact.id}>
                      <input
                        type="checkbox"
                        value={contact.id}
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