import React, { useEffect, useState } from 'react';

const getToken = () => {
  return localStorage.getItem('accessToken');
};

const ContactsList = ({ onSelect, refreshContacts, onContextMenu }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = getToken();
        const response = await fetch('http://localhost:3001/user/contacts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        const contactsList = data.map(contact => ({
          id: contact.contact_user_id,
          name: contact.name,
        }));
        setContacts(contactsList);
      } catch (error) {
        console.error('Ошибка при получении контактов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [refreshContacts]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="contacts-list">
    {contacts.map(contact => (
      <div
        key={contact.id}
        className="contact-item"
        onClick={() => onSelect(contact)}
        onContextMenu={(e) => onContextMenu(e, contact.id)} 
      >
        {contact.name}
      </div>
    ))}
  </div>
  );
};

export default ContactsList;
