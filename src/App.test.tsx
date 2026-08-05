import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { apiService } from './services/api';

jest.mock('./services/api');

const mockUrls = {
  content: [
    {
      id: 1,
      originalUrl: 'https://google.com',
      shortCode: 'goog02',
      shortUrl: 'http://localhost:8080/goog02',
      createdAt: new Date().toISOString(),
      clickCount: 5,
      lastAccessedAt: new Date().toISOString()
    }
  ],
  totalPages: 1,
  totalElements: 1,
  size: 10,
  number: 0
};

describe('URL Shortener Frontend Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders homepage elements', async () => {
    (apiService.getRecentUrls as jest.Mock).mockResolvedValue(mockUrls);

    render(<App />);

    expect(screen.getByText('Easy URL Shortener')).toBeInTheDocument();
    expect(screen.getByText('Simplify your URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste a link here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shorten URL/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('https://google.com')).toBeInTheDocument();
      expect(screen.getByText('http://localhost:8080/goog02')).toBeInTheDocument();
    });
  });

  test('shows form validation error on empty URL', async () => {
    (apiService.getRecentUrls as jest.Mock).mockResolvedValue(mockUrls);

    render(<App />);

    const button = screen.getByRole('button', { name: /Shorten URL/i });
    fireEvent.click(button);

    expect(await screen.findByText(/URL cannot be empty/i)).toBeInTheDocument();
  });

  test('shows form validation error on malformed URL', async () => {
    (apiService.getRecentUrls as jest.Mock).mockResolvedValue(mockUrls);

    render(<App />);

    const input = screen.getByPlaceholderText(/Paste a link here/i);
    fireEvent.change(input, { target: { value: 'not_a_valid_url' } });

    const button = screen.getByRole('button', { name: /Shorten URL/i });
    fireEvent.click(button);

    expect(await screen.findByText(/Please enter a valid HTTP or HTTPS URL/i)).toBeInTheDocument();
  });
});
