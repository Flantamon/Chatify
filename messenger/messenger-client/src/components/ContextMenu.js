import React from 'react';

const deleteTexts = {
  message: {
    en: '🗑️ Delete message',
    ru: '🗑️ Удалить сообщение'
  },
  contact: {
    en: '🗑️ Delete contact',
    ru: '🗑️ Удалить контакт'
  },
  voice: {
    en: '🗑️ Delete voice message',
    ru: '🗑️ Удалить голосовое сообщение'
  }
}

const editTexts = {
  message: {
    en: '✏️ Edit message',
    ru: '✏️ Изменить сообщение'
  }
}

const voiceMenuTexts = {
  download: {
    en: '⬇️ Download voice message',
    ru: '⬇️ Скачать голосовое сообщение'
  },
  speed: {
    en: '⚡ Change playback speed',
    ru: '⚡ Изменить скорость воспроизведения'
  }
}

const ContextMenu = ({ x, y, onDelete, onEdit, onDownload, onChangeSpeed, theme, language, resourse }) => {
  const menuStyle = {
    position: 'fixed',
    left: x,
    top: y,
    background: theme === 'dark' ? '#2a2a2a' : '#ffffff',
    border: theme === 'dark' ? '1px solid #444' : '1px solid #e1e5e9',
    borderRadius: '8px',
    padding: '4px 0',
    boxShadow: theme === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
    zIndex: 1000,
    minWidth: '160px',
    backdropFilter: 'blur(10px)',
    animation: 'contextMenuFadeIn 0.15s ease-out',
  };

  const itemStyle = {
    padding: '10px 16px',
    cursor: 'pointer',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    background: theme === 'dark' ? '#2a2a2a' : '#ffffff',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    borderRadius: '4px',
    margin: '2px 4px',
  };

  const itemHoverStyle = {
    ...itemStyle,
    background: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
    transform: 'translateX(2px)',
  };

  const [hoveredItem, setHoveredItem] = React.useState(null);

  return (
    <>
      <style>
        {`
          @keyframes contextMenuFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
      <div style={menuStyle}>
        {resourse === 'voice' && (
          <>
            <div
              onClick={onDownload}
              style={hoveredItem === 'download' ? itemHoverStyle : itemStyle}
              onMouseEnter={() => setHoveredItem('download')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <span style={{ fontSize: '16px' }}>⬇️</span>
              {voiceMenuTexts.download[language].replace('⬇️ ', '')}
            </div>
            <div
              onClick={onChangeSpeed}
              style={hoveredItem === 'speed' ? itemHoverStyle : itemStyle}
              onMouseEnter={() => setHoveredItem('speed')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <span style={{ fontSize: '16px' }}>⚡</span>
              {voiceMenuTexts.speed[language].replace('⚡ ', '')}
            </div>
            <div style={{
              height: '1px',
              background: theme === 'dark' ? '#444' : '#e1e5e9',
              margin: '4px 8px',
            }} />
          </>
        )}
        <div
          onClick={onDelete}
          style={hoveredItem === 'delete' ? itemHoverStyle : itemStyle}
          onMouseEnter={() => setHoveredItem('delete')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span style={{ fontSize: '16px' }}>🗑️</span>
          {deleteTexts[resourse][language].replace('🗑️ ', '')}
        </div>
        {resourse === 'message' && (
          <div
            onClick={onEdit}
            style={hoveredItem === 'edit' ? itemHoverStyle : itemStyle}
            onMouseEnter={() => setHoveredItem('edit')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span style={{ fontSize: '16px' }}>✏️</span>
            {editTexts[resourse][language].replace('✏️ ', '')}
          </div>
        )}
      </div>
    </>
  );
};

export default ContextMenu;
