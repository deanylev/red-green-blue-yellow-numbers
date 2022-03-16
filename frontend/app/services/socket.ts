import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { io } from 'socket.io-client';

import { CardType, Colour, FailureReason, SerializedGame } from 'red-green-blue-yellow-numbers/lib/shared';

export default class SocketService extends Service {
  @service declare notify: any;

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

  _failureReasonToMessage(reason: FailureReason): string {
    switch (reason) {
      case FailureReason.ALREADY_IN_GAME:
        return 'You are already in a game.';
      case FailureReason.CARD_NOT_PLAYABLE:
        return 'You cannot play that card.';
      case FailureReason.GAME_EMPTY:
        return 'The game does not have enough players.';
      case FailureReason.GAME_FULL:
        return 'This game is already full.';
      case FailureReason.GAME_NOT_FOUND:
        return 'A game with that ID was not found.';
      case FailureReason.GAME_NOT_STARTED:
        return 'The game has not started yet.';
      case FailureReason.GAME_STARTED:
        return 'The game has already started.';
      case FailureReason.NAME_INVALID:
        return 'That name is too long.';
      case FailureReason.NAME_TAKEN:
        return 'That name has already taken by someone else in this game.';
      case FailureReason.NOT_IN_GAME:
        return 'You are not in a game.';
      case FailureReason.NOT_PLAYER_TURN:
        return 'It is not your turn.';
      case FailureReason.PARAMS:
        return 'An error occurred.';
      case FailureReason.PLAYER_MISSING_CARD:
        return 'You do not have that card in your hand.';
      case FailureReason.PLAYER_NOT_HOST:
        return 'You are not the host.';
    }
  }

  _sendMessage(name: string, data: Record<string, unknown> = {}) {
    return new Promise((resolve, reject) => {
      this.socket.emit(name, data, (success: boolean, responseData: Record<string, unknown> = {}) => {
        if (success) {
          resolve(responseData);
        } else {
          if (responseData.reason) {
            const message = this._failureReasonToMessage(responseData.reason as FailureReason) ?? 'Something went wrong.';
            this.notify.alert(message);
          }

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

  async leaveGame() {
    const response = await this._sendMessage('game_leave');
    this.game = null;
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
