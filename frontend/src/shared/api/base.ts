export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const API_HOST = BASE_URL.replace('/api', '');

export function getImageUrl(url: string | undefined): string {
  if (!url) return '/placeholder.svg';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_HOST}${url}`;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Если тело запроса - FormData, браузер сам должен выставить Content-Type с boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      // Если токен протух или база сброшена — разлогиниваем
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/'; 
      }
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
