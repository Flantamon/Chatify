import React, {
  useState,
  useEffect
} from 'react';
import ContextMenu from './ContextMenu';
import { getUserIdFromToken } from '../utils/auth';

const ChatWindow = ({
  chat,
  theme
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [selectedFile, setSelectedFile] = useState(null);

  // Получение токена из localStorage
  const getToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Получение сообщений с сервера
  useEffect(() => {
    const fieldType = chat.type === 'contact' ? 'receiver_user_id' : 'receiver_channel_id';
    const queryString = new URLSearchParams({[fieldType]: chat.id}).toString();
    const fetchMessages = async () => {
      try {
        const token = getToken();
        const response = await fetch('http://localhost:3001/user/messages?' + queryString, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          console.error('Failed to fetch messages:', response.status);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [chat.id, chat.type]);

  useEffect(() => {
    // Подключение к WebSocket серверу
    const websocket = new WebSocket('ws://localhost:3001');

    websocket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    websocket.onmessage = (event) => {
      const eventData = JSON.parse(event.data);

      if (eventData.operation == 'create') {
        setMessages((prevMessages) => [...prevMessages, eventData.data]);
      }
      if (eventData.operation == 'update') {
        setMessages((prevMessages) => [...prevMessages.map(msg => (msg.id == eventData.data.id ? {...msg, ...eventData.data} : msg))]);
      }
      if (eventData.operation == 'delete') {
        console.log(eventData);
        setMessages((prevMessages) => [...prevMessages.filter(msg => msg.id != eventData.data.messageId)]);
      }
    };

    websocket.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    return () => {
      websocket.close();
    };
  }, []);

  // Добавляем обработчик выбора файла
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        alert('Аудио и видео файлы не поддерживаются');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('Размер файла не должен превышать 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Модифицируем функцию отправки сообщения
  const sendMessage = async () => {
    if (input.trim() === '' && !selectedFile) return;

    const fieldType = chat.type === 'contact' ? 'receiver_user_id' : 'receiver_channel_id';
    const formData = new FormData();
    formData.append(fieldType, chat.id);
    
    if (input.trim() !== '') {
      formData.append('text', input);
    }
    
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      const token = getToken();
      const response = await fetch('http://localhost:3001/user/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const savedMessage = await response.json();
        setMessages([...messages, savedMessage]);
        setInput('');
        setSelectedFile(null);
        // Очищаем input файла
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        console.error('Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage(); // Вызываем sendMessage при нажатии Enter
    }
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    if (message.sender_id === getUserIdFromToken()) {
      setContextMenu({
        visible: true,
        x: e.pageX,
        y: e.pageY,
        message: message
      });
    }
  };

  const handleDelete = () => {
    if (contextMenu.message) {
      deleteMessage(contextMenu.message.id);
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const handleEdit = () => {
    if (contextMenu.message) {
      setEditingMessage(contextMenu.message);
      setEditInput(contextMenu.message.text);
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3001/user/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setMessages(messages.filter(msg => msg.id !== messageId));
      } else {
        console.error('Failed to delete message:', response.status);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const updateMessage = async () => {
    if (editingMessage) {
      try {
        const token = getToken();
        const response = await fetch(`http://localhost:3001/user/messages/${editingMessage.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: editInput }),
        });

        if (response.ok) {
          const updatedMessage = await response.json();
          setMessages(messages.map(msg => (msg.id === updatedMessage.id ? {...msg, ...updatedMessage} : msg)));
          setEditingMessage(null);
          setEditInput('');
        } else {
          console.error('Failed to update message:', response.status);
        }
      } catch (error) {
        console.error('Error updating message:', error);
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    // Преобразуем в московское время (UTC+3)
    const moscowTime = new Date(date.getTime() + (3 * 60 * 60 * 1000));
    return moscowTime.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message) => {
    return (
      <div 
        key={message.id} 
        className={`message ${message.sender_id === getUserIdFromToken() ? 'sent' : 'received'}`}
        onContextMenu={(e) => handleContextMenu(e, message)}
      >
        <div className="message-header">
          <span className="sender-name">{message.sender_name}</span>
          <span className="message-time">
            {formatMessageTime(message.created_at)}
          </span>
        </div>

        {message.text && <div className="message-text">{message.text}</div>}

        {message.file_url && (
          <div className="message-file">
            <div className="file-info">
              <span className="file-icon">
                {getFileIcon(message.file_type)}
              </span>
              <span className="file-name" title={message.file_name}>
                {message.file_name}
              </span>
              <span className="file-size">
                {formatFileSize(message.file_size)}
              </span>
            </div>
            
            {message.file_type.startsWith('image/') ? (
              <img 
                src={`http://localhost:3001${message.file_url}`}
                alt={message.file_name}
                className="image-preview"
                onClick={() => window.open(`http://localhost:3001${message.file_url}`, '_blank')}
              />
            ) : (
              <a 
                href={`http://localhost:3001${message.file_url}`}
                download={message.file_name}
                className="download-button"
              >
                Скачать файл
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`chat-window ${theme}`} onClick={closeContextMenu}>
      <h2>{chat.name}</h2>
      <div className="messages">
        {messages.map((message, index) => (
          renderMessage(message))
        )}
      </div>
      {contextMenu.visible && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onDelete={handleDelete} 
          onEdit={handleEdit} 
        />
      )}
      {editingMessage && (
        <div className="modal">
          <div className="modal-content">
            <input 
              type="text" 
              value={editInput} 
              onChange={(e) => setEditInput(e.target.value)} 
            />
            <button onClick={updateMessage}>Сохранить/Save</button>
            <button onClick={() => setEditingMessage(null)}>Отменить/Cancel</button>
          </div>
        </div>
      )}
      <div className="message-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите сообщение..."
        />
        <input
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-input"
        />
        <button 
          className="attach-file"
          onClick={() => document.getElementById('file-input').click()}
        >
          📎
        </button>
        <button onClick={sendMessage}>Отправить</button>
      </div>
    </div>
  );
};

export default ChatWindow;