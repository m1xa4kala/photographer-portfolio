import React from 'react';
import {
  SiInstagram,
  SiVk,
  SiTelegram,
  SiThreads,
} from 'react-icons/si';

export const PLATFORMS: string[] = [
  'Instagram',
  'VK',
  'Telegram',
  'Threads',
];

export const PLATFORM_ICONS: Record<string, string> = {
  Instagram: 'SiInstagram',
  VK: 'SiVk',
  Telegram: 'SiTelegram',
  Threads: 'SiThreads',
};

export const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number }>> = {
  SiInstagram,
  SiVk,
  SiTelegram,
  SiThreads,
};

export const ICON_COLORS: Record<string, string> = {
  SiInstagram: '#E4405F',
  SiVk: '#0077FF',
  SiTelegram: '#0088CC',
  SiThreads: '#000000',
  SiMax: '#9500FF'
};