import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { io } from 'socket.io-client';

import { CardType, Colour, SerializedGame } from 'red-green-blue-yellow-numbers/lib/shared';

export default class SocketService extends Service {
  @tracked connected = false;
  @tracked game: SerializedGame | null = null;
  name: string | null = null;
  socket = io();

  get player() {
    return this.game?.players.find((player) => player.name === this.name) ?? null;
  }

  constructor() {
    super(...arguments);

    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.game = null;
      this.connected = false;
    });

    this.socket.on('game_data', (game: SerializedGame) => {
      this.game = game;
    });
  }

  _sendMessage(name: string, data: Record<string, unknown> = {}) {
    return new Promise((resolve, reject) => {
      this.socket.emit(name, data, (success: boolean, responseData: Record<string, unknown> = {}) => {
        if (success) {
          resolve(responseData);
        } else {
          reject(responseData);
        }
      });
    });
  }

  createGame() {
    return this._sendMessage('game_create') as Promise<{ id: string }>;
  }

  async joinGame(id: string, name: string) {
    const response = await this._sendMessage('game_join', {
      id,
      name
    });
    this.name = name;
    return response;
  }

  playCard(type: CardType, colour: Colour) {
    return this._sendMessage('game_play_card', {
      colour,
      type
    });
  }

  startGame() {
    return this._sendMessage('game_start');
  }

  takeCard() {
    return this._sendMessage('game_take_card');
  }
}
