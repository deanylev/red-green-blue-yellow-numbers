// Types for compiled templates
declare module 'red-green-blue-yellow-numbers/templates/*' {
  import { TemplateFactory } from 'htmlbars-inline-precompile';
  const tmpl: TemplateFactory;
  export default tmpl;
}
