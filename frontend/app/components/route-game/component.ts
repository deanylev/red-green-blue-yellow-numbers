import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import Component from '@glint/environment-ember-loose/glimmer-component';

import { COLOURS, CardType, Colour, Wild } from 'red-green-blue-yellow-numbers/lib/shared';
import SocketService from 'red-green-blue-yellow-numbers/services/socket';

export default class RouteGame extends Component {
  @service declare socket: SocketService;

  colours = COLOURS;
  @tracked wildCardTypePlaying: Wild | null = null;

  get game() {
    return this.socket.game;
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
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RouteGame: typeof RouteGame;
  }
}
