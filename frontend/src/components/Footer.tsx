// frontend/src/components/Footer.tsx
import React from 'react';
import { type Contact } from '../types';
import Contacts from './Contacts';
import Logo from './Logo';
import styles from './Footer.module.css';

interface FooterProps {
  contacts: Contact[];
}

const Footer: React.FC<FooterProps> = ({ contacts }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.info}>
          <Logo className={styles.footerLogo} />
        </div>
        <div className={styles.contactsSection}>
          <h4 className={styles.contactsHeading}>Контакты</h4>
          <Contacts contacts={contacts} className={styles.footerContacts} />
        </div>
        <p className={styles.copyright}>
          &copy; {currentYear} Vlada Khaybullina. Все права защищены.
        </p>
      </div>
    </footer>
  );
};

export default Footer;