export interface User {
  id: number;
  email: string;
}

export interface BestPhoto {
  id: number;
  title: string;
  imageUrl: string;
  orderIndex: number;
}

export interface PortfolioCategory {
  id: number;
  name: string;
  slug: string;
  orderIndex: number;
}

export interface PortfolioPhoto {
  id: number;
  title: string;
  imageUrl: string;
  orderIndex: number;
  categoryId: number;
}

export interface PriceItem {
  id: number;
  name: string;
  description: string;
  price: string;
  orderIndex: number;
}

export interface Review {
  id: number;
  clientName: string;
  text: string;
  rating: number;
  isActive: boolean;
  date: string;
}

export interface About {
  id: number;
  photoUrl: string | null;
  fullName: string;
  bioText: string;
  equipmentText: string | null;
  experience: string | null;
  email: string | null;
  phone: string | null;
  socialLinks: {
    instagram?: string;
    telegram?: string;
    vk?: string;
  } | null;
}

export interface LoginResponse {
  access_token: string;
}