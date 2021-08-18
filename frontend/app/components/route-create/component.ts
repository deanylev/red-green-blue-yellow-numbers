import { action } from '@ember/object';
import RouterService from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import Component from '@glint/environment-ember-loose/glimmer-component';

import SocketService from 'red-green-blue-yellow-numbers/services/socket';

export default class RouteCreate extends Component {
  @service declare router: RouterService;
  @service declare socket: SocketService;

  @tracked name = '';

  @action
  handleNameKeyup(event: Event) {
    this.name = (event.target as HTMLInputElement).value;
  }

  @action
  async handleSubmit(event: Event) {
    event.preventDefault();

    const { id } = await this.socket.createGame();
    await this.socket.joinGame(id, this.name);
    this.router.transitionTo('game');
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RouteCreate: typeof RouteCreate;
  }
}
