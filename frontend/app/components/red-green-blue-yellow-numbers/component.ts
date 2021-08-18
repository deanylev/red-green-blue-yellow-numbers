import { inject as service } from '@ember/service';
import Component from '@glint/environment-ember-loose/glimmer-component';

import SocketService from 'red-green-blue-yellow-numbers/services/socket';

interface Signature {
  Yields: {
    default?: [];
  };
}

export default class RedGreenBlueYellowNumbers extends Component<Signature> {
  @service declare socket: SocketService;
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RedGreenBlueYellowNumbers: typeof RedGreenBlueYellowNumbers;
  }
}
