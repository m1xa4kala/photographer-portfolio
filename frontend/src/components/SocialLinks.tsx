import React from 'react';
import { type SocialLink } from '../types';
import { ICON_COMPONENTS, ICON_COLORS } from '../utils/socialIconMap';
import styles from './SocialLinks.module.css';

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
        const IconComponent = ICON_COMPONENTS[link.iconName] as React.ComponentType<{ size?: number; color?: string }> | undefined;
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