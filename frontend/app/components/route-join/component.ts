import { action } from '@ember/object';
import RouterService from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import Component from '@glint/environment-ember-loose/glimmer-component';

import SocketService from 'red-green-blue-yellow-numbers/services/socket';

export default class RouteJoin extends Component {
  @service declare router: RouterService;
  @service declare socket: SocketService;

  @tracked id = '';
  @tracked name = '';

  @action
  handleIdKeyup(event: Event) {
    this.id = (event.target as HTMLInputElement).value;
  }

  @action
  handleNameKeyup(event: Event) {
    this.name = (event.target as HTMLInputElement).value;
  }

  @action
  async handleSubmit(event: Event) {
    event.preventDefault();

    await this.socket.joinGame(this.id, this.name);
    this.router.transitionTo('game');
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RouteJoin: typeof RouteJoin;
  }
}
