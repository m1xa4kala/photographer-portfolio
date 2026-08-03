// frontend/src/components/Logo.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

interface LogoProps {
  /** When set, wraps the logo in a Link to this path */
  linkTo?: string;
  /** Additional class name for the outer container */
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ linkTo, className }) => {
  const content = (
    <div className={`${styles.logo} ${className ?? ''}`}>
      <span className={styles.name}>Vlada Khaybullina</span>
      <span className={styles.sub}>Фотограф</span>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};

export default Logo;