/**
 * Contains information about an HTML element that will be misplaced when the scrollbar is removed and the property used to fix this.
 * @typedef {Object} MisplacedElement
 * @property {HTMLElement|NodeList} element - An HTML element or a NodeList with HTML elements that are misplaced when the scrollbar is removed.
 * @property {string} property - A CSS property used to fix the elements misplacement.
 */

/**
 * An Object representing the ScrollBlocker class constructor `options`.
 * @typedef {Object} Options
 * @property {Array<MisplacedElement>} misplacedElements - An array with elements that will to be misplaced when the scrollbar is removed.
 * @property {string} className - A classname string which will be set on the `documentElement` to block page scrolling.
 */

/**
 * A function that returns a list with MisplacedElement items.
 * @function
 * @name TypeFnGetMisplacedElements
 * @return {Array<MisplacedElement>} - An array with MisplacedElement items.
 */

/**
 * Handles the scroll blocking of the documents root element.
 * @version 2.1.0
 * @author Sascha Quasthoff
 * @class ScrollBlocker
 */
export class ScrollBlocker {

    /**
     * Holds the instance of the ScrollBlocker class.
     * @static
     * @private
     * @type {Object}
     */
    static #instance;

    /**
     * Holds the actually used options.
     * @default {}
     * @private
     * @type {Options}
     */
    #options = {};

    /**
     * Holds an array of HTML elements misplaced when scrollbar is removed.
     * @default []
     * @private
     * @type {array<TypeFnGetMisplacedElements>}
     */
    #misplacedElements = [];

    /**
     * Holds the provided breakpoint string.
     * @private
     * @type {string|undefined}
     */
    #breakpoint;

    /**
     * Holds the timer created in the window.resize handler.
     * @private
     * @type {number|undefined}
     */
    #resizeTimer;

    /**
     * Holds the number of times the scroll blocking has been enabled.
     * @default 0
     * @private
     * @type {number}
     */
    #numberOfCalls = 0;

    /**
     * Creates an instance of ScrollBlocker.
     * @param {Options} [options = {}]
     */
    constructor(options = {}) {

        this.#options = {
            className: 'has-no-scroll',
            misplacedElements: [],
            ...options
        };
    }

    /**
     * Returns true if the number of calls is greather than 0.
     * @return {boolean}
     */
    get isEnabled() {
        return this.#numberOfCalls > 0;
    }

    /**
     * Checks whether the scroll lock should be enabled based on the breakpoint size.
     * Returns true when no breakpoint is provided or breakpoint size is greater than `window.innerWidth`.
     * @private
     * @return {boolean}
     */
    #shouldBeLocked() {
        return this.#breakpoint === undefined ||
            parseInt(this.#breakpoint) > window.innerWidth;
    }

    /**
     * Increases the number of calls by `1`.
     * @private
     * @return {void}
     */
    #increaseCount() {
        this.#numberOfCalls = this.#numberOfCalls + 1;
    }

    /**
     * Decreases the number of calls by `1`.
     * @private
     * @return {void}
     */
    #decreaseCount() {
        this.#numberOfCalls = this.#numberOfCalls - 1;
    }

    /**
     * Sets the number of calls `0`.
     * @private
     * @return {void}
     */
    #resetCount() {
        this.#numberOfCalls = 0;
    }

    /**
     * When the scrollbar is visible, stores the current window scroll position and adjusts
     * the placement of the misplaced elements. Does nothing if scrollbar is not visible.
     * @private
     * @return {void}
     */
    #adjustElementPositions() {
        document.body.style.top = window.scrollY ? `-${window.scrollY}px` : '';

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        if (scrollbarWidth <= 0) {
            return;
        }

        this.#adjustMisplacedElements(`${scrollbarWidth}px`);
    }

    /**
     * Restores the previously stored window scroll position.
     * @private
     * @return {void}
     */
    #restoreElementPositions() {
        this.#adjustMisplacedElements('');

        const bodyTop = parseInt(document.body.style.top);
        const scrollTop = (bodyTop || 0) * -1;

        document.body.style.top = null;
        window.scrollTo(0, scrollTop);
    }

    /**
     * Iterates over every `element` in `this.#misplacedElements` and sets its `property` to `value`. If element is a function that returns the list of misplaced elements, it will be executed before.
     * @private
     * @param {string} value - A property value
     * @return {void}
     */
    #adjustMisplacedElements(value) {
        document.documentElement.style.marginRight = value;

        window.requestAnimationFrame(() => {

            this.#misplacedElements
                .map( fn => typeof fn === 'function' ? fn() : fn )
                .flat()
                .filter(misplacedElement => misplacedElement && misplacedElement.element)
                .forEach(({ element, property }) => {

                    if (element instanceof window.NodeList) {
                        element.forEach(node => node.style[property] = value);
                        return;
                    }

                    element.style[property] = value;
                });
        });
    }

    /**
     * Adds `this.#options.className` to `documentElement`s `classList`.
     * @private
     * @return {void}
     */
    #addClassName() {
        document.documentElement.classList.add(this.#options.className);
    }

    /**
     * Removes `this.#options.className` from `documentElement`s `classList`.
     * @private
     * @return {void}
     */
    #removeClassName() {
        document.documentElement.classList.remove(this.#options.className);
    }

    /**
     * `window.resize` handler, re-initiates the check whether scroll lock should be enabled or disabled.
     * @private
     * @return {void}
     */
    #handleResize() {
        clearTimeout(this.#resizeTimer);

        this.#resizeTimer = setTimeout(() => {
            this.#shouldBeLocked() ? this.enable() : this.disable();
        }, 100);
    }

    /**
     * Enables the scroll blocking on `documentElement`. Preserves the window scroll position and fixes the positions of `misplacedElements`.
     * @param {Object} [param = {}] - An object containing parameters.
     * @param {string} [param.breakpoint = this.#breakpoint] - Represents a breakpoint up to which the page scrolling will be blocked.
     * @param {TypeFnGetMisplacedElements} [param.misplacedElements] - A function that returns a list of elements that are going to be misplaced when the scrollbar is removed.
     * @return {void}
     */
    enable({
        breakpoint = this.#breakpoint,
        misplacedElements
    } = {}) {
        this.#breakpoint = breakpoint;

        if (!this.#shouldBeLocked()) {
            return;
        }

        this.#misplacedElements = [
            this.#options.misplacedElements,
            misplacedElements
        ];

        if (!this.isEnabled) {
            this.#adjustElementPositions();
            this.#addClassName();
        }

        if (breakpoint) {
            window.addEventListener('resize', this.#handleResize.bind(this));
        }

        this.#increaseCount();
    }

    /**
     * Removes blocking of page scrolling, restores the window scroll position and enables page scrolling on the `documentElement`.
     * @param {boolean} [force = false]
     * @return {void}
     */
    disable(force = false) {
        if (!this.isEnabled) {
            return;
        }

        if (force) {
            this.#resetCount();
        } else {
            this.#decreaseCount();
        }

        if (this.isEnabled) {
            return;
        }

        this.#removeClassName();
        this.#restoreElementPositions();
        window.removeEventListener('resize', this.#handleResize.bind(this));
    }
}
