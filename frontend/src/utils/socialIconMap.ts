import React from 'react';
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

export const PLATFORMS: string[] = [
  'Instagram',
  'VK',
  'Telegram',
  'WhatsApp',
  'YouTube',
  'TikTok',
  'Twitter',
  'Pinterest',
  'Viber',
  'Vimeo',
];

export const PLATFORM_ICONS: Record<string, string> = {
  Instagram: 'SiInstagram',
  VK: 'SiVk',
  Telegram: 'SiTelegram',
  WhatsApp: 'SiWhatsapp',
  YouTube: 'SiYoutube',
  TikTok: 'SiTiktok',
  Twitter: 'SiX',
  Pinterest: 'SiPinterest',
  Viber: 'SiViber',
  Vimeo: 'SiVimeo',
};

export const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number }>> = {
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

export const ICON_COLORS: Record<string, string> = {
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