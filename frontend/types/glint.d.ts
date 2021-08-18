import '@glint/environment-ember-loose/registry';

import AndHelper from '@gavant/glint-template-types/types/ember-truth-helpers/and';

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    and: typeof AndHelper;
  }
}
