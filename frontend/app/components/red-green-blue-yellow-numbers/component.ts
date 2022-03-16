import { inject as service } from '@ember/service';
import Component from '@glint/environment-ember-loose/glimmer-component';

import LaddaButtonService from 'ember-ladda-button/services/ladda-button';
import SocketService from 'red-green-blue-yellow-numbers/services/socket';

interface Signature {
  Yields: {
    default?: [];
  };
}

export default class RedGreenBlueYellowNumbers extends Component<Signature> {
  @service declare laddaButton: LaddaButtonService;
  @service declare socket: SocketService;

  constructor(owner: unknown, args: Record<string, never>) {
    super(owner, args);

    this.laddaButton.buttonStyle = 'zoom-out';
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RedGreenBlueYellowNumbers: typeof RedGreenBlueYellowNumbers;
  }
}
