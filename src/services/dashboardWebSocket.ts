import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface DashboardWebSocketMessage {
  type: 'OVERVIEW' | 'REVENUE' | 'APPOINTMENTS' | 'INVOICES' | 'EMPLOYEES' | 'WAREHOUSE';
  data: any;
  timestamp: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectDelay?: number;
  heartbeatIncoming?: number;
  heartbeatOutgoing?: number;
}

export class DashboardWebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private subscriptions: Map<string, any> = new Map();
  private messageHandlers: Map<string, (message: DashboardWebSocketMessage) => void> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(private config: WebSocketConfig) {
    this.config.reconnectDelay = config.reconnectDelay || 5000;
    this.config.heartbeatIncoming = config.heartbeatIncoming || 20000;
    this.config.heartbeatOutgoing = config.heartbeatOutgoing || 20000;
  }

  /**
   * Connect to WebSocket server
   */
  connect(onConnect?: () => void, onError?: (error: any) => void): void {
    if (this.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      this.client = new Client({
        webSocketFactory: () => new SockJS(this.config.url),
        reconnectDelay: this.config.reconnectDelay,
        heartbeatIncoming: this.config.heartbeatIncoming,
        heartbeatOutgoing: this.config.heartbeatOutgoing,
        
        onConnect: () => {
          console.log('[WebSocket] Connected successfully');
          this.connected = true;
          this.reconnectAttempts = 0;
          
          // Resubscribe to all topics
          this.resubscribe();
          
          if (onConnect) onConnect();
        },
        
        onStompError: (frame) => {
          console.error('[WebSocket] STOMP error:', frame);
          this.connected = false;
          if (onError) onError(frame);
        },
        
        onWebSocketError: (event) => {
          console.error('[WebSocket] WebSocket error:', event);
          this.connected = false;
          if (onError) onError(event);
        },
        
        onDisconnect: () => {
          console.log('[WebSocket] Disconnected');
          this.connected = false;
          this.attemptReconnect();
        },
      });

      this.client.activate();
      console.log('[WebSocket] Connecting to', this.config.url);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.connected = false;
      if (onError) onError(error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.client) {
      console.log('[WebSocket] Disconnecting...');
      this.client.deactivate();
      this.connected = false;
      this.subscriptions.clear();
      this.messageHandlers.clear();
    }
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, handler: (message: DashboardWebSocketMessage) => void): void {
    if (!this.client) {
      console.error('[WebSocket] Client not initialized');
      return;
    }

    // Store handler for reconnection
    this.messageHandlers.set(topic, handler);

    if (!this.connected) {
      console.log('[WebSocket] Not connected, will subscribe when connected');
      return;
    }

    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log(`[WebSocket] Received message from ${topic}:`, data);
        handler(data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });

    this.subscriptions.set(topic, subscription);
    console.log(`[WebSocket] Subscribed to ${topic}`);
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string): void {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
      this.messageHandlers.delete(topic);
      console.log(`[WebSocket] Unsubscribed from ${topic}`);
    }
  }

  /**
   * Publish a message to a topic
   */
  publish(destination: string, body: any): void {
    if (!this.client || !this.connected) {
      console.error('[WebSocket] Not connected, cannot publish');
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
      console.log(`[WebSocket] Published to ${destination}:`, body);
    } catch (error) {
      console.error('[WebSocket] Error publishing message:', error);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Resubscribe to all topics after reconnection
   */
  private resubscribe(): void {
    console.log('[WebSocket] Resubscribing to topics...');
    const handlers = Array.from(this.messageHandlers.entries());
    this.subscriptions.clear();
    
    handlers.forEach(([topic, handler]) => {
      this.subscribe(topic, handler);
    });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      if (!this.connected && this.client) {
        this.client.activate();
      }
    }, this.config.reconnectDelay);
  }
}

// Singleton instance
let dashboardWebSocketInstance: DashboardWebSocketService | null = null;

/**
 * Get or create WebSocket service instance
 */
export function getDashboardWebSocket(): DashboardWebSocketService {
  if (!dashboardWebSocketInstance) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://pdcms.duckdns.org/ws';
    // const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';
    dashboardWebSocketInstance = new DashboardWebSocketService({
      url: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 20000,
      heartbeatOutgoing: 20000,
    });
  }
  return dashboardWebSocketInstance;
}

/**
 * Dashboard-specific WebSocket topics
 */
export const DASHBOARD_TOPICS = {
  OVERVIEW: '/topic/dashboard/overview',
  REVENUE: '/topic/dashboard/revenue',
  APPOINTMENTS: '/topic/dashboard/appointments',
  INVOICES: '/topic/dashboard/invoices',
  EMPLOYEES: '/topic/dashboard/employees',
  WAREHOUSE: '/topic/dashboard/warehouse',
  ALERTS: '/topic/dashboard/alerts',
} as const;
