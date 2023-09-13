/**
 * ScrollBlocker
 *
 * @description Vue/Nuxt module integration for a ScrollBlocker wrapper.
 * Requires a minimal version of nuxt 2.15+
 *
 * @version 1.0.0
 * @author Charly Wolff
 *
 */

import { join } from 'path';

export default function(moduleOptions) {

    const { nuxt } = this;
    const nuxtConfig = nuxt.options;

    const options = {
        ...nuxtConfig.scrollBlocker,
        ...moduleOptions
    };

    /**
     * Add the ScrollBlocker Class as Vue 2 Plugin
     */
    this.addPlugin({
        src: join(__dirname, 'plugin.js'),
        fileName: `this/scroll-blocker.js`,
        options: options
    });

}
