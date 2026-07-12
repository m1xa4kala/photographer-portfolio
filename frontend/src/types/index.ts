export interface User {
  id: number;
  email: string;
}

export interface BestPhoto {
  id: number;
  title: string;
  imageUrl: string;
  orderIndex?: number;
}

export interface PortfolioCategory {
  id: number;
  name: string;
  orderIndex?: number;
}

export interface PortfolioSession {
  id: number;
  name: string;
  orderIndex?: number;
  categoryId: number;
}

export interface PortfolioPhoto {
  id: number;
  title: string;
  imageUrl: string;
  orderIndex?: number;
  sessionId: number;
}

export interface PriceItem {
  id: number;
  name: string;
  description: string;
  price: string;
  orderIndex?: number;
}

export interface Review {
  id: number;
  clientName: string;
  text: string;
  clientPhotoUrl: string | null;
}

export interface About {
  id: number;
  photoUrl: string | null;
  fullName: string;
  bioText: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface FullSession {
  id: number;
  title: string;
  description: string | null;
  downloadToken: string | null;
  downloadsEnabled: boolean;
  createdAt: string;
  originalFiles?: SessionOriginalFile[];
}

export interface SessionOriginalFile {
  id: number;
  fullSessionId: number;
  originalName: string;
  s3Key: string;
  fileSize: number;
  uploadedAt: string;
}