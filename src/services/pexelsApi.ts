import type { PexelsPhoto, PexelsSearchResponse } from '../types/pexels';

const PEXELS_API_KEY = 'HBJw1bM20VwsyvfLOzy9YoLi103VVBxqFnKiboJF0rrWqP9IeM0cubxo'; // Replace with actual API key
const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

export class PexelsApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'PexelsApiError';
  }
}

export async function searchImages(query: string, perPage: number = 1): Promise<PexelsPhoto[]> {
  if (!query.trim()) {
    throw new PexelsApiError('Search query cannot be empty');
  }

  const url = new URL(`${PEXELS_BASE_URL}/search`);
  url.searchParams.append('query', query);
  url.searchParams.append('per_page', perPage.toString());
  url.searchParams.append('orientation', 'landscape'); // Better for our 800x600 canvas

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new PexelsApiError('API rate limit exceeded. Please try again later.', 429);
      }
      if (response.status === 401) {
        throw new PexelsApiError('Invalid API key. Please check your Pexels API configuration.', 401);
      }
      throw new PexelsApiError(`API request failed with status ${response.status}`, response.status);
    }

    const data: PexelsSearchResponse = await response.json();
    
    if (data.photos.length === 0) {
      throw new PexelsApiError('No images found for that prompt. Try something else?');
    }

    return data.photos;
  } catch (error) {
    if (error instanceof PexelsApiError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new PexelsApiError('Network error. Check your connection and try again.');
    }
    throw new PexelsApiError('Something went wrong fetching the image. Try again later.');
  }
}

export function getOptimalImageUrl(photo: PexelsPhoto): string {
  // For 800x600 canvas, use medium size for better performance
  return photo.src.medium || photo.src.large || photo.src.original;
} 