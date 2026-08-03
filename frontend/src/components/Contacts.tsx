// frontend/src/components/Contacts.tsx
import React, { useState } from 'react';
import { type Contact } from '../types';
import { ICON_COMPONENTS, ICON_COLORS } from '../utils/socialIconMap';
import styles from './Contacts.module.css';

interface ContactsProps {
  contacts: Contact[];
  className?: string;
  iconSize?: number;
  vertical?: boolean;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, className, iconSize = 24, vertical = false }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (contacts.length === 0) return null;

  const handleCopy = (id: number, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {
      const input = document.createElement('input');
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className={`${vertical ? styles.contactsVertical : styles.contacts} ${className ?? ''}`}>
      {contacts.map((contact) => {
        if (contact.type === 'phone') {
          return (
            <div key={contact.id} className={styles.contactItem}>
              <button
                type="button"
                onClick={() => handleCopy(contact.id, contact.value)}
                className={`${styles.phoneLink} ${copiedId === contact.id ? styles.copied : ''}`}
                aria-label={contact.label ?? contact.value}
              >
                <span className={styles.phoneIcon}>📞</span>
                <span className={styles.phoneValue}>{copiedId === contact.id ? 'Скопировано!' : contact.value}</span>
                {contact.label && <span className={styles.label}>{contact.label}</span>}
              </button>
            </div>
          );
        }

        // Social link
        const IconComponent = ICON_COMPONENTS[contact.iconName ?? ''] as React.ComponentType<{ size?: number; color?: string }> | undefined;
        const brandColor = ICON_COLORS[contact.iconName ?? ''] ?? undefined;
        if (!IconComponent) return null;

        return (
          <div key={contact.id} className={styles.contactItem}>
            <a
              href={contact.value}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={contact.platform ?? contact.value}
              className={styles.socialLink}
              style={brandColor ? { color: brandColor } : undefined}
            >
              <IconComponent size={iconSize} color={brandColor} />
              {contact.label && <span className={styles.label}>{contact.label}</span>}
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default Contacts;