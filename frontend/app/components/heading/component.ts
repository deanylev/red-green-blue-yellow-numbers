import Component from '@glint/environment-ember-loose/glimmer-component';

interface Signature {
  Args: {
    text: string;
  };
}

export default class Heading extends Component<Signature> {}
