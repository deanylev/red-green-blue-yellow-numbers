import Component from '@glint/environment-ember-loose/glimmer-component';

interface Signature {
  Args: {
    reverse?: boolean;
  };
}

export default class ColouredBars extends Component<Signature> {}
