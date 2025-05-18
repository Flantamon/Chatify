import React from 'react';

const ContextMenu = ({ x, y, onDelete, onEdit, theme, language }) => {
  const menuStyle = {
    position: 'fixed',
    left: x,
    top: y,
    background: theme === 'dark' ? '#333' : 'white',
    border: '1px solid #ccc',
    padding: '5px 0',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
    zIndex: 1000,
  };

  const itemStyle = {
    padding: '8px 15px',
    cursor: 'pointer',
    color: theme === 'dark' ? 'white' : 'black',
    background: theme === 'dark' ? '#444' : 'white',
  };

  return (
    <div style={menuStyle}>
      <div 
        onClick={onDelete} 
        style={itemStyle}
      >
        {language === 'en' ? 'Delete Message' : 'Удалить сообщение'}
      </div>
      <div 
        onClick={onEdit} 
        style={itemStyle}
      >
        {language === 'en' ? 'Edit Message' : 'Изменить сообщение'}
      </div>
    </div>
  );
};

export default ContextMenu; 