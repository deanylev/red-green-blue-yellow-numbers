import EmberRouter from '@ember/routing/router';
import config from 'red-green-blue-yellow-numbers/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('create');
  this.route('game');
  this.route('join');
});
