import { action } from '@ember/object';
import RouterService from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import Component from '@glint/environment-ember-loose/glimmer-component';

import { ID_LENGTH, MAX_NAME_LENGTH } from 'red-green-blue-yellow-numbers/lib/shared';
import SocketService from 'red-green-blue-yellow-numbers/services/socket';

export default class RouteIndex extends Component {
  @service declare router: RouterService;
  @service declare socket: SocketService;

  @tracked createInFlight = false;
  @tracked createName = '';
  @tracked joinId = '';
  @tracked joinInFlight = false;
  @tracked joinName = '';
  idLength = ID_LENGTH;
  maxNameLength = MAX_NAME_LENGTH;

  @action
  async handleCreateSubmit(event: Event) {
    event.preventDefault();

    try {
      this.createInFlight = true;
      const { id } = await this.socket.createGame();
      await this.socket.joinGame(id, this.createName.trim());
      this.router.transitionTo('game');
    } finally {
      this.createInFlight = false;
    }
  }

  @action
  handleInput(key: 'createName' | 'joinId' | 'joinName', event: InputEvent) {
    this[key] = (event.target as HTMLInputElement).value;
  }

  @action
  handleJoinIdBeforeInput(event: InputEvent) {
    const { data } = event;
    if (data && /[^0-9]/.test(data)) {
      event.preventDefault();
    }
  }

  @action
  async handleJoinSubmit(event: Event) {
    event.preventDefault();

    try {
      this.joinInFlight = true;
      await this.socket.joinGame(this.joinId, this.joinName);
      this.router.transitionTo('game');
    } finally {
      this.joinInFlight = false;
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RouteIndex: typeof RouteIndex;
  }
}
