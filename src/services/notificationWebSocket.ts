/**
 * Notification WebSocket Service
 * Uses STOMP protocol over SockJS for real-time notifications
 */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Notification } from '@/types/notification';

/**
 * WebSocket URL
 * - BE docs (NOTIFICATION_SYSTEM_FE_INTEGRATION_GUIDE.md & FE_READY):
 *   Local: ws://localhost:8081/ws  (SockJS factory should use http://localhost:8081/ws)
 *   Production: Must use HTTPS/WSS (e.g., https://pdcms.duckdns.org/ws or wss://pdcms.duckdns.org/ws)
 * - FE uses env for flexibility; if env is missing, follow BE guide as default.
 *
 * Dev example:
 *   NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
 * Production example:
 *   NEXT_PUBLIC_WS_URL=https://pdcms.duckdns.org/ws
 * 
 * Security: Browser blocks insecure WebSocket (HTTP/WS) from HTTPS pages.
 * In production, must use secure WebSocket (HTTPS/WSS).
 */
const getWebSocketUrl = (): string | null => {
  // Check if WebSocket URL is explicitly set
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  
  // If no env URL, use default based on environment
  if (!envUrl) {
    // In production (Vercel), disable WebSocket if no secure URL configured
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      console.warn('[WS] Production environment detected but NEXT_PUBLIC_WS_URL not set. WebSocket disabled.');
      return null;
    }
    // Development: use localhost
    return 'http://localhost:8080/ws';
  }
  
  // If env URL is set, validate it matches current page protocol
  if (typeof window !== 'undefined') {
    const isHttps = window.location.protocol === 'https:';
    const isSecureUrl = envUrl.startsWith('https://') || envUrl.startsWith('wss://');
    
    // Block insecure WebSocket from HTTPS page
    if (isHttps && !isSecureUrl) {
      console.error(
        '[WS] SecurityError: Cannot use insecure WebSocket (HTTP/WS) from HTTPS page.',
        'Please set NEXT_PUBLIC_WS_URL to HTTPS/WSS URL in production.'
      );
      return null;
    }
  }
  
  return envUrl;
};

const WS_URL = getWebSocketUrl();

type NotificationCallback = (notification: Notification) => void;

class NotificationWebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private subscriptions: Map<number, StompSubscription> = new Map();
  private callbacks: Set<NotificationCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   * @param token - JWT access token
   * @param userId - User ID to subscribe to notifications
   */
  connect(token: string, userId: number): void {
    if (this.isConnected && this.client?.connected) {
      console.log('[WS] Already connected');
      return;
    }

    // Check if WebSocket URL is available (null means disabled in production)
    if (!WS_URL) {
      console.warn('[WS] WebSocket connection disabled. Notifications will only work via REST API polling.');
      return;
    }

    // Create SockJS instance for fallback support
    const socket = new SockJS(WS_URL);

    // Create STOMP client
    this.client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[STOMP]', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // On successful connection
    this.client.onConnect = () => {
      console.log('[WS] Connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Subscribe to personal notifications
      this.subscribeToNotifications(userId);
    };

    // On connection error
    this.client.onStompError = (frame) => {
      console.error('[WS] STOMP Error:', frame.headers['message']);
      console.error('[WS] Details:', frame.body);
    };

    // On disconnect
    this.client.onDisconnect = () => {
      console.log('[WS] Disconnected');
      this.isConnected = false;
    };

    // On WebSocket close
    this.client.onWebSocketClose = () => {
      console.log('[WS] WebSocket closed');
      this.isConnected = false;
      
      // Auto reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`[WS] Reconnecting... attempt ${this.reconnectAttempts}`);
      }
    };

    // Activate connection
    this.client.activate();
  }

  /**
   * Subscribe to user's notification channel
   */
  private subscribeToNotifications(userId: number): void {
    if (!this.client || !this.isConnected) {
      console.error('[WS] Cannot subscribe - not connected');
      return;
    }

    const destination = `/topic/notifications/${userId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(userId)) {
      this.subscriptions.get(userId)?.unsubscribe();
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const notification: Notification = JSON.parse(message.body);
        console.log('[WS] New notification:', notification);

        // Notify all registered callbacks
        this.callbacks.forEach((callback) => {
          try {
            callback(notification);
          } catch (err) {
            console.error('[WS] Callback error:', err);
          }
        });

        // Dispatch custom event for global listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('notification:received', {
              detail: notification,
            })
          );
        }
      } catch (err) {
        console.error('[WS] Failed to parse notification:', err);
      }
    });

    this.subscriptions.set(userId, subscription);
    console.log(`[WS] Subscribed to ${destination}`);
  }

  /**
   * Register a callback for new notifications
   */
  onNotification(callback: NotificationCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.client) {
      // Unsubscribe all
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      this.callbacks.clear();

      // Deactivate client
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      console.log('[WS] Disconnected and cleaned up');
    }
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected && (this.client?.connected ?? false);
  }
}

// Export singleton instance
export const notificationWebSocket = new NotificationWebSocketService();


