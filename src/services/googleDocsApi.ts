// Google Docs API Service
const API_URL = 'https://script.google.com/macros/s/AKfycbwIM4JH00OkFVc6EzNFj7wmxObDZl8OyvyWN4vSeJa8jGBacazuubmE1XEHu2JPGazr/exec';

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
    this.baseUrl = API_URL;
  }

  /**
   * Test API connection
   */
  async ping(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?action=ping`);
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
   * Get document content
   */
  async getContent(): Promise<DocumentContent | null> {
    try {
      const response = await fetch(`${this.baseUrl}?action=get`);
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
      console.error('Error getting content:', error);
      return null;
    }
  }

  /**
   * Replace entire document content
   */
  async saveContent(content: string): Promise<ApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'replace',
          content: content
        })
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
   * Append text to document
   */
  async appendText(text: string, style: string = 'NORMAL'): Promise<ApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'append',
          text: text,
          style: style
        })
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
   * Add log entry
   */
  async addLog(level: 'INFO' | 'WARNING' | 'ERROR' | 'LOG', message: string): Promise<ApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'log',
          level: level,
          message: message
        })
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
          
          // Smart logging - only log significant saves
          if (immediate || contentLength > 50) {
            await this.addLog('INFO', `Smart-sync: ${contentLength} chars (${priority} priority)`);
          }
          
          resolve(result);
        } catch (error) {
          const errorResult: ApiResponse = {
            success: false,
            message: `Smart-sync error: ${error}`,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          resolve(errorResult);
        } finally {
          this.isSaving = false;
        }
      }, delay);
    });
  }

  /**
   * Cancel pending sync
   */
  cancelSync(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  /**
   * Legacy auto-save method (for backwards compatibility)
   */
  async autoSave(content: string, _delay: number = 2000): Promise<void> {
    await this.smartSync(content, { priority: 'normal' });
  }

  /**
   * Cancel pending auto-save (legacy)
   */
  cancelAutoSave(): void {
    this.cancelSync();
  }
}

// Export singleton instance
export const googleDocsApi = new GoogleDocsApiService();
export default googleDocsApi; 