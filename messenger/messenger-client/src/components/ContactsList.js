import React, { useEffect, useState } from 'react';
import { getUserIdFromToken } from '../utils/auth';

const getToken = () => {
  return localStorage.getItem('accessToken');
};

const ContactsList = ({ onSelect, refreshContacts, onContextMenu }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Fetching contacts due to refreshContacts change: ', refreshContacts);
    const fetchContacts = async () => {
      try {
        const token = getToken();
        const currentUserId = getUserIdFromToken();
        if (!currentUserId) {
             console.error('Could not get user ID from token');
             setLoading(false);
             return;
        }

        const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/contacts`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log('Fetched contacts:', data);
        const contactsList = data.map(contactRelation => {
          const contactPerson = contactRelation.owner.id === currentUserId
            ? contactRelation.contact
            : contactRelation.owner;

          return {
            id: contactPerson.id,
            name: contactPerson.name
          };
        }).filter(contact => contact && contact.id !== undefined);

        setContacts(contactsList);
        console.log('Updated contacts:', contactsList);
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
