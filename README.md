# THIS ScrollBlocker
Vue/Nuxt module integration for a scrollBlocker wrapper. Requires a minimal version of nuxt 2.15+


### Requirements
- Nuxt


### Usage in Nuxt

Install module dependencies
``` bash
$ npm install @this/scroll-blocker
```

Add module in nuxt.config.js
``` js
modules: [
    '@this/scroll-blocker'
]    
```

Add default options in nuxt.config.js
``` js
import {
    scrollBlockerNuxtConfig
} from './nuxt.config/index';

scrollBlocker: {
    ...scrollBlockerNuxtConfig(this)
} 
```
