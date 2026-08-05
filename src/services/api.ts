import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type UrlItem = {
  id: number;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: string;
  clickCount: number;
  lastAccessedAt: string | null;
};

export type ClickEventDto = {
  clickedAt: string;
};

export type UrlAnalytics = {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: string;
  clickCount: number;
  lastAccessedAt: string | null;
  clickHistory: ClickEventDto[];
};

export type PaginatedUrls = {
  content: UrlItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

export const apiService = {
  shortenUrl: async (originalUrl: string): Promise<UrlItem> => {
    const response = await apiClient.post<UrlItem>('/api/urls', { originalUrl });
    return response.data;
  },

  getRecentUrls: async (page: number, size: number): Promise<PaginatedUrls> => {
    const response = await apiClient.get<PaginatedUrls>('/api/urls', {
      params: { page, size, sortBy: 'createdAt', direction: 'desc' },
    });
    return response.data;
  },

  getAnalytics: async (id: number): Promise<UrlAnalytics> => {
    const response = await apiClient.get<UrlAnalytics>(`/api/urls/${id}/analytics`);
    return response.data;
  },

  deleteUrl: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/urls/${id}`);
  },
};
