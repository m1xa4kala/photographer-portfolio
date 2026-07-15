import React from 'react';
import { type SocialLink } from '../types';
import {
  SiInstagram,
  SiVk,
  SiTelegram,
  SiWhatsapp,
  SiYoutube,
  SiTiktok,
  SiX,
  SiPinterest,
  SiViber,
  SiVimeo,
} from 'react-icons/si';
import styles from './SocialLinks.module.css';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  SiInstagram,
  SiVk,
  SiTelegram,
  SiWhatsapp,
  SiYoutube,
  SiTiktok,
  SiX,
  SiPinterest,
  SiViber,
  SiVimeo,
};

const ICON_COLORS: Record<string, string> = {
  SiInstagram: '#E4405F',
  SiVk: '#0077FF',
  SiTelegram: '#0088CC',
  SiWhatsapp: '#25D366',
  SiYoutube: '#FF0000',
  SiTiktok: '#000000',
  SiX: '#000000',
  SiPinterest: '#BD081C',
  SiViber: '#7360F2',
  SiVimeo: '#1AB7EA',
};

interface SocialLinksProps {
  links: SocialLink[];
  className?: string;
  iconSize?: number;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ links, className, iconSize = 24 }) => {
  if (links.length === 0) return null;

  return (
    <div className={`${styles.socialLinks} ${className ?? ''}`}>
      {links.map((link) => {
        const IconComponent = ICON_MAP[link.iconName];
        const brandColor = ICON_COLORS[link.iconName] ?? undefined;
        if (!IconComponent) return null;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.platform}
            className={styles.link}
            style={brandColor ? { color: brandColor } : undefined}
          >
            <IconComponent size={iconSize} color={brandColor} />
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;