// frontend/src/components/Contacts.tsx
import React from 'react';
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
  if (contacts.length === 0) return null;

  return (
    <div className={`${vertical ? styles.contactsVertical : styles.contacts} ${className ?? ''}`}>
      {contacts.map((contact) => {
        if (contact.type === 'phone') {
          const telHref = `tel:${contact.value.replace(/[^\d+]/g, '')}`;
          return (
            <div key={contact.id} className={styles.contactItem}>
              <a href={telHref} className={styles.phoneLink} aria-label={contact.label ?? contact.value}>
                <span className={styles.phoneIcon}>📞</span>
                <span>{contact.value}</span>
                {contact.label && <span className={styles.label}>{contact.label}</span>}
              </a>
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
            </a>
            {contact.label && <span className={styles.label}>{contact.label}</span>}
          </div>
        );
      })}
    </div>
  );
};

export default Contacts;