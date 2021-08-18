import Component from '@glint/environment-ember-loose/glimmer-component';

export default class RouteIndex extends Component {

}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RouteIndex: typeof RouteIndex;
  }
}
