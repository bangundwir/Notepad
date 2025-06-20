// Google Docs API Service - Production Version with Environment Variables
const API_URL = import.meta.env.VITE_GOOGLE_DOCS_API_URL;

if (!API_URL) {
  console.error('VITE_GOOGLE_DOCS_API_URL not found in environment variables');
}

export interface ApiResponse {
  success: boolean;
  message: string;
  documentId?: string;
  timestamp?: string;
  content?: string;
  characterCount?: number;
  lastModified?: string;
  error?: string;
}

export interface DocumentContent {
  content: string;
  characterCount: number;
  lastModified: string;
  documentId: string;
}

class GoogleDocsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL || '';
  }

  /**
   * Enhanced fetch with better CORS handling - avoid preflight when possible
   */
  private async safeFetch(url: string, options: RequestInit = {}, retries: number = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Test API connection with simple GET request (no preflight)
   */
  async ping(): Promise<ApiResponse> {
    try {
      const url = `${this.baseUrl}?action=ping&t=${Date.now()}`;
      
      const response = await this.safeFetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get document content with simple GET request (no preflight)
   */
  async getContent(): Promise<DocumentContent | null> {
    try {
      const url = `${this.baseUrl}?action=get&t=${Date.now()}`;
      
      const response = await this.safeFetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.content !== undefined) {
        return {
          content: data.content,
          characterCount: data.characterCount || 0,
          lastModified: data.lastModified || '',
          documentId: data.documentId || ''
        };
      }
      
      throw new Error(data.message || 'Failed to get content');
    } catch (error) {
      return null;
    }
  }

  /**
   * Save content using form-encoded POST to avoid preflight
   */
  async saveContent(content: string): Promise<ApiResponse> {
    try {
      // Use form-encoded data to avoid CORS preflight
      const formData = new URLSearchParams();
      formData.append('action', 'replace');
      formData.append('content', content);
      formData.append('timestamp', new Date().toISOString());
      
      const response = await this.safeFetch(this.baseUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      const data: ApiResponse = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: `Save error: ${error}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Append text using form-encoded POST to avoid preflight
   */
  async appendText(text: string, style: string = 'NORMAL'): Promise<ApiResponse> {
    try {
      // Use form-encoded data to avoid CORS preflight
      const formData = new URLSearchParams();
      formData.append('action', 'append');
      formData.append('text', text);
      formData.append('style', style);
      formData.append('timestamp', new Date().toISOString());
      
      const response = await this.safeFetch(this.baseUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      const data: ApiResponse = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: `Append error: ${error}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add log entry using form-encoded POST to avoid preflight
   */
  async addLog(level: 'INFO' | 'WARNING' | 'ERROR' | 'LOG', message: string): Promise<ApiResponse> {
    try {
      // Use form-encoded data to avoid CORS preflight
      const formData = new URLSearchParams();
      formData.append('action', 'log');
      formData.append('level', level);
      formData.append('message', message);
      formData.append('timestamp', new Date().toISOString());
      
      const response = await this.safeFetch(this.baseUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      const data: ApiResponse = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: `Log error: ${error}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enhanced real-time sync with smart batching
   */
  private saveTimeout: number | null = null;
  private lastSaveTime: number = 0;
  private isSaving: boolean = false;
  
  async smartSync(content: string, options: { 
    immediate?: boolean; 
    priority?: 'high' | 'normal' | 'low';
    contentLength?: number;
  } = {}): Promise<ApiResponse | null> {
    const { immediate = false, priority = 'normal', contentLength = content.length } = options;
    
    // Cancel previous timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Prevent multiple simultaneous saves
    if (this.isSaving && !immediate) {
      return null;
    }

    // Smart delay calculation
    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;
    
    let delay = 2000; // default
    
    if (immediate) {
      delay = 0;
    } else if (priority === 'high' || contentLength < 100) {
      delay = 500; // Fast sync for small content
    } else if (priority === 'low' || contentLength > 1000) {
      delay = 3000; // Slower sync for large content
    } else if (timeSinceLastSave < 5000) {
      delay = 1000; // Recent activity, sync faster
    }

    return new Promise((resolve) => {
      this.saveTimeout = window.setTimeout(async () => {
        if (this.isSaving) {
          resolve(null);
          return;
        }

        this.isSaving = true;
        this.lastSaveTime = Date.now();

        try {
          const result = await this.saveContent(content);
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            message: 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } finally {
          this.isSaving = false;
        }
      }, delay);
    });
  }

  /**
   * Cancel pending sync operations
   */
  cancelSync(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.isSaving = false;
  }

  /**
   * Auto-save functionality with debouncing
   */
  async autoSave(content: string, _delay: number = 2000): Promise<void> {
    await this.smartSync(content, { priority: 'normal' });
  }

  /**
   * Cancel auto-save
   */
  cancelAutoSave(): void {
    this.cancelSync();
  }
}

// Export singleton instance
export const googleDocsApi = new GoogleDocsApiService();
export default googleDocsApi; 