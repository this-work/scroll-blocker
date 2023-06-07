import { ScrollBlocker } from '../vanilla/ScrollBlocker';

/**
 *
 * Inject the ScrollBlocker Class as Vue 2 Plugin
 * Can be used in vue 2 context with this.$scrollBlocker
 * @param {function} inject From vue  2 given inject function. Inject something (Param 2) under given name (Param 1) in the vue context
 *
 */
export default ({}, inject) => {
    inject('scrollBlocker', new ScrollBlocker());
};
