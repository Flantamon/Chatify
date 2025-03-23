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

  // Отправка сообщения на сервер
  const sendMessage = async () => {
    if (input.trim() !== '') {
    const fieldType = chat.type === 'contact' ? 'receiver_user_id' : 'receiver_channel_id';
      const newMessage = {
        [fieldType]: chat.id,
        text: input
      };

      try {
        const token = getToken();
        const response = await fetch('http://localhost:3001/user/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newMessage),
        });

        if (response.ok) {
          const savedMessage = await response.json();
          setMessages([...messages, savedMessage]);
          setInput('');
        } else {
          console.error('Failed to send message:', response.status);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
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

  return (
    <div className={`chat-window ${theme}`} onClick={closeContextMenu}>
      <h2>{chat.name}</h2>
      <div className="messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.sender_id === getToken() ? 'my-message' : 'other-message'}`} 
            onContextMenu={(e) => handleContextMenu(e, message)}
          >
            <strong>{message.sender_name}: </strong>{message.text}
          </div>
        ))}
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
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;