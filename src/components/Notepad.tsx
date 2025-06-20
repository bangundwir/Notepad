import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, RefreshCw, Wifi, WifiOff, FileText, Clock, Hash, Menu, X, Smartphone } from 'lucide-react';
import googleDocsApi, { type DocumentContent } from '../services/googleDocsApi';

interface NotepadProps {
  className?: string;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'saving' | 'error';

const Notepad: React.FC<NotepadProps> = ({ className = '' }) => {
  // State management
  const [content, setContent] = useState<string>('');
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  const [documentInfo, setDocumentInfo] = useState<DocumentContent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if content has changed
  useEffect(() => {
    setHasUnsavedChanges(content !== lastSavedContent);
  }, [content, lastSavedContent]);

  // Enhanced auto-save with immediate sync for small changes
  const triggerAutoSave = useCallback((newContent: string, immediate: boolean = false) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    const delay = immediate ? 100 : (newContent.length < 500 ? 1000 : 2000);
    
    autoSaveTimeoutRef.current = window.setTimeout(async () => {
      if (newContent !== lastSavedContent && newContent.length > 0) {
        setConnectionStatus('saving');
        try {
          const result = await googleDocsApi.saveContent(newContent);
          if (result.success) {
            setLastSavedContent(newContent);
            setLastSaved(new Date());
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('error');
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
          setConnectionStatus('error');
        }
      }
    }, delay);
  }, [lastSavedContent]);

  // Load initial content
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      // Test connection first
      const pingResult = await googleDocsApi.ping();
      if (!pingResult.success) {
        throw new Error('Connection failed');
      }

      // Load document content
      const docContent = await googleDocsApi.getContent();
      if (docContent) {
        setContent(docContent.content);
        setLastSavedContent(docContent.content);
        setDocumentInfo(docContent);
        setConnectionStatus('connected');
        
        // Focus textarea on mobile after loading
        if (isMobile && textareaRef.current) {
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 500);
        }
        
        // Log successful load
        await googleDocsApi.addLog('INFO', `Notepad loaded on ${isMobile ? 'mobile' : 'desktop'} device`);
      } else {
        throw new Error('Failed to load content');
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      setConnectionStatus('error');
      setContent('# Error Loading Document\n\nFailed to connect to Google Docs API.\nPlease check your connection and try again.\n\n📱 Mobile users: Ensure you have a stable internet connection.');
    } finally {
      setIsLoading(false);
    }
  }, [isMobile]);

  // Save content manually
  const saveContent = useCallback(async (showFeedback: boolean = true) => {
    if (!hasUnsavedChanges) return;
    
    setConnectionStatus('saving');
    
    try {
      const result = await googleDocsApi.saveContent(content);
      if (result.success) {
        setLastSavedContent(content);
        setLastSaved(new Date());
        setConnectionStatus('connected');
        
        if (showFeedback) {
          setTimeout(() => {
            if (connectionStatus !== 'saving') {
              setConnectionStatus('connected');
            }
          }, 1000);
        }

        // Add manual save log
        await googleDocsApi.addLog('INFO', `Manual save: ${content.length} characters on ${isMobile ? 'mobile' : 'desktop'}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to save content:', error);
      setConnectionStatus('error');
    }
  }, [content, hasUnsavedChanges, connectionStatus, isMobile]);

  // Handle text change with enhanced typing detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsTyping(true);

    // Clear previous typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator off after 1 second of no typing
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
    }, 1000);

    // Trigger auto-save with smart delays
    const isSmallChange = Math.abs(newContent.length - content.length) < 10;
    triggerAutoSave(newContent, isSmallChange);
  };

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveContent();
      }
      
      // Escape to close mobile menu
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveContent, isMobileMenuOpen]);

  // Load content on mount
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Get status info
  const getStatusInfo = () => {
    const statusConfig = {
      connected: { icon: Wifi, color: 'text-green-400', text: 'Connected', spin: false },
      disconnected: { icon: WifiOff, color: 'text-gray-400', text: 'Disconnected', spin: false },
      connecting: { icon: RefreshCw, color: 'text-yellow-400', text: 'Connecting...', spin: true },
      saving: { icon: Save, color: 'text-blue-400', text: isTyping ? 'Typing...' : 'Saving...', spin: true },
      error: { icon: WifiOff, color: 'text-red-400', text: 'Connection Error', spin: false }
    };

    return statusConfig[connectionStatus];
  };

  const statusInfo = getStatusInfo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-notepad-bg">
        <div className="text-center p-4">
          <RefreshCw className="w-8 h-8 text-notepad-accent animate-spin mx-auto mb-4" />
          <p className="text-notepad-text">Loading Google Docs...</p>
          {isMobile && (
            <div className="flex items-center justify-center mt-2 text-sm text-notepad-text/70">
              <Smartphone className="w-4 h-4 mr-1" />
              <span>Mobile Mode</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col bg-notepad-bg text-notepad-text ${className}`}>
      {/* Mobile Header with Hamburger Menu */}
      {isMobile ? (
        <header className="flex items-center justify-between px-4 py-3 bg-notepad-bg border-b border-notepad-border">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-notepad-accent" />
            <h1 className="text-base font-semibold">Google Docs Notepad</h1>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Unsaved changes" />
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded hover:bg-notepad-border transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>
      ) : (
        /* Desktop Header */
        <header className="flex items-center justify-between px-4 py-2 bg-notepad-bg border-b border-notepad-border">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-notepad-accent" />
            <h1 className="text-lg font-semibold">Google Docs Notepad</h1>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Unsaved changes" />
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm">
            {/* Document info */}
            {documentInfo && (
              <div className="hidden md:flex items-center space-x-4 text-notepad-text/70">
                <div className="flex items-center space-x-1">
                  <Hash className="w-4 h-4" />
                  <span>{content.length} chars</span>
                </div>
                {lastSaved && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Connection status */}
            <div className="flex items-center space-x-2">
              <statusInfo.icon 
                className={`w-4 h-4 ${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''}`} 
              />
              <span className={`${statusInfo.color} hidden sm:inline`}>{statusInfo.text}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => saveContent()}
                disabled={!hasUnsavedChanges || connectionStatus === 'saving'}
                className="flex items-center space-x-2 px-3 py-1 rounded bg-notepad-accent/10 border border-notepad-accent/20 hover:bg-notepad-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>

              <button
                onClick={loadContent}
                disabled={connectionStatus === 'connecting'}
                className="p-1 rounded hover:bg-notepad-border transition-colors"
                title="Refresh content"
              >
                <RefreshCw className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="bg-notepad-bg border-b border-notepad-border p-4 space-y-4">
          {/* Stats */}
          {documentInfo && (
            <div className="flex items-center justify-between text-sm text-notepad-text/70">
              <div className="flex items-center space-x-1">
                <Hash className="w-4 h-4" />
                <span>{content.length} characters</span>
              </div>
              {lastSaved && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => saveContent()}
              disabled={!hasUnsavedChanges || connectionStatus === 'saving'}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded bg-notepad-accent/10 border border-notepad-accent/20 hover:bg-notepad-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Manual Save</span>
            </button>

            <button
              onClick={loadContent}
              disabled={connectionStatus === 'connecting'}
              className="px-4 py-2 rounded hover:bg-notepad-border transition-colors"
              title="Refresh content"
            >
              <RefreshCw className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            <statusInfo.icon 
              className={`w-4 h-4 ${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''}`} 
            />
            <span className={statusInfo.color}>{statusInfo.text}</span>
          </div>
        </div>
      )}

      {/* Editor */}
      <main className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          className={`w-full h-full p-4 md:p-6 bg-transparent text-notepad-text notepad-editor resize-none border-none focus:outline-none placeholder-notepad-text/50 ${isMobile ? 'text-sm leading-relaxed' : 'text-base'}`}
          placeholder={`Start typing your notes here...

💡 Tips:
- Content auto-saves ${isMobile ? 'every 1-2 seconds' : 'every 2 seconds'}
- Press ${isMobile ? 'Menu → Manual Save' : 'Ctrl+S'} for instant save
- All changes sync to Google Docs in real-time
${isMobile ? '- Swipe down to refresh if needed' : ''}

Start writing your thoughts, ideas, or code!`}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
        />

        {/* Mobile typing indicator */}
        {isMobile && isTyping && (
          <div className="absolute bottom-4 right-4 bg-notepad-accent/20 text-notepad-accent px-3 py-1 rounded-full text-xs">
            Typing...
          </div>
        )}
      </main>

      {/* Footer status */}
      <footer className="px-4 py-2 bg-notepad-bg border-t border-notepad-border">
        <div className={`flex items-center ${isMobile ? 'justify-center' : 'justify-between'} text-xs text-notepad-text/70`}>
          {!isMobile && documentInfo && (
            <div className="flex items-center space-x-4">
              <span>Document ID: {documentInfo.documentId.slice(0, 8)}...</span>
              <span>Last modified: {documentInfo.lastModified}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <span>Google Docs Real-time Sync</span>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' : 
              connectionStatus === 'error' ? 'bg-red-400' : 
              'bg-yellow-400'
            }`} />
            {isMobile && (
              <>
                <span>•</span>
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Notepad; 