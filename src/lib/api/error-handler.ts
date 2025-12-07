export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public source: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  
  throw new Error('Max retries exceeded');
}

export function handleAPIError(error: unknown): { error: string; message: string } {
  if (error instanceof APIError) {
    return {
      error: 'API Error',
      message: error.message,
    };
  }
  
  if (error instanceof Error) {
    return {
      error: 'Error',
      message: error.message,
    };
  }
  
  return {
    error: 'Unknown Error',
    message: 'An unexpected error occurred',
  };
}
