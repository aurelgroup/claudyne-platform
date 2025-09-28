/**
 * Service WebSocket pour Claudyne
 * Gestion des Battle Royale en temps réel
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants/config';
import type { Battle, BattleParticipant, BattleQuestion } from '../types';

export interface BattleEvents {
  'battle:joined': (data: { battleId: string; participants: BattleParticipant[] }) => void;
  'battle:left': (data: { userId: string; battleId: string }) => void;
  'battle:started': (data: { battle: Battle; firstQuestion: BattleQuestion }) => void;
  'battle:question': (data: { question: BattleQuestion; timeRemaining: number }) => void;
  'battle:answer:result': (data: { isCorrect: boolean; score: number; leaderboard: BattleParticipant[] }) => void;
  'battle:ended': (data: { finalLeaderboard: BattleParticipant[]; winner: BattleParticipant }) => void;
  'battle:participant:joined': (data: { participant: BattleParticipant }) => void;
  'battle:participant:left': (data: { userId: string }) => void;
  'battle:error': (data: { message: string; code?: string }) => void;
  'connection:error': (error: Error) => void;
  'disconnect': (reason: string) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * Connexion au serveur WebSocket
   */
  async connect(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (!token) {
        // No authentication token available for WebSocket connection
        return false;
      }

      this.socket = io(API_CONFIG.BASE_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      this.setupEventHandlers();

      return new Promise((resolve) => {
        this.socket!.on('connect', () => {
          // WebSocket connected successfully
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          // WebSocket connection error
          this.isConnected = false;
          resolve(false);
        });

        // Timeout après 10 secondes
        setTimeout(() => {
          if (!this.isConnected) {
            // WebSocket connection timeout
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      // Error establishing WebSocket connection
      return false;
    }
  }

  /**
   * Configuration des gestionnaires d'événements WebSocket
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // WebSocket connected
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      // WebSocket disconnected
      this.isConnected = false;
      this.emit('disconnect', reason);

      // Tentative de reconnexion automatique
      if (reason === 'io server disconnect') {
        // Le serveur a fermé la connexion, ne pas reconnecter automatiquement
        return;
      }

      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      // WebSocket connection error
      this.isConnected = false;
      this.emit('connection:error', error);
      this.attemptReconnect();
    });

    // Événements spécifiques aux battles
    this.socket.on('battle:joined', (data) => this.emit('battle:joined', data));
    this.socket.on('battle:left', (data) => this.emit('battle:left', data));
    this.socket.on('battle:started', (data) => this.emit('battle:started', data));
    this.socket.on('battle:question', (data) => this.emit('battle:question', data));
    this.socket.on('battle:answer:result', (data) => this.emit('battle:answer:result', data));
    this.socket.on('battle:ended', (data) => this.emit('battle:ended', data));
    this.socket.on('battle:participant:joined', (data) => this.emit('battle:participant:joined', data));
    this.socket.on('battle:participant:left', (data) => this.emit('battle:participant:left', data));
    this.socket.on('battle:error', (data) => this.emit('battle:error', data));
  }

  /**
   * Tentative de reconnexion automatique
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Max reconnection attempts reached
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    // Attempting to reconnect

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Déconnexion du WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.eventListeners.clear();
  }

  /**
   * Rejoindre une battle
   */
  joinBattle(battleId: string): void {
    if (!this.isConnected || !this.socket) {
      // WebSocket not connected
      return;
    }

    this.socket.emit('battle:join', { battleId });
  }

  /**
   * Quitter une battle
   */
  leaveBattle(battleId: string): void {
    if (!this.isConnected || !this.socket) {
      // WebSocket not connected
      return;
    }

    this.socket.emit('battle:leave', { battleId });
  }

  /**
   * Soumettre une réponse dans une battle
   */
  submitAnswer(battleId: string, questionId: string, answer: any): void {
    if (!this.isConnected || !this.socket) {
      // WebSocket not connected
      return;
    }

    this.socket.emit('battle:answer', {
      battleId,
      questionId,
      answer,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Écouter un événement
   */
  on<K extends keyof BattleEvents>(event: K, callback: BattleEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Arrêter d'écouter un événement
   */
  off<K extends keyof BattleEvents>(event: K, callback: BattleEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Émettre un événement vers les écouteurs
   */
  private emit<K extends keyof BattleEvents>(event: K, data: Parameters<BattleEvents[K]>[0]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as any)(data);
        } catch (error) {
          // Error in event listener
        }
      });
    }
  }

  /**
   * État de la connexion
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Ping du serveur pour tester la connexion
   */
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const start = Date.now();
      this.socket.emit('ping', (response: any) => {
        const latency = Date.now() - start;
        resolve(latency);
      });

      // Timeout après 5 secondes
      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }
}

export default new WebSocketService();