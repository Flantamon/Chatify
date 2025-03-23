import React from 'react';

const ContextMenu = ({ x, y, onDelete, onEdit }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        left: x,
        top: y,
        background: 'white',
        border: '1px solid #ccc',
        padding: '5px 0',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
        zIndex: 1000 // Убедитесь, что меню отображается поверх других элементов
      }}
    >
      <div 
        onClick={onDelete} 
        style={{ padding: '8px 15px', cursor: 'pointer', color: 'black' }}
      >
        Удалить/Delete
      </div>
      <div 
        onClick={onEdit} 
        style={{ padding: '8px 15px', cursor: 'pointer', color: 'black' }}
      >
        Изменить/Update
      </div>
    </div>
  );
};

export default ContextMenu; 