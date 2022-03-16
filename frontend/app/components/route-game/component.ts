import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import Component from '@glint/environment-ember-loose/glimmer-component';

import { COLOURS, MIN_PLAYERS, CardType, Colour, Wild, MAX_PLAYERS } from 'red-green-blue-yellow-numbers/lib/shared';
import SocketService from 'red-green-blue-yellow-numbers/services/socket';

export default class RouteGame extends Component {
  @service declare socket: SocketService;

  colours = COLOURS;
  maxPlayers = MAX_PLAYERS;
  minPlayers = MIN_PLAYERS;
  @tracked wildCardTypePlaying: Wild | null = null;

  get game() {
    return this.socket.game;
  }

  get notEnoughPlayers() {
    const playersLength = this.game?.players.length;
    return !playersLength || playersLength < this.minPlayers;
  }

  get player() {
    return this.socket.player;
  }

  @action
  handlePlayCard(cardType: CardType, colour: Colour | null) {
    if (colour === null) {
      this.wildCardTypePlaying = cardType as Wild;
      return;
    }

    this.wildCardTypePlaying = null;

    return this.socket.playCard(cardType, colour);
  }

  @action
  handleStart() {
    return this.socket.startGame();
  }

  @action
  handleTakeCard() {
    return this.socket.takeCard();
  }

  async willDestroy() {
    if (this.socket.game) {
      await this.socket.leaveGame();
    }

    super.willDestroy();
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RouteGame: typeof RouteGame;
  }
}
