import chai, { expect } from 'chai';
import { JSDOM } from 'jsdom';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import defaultExport, { ScrollBlocker } from '../src/vanilla/ScrollBlocker';

chai.use(sinonChai);

const defaultClassName = 'has-no-scroll';
const rootContainsClassname = className => document.documentElement.classList.contains(className);

let scrollBlocker;

describe('ScrollBlocker', () => {
    beforeEach(() => {
        const dom = new JSDOM('<!DOCTYPE html><html lang="en"><title>test</title><p>first<p>second');

        global.window = dom.window;
        global.document = window.document;
        global.window.scrollTo = sinon.fake((x, y) => {
            global.window.scrollX = x;
            global.window.scrollY = y;
        });

        global.window.addEventListener = sinon.fake();
        global.window.removeEventListener = sinon.fake();

        scrollBlocker = new ScrollBlocker();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('constructor()', () => {
        it('should create a new instance.', () => {
            expect(scrollBlocker).to.be.instanceOf(ScrollBlocker);
        });

        it('should overwrite the default `className` with the given one.', () => {
            const className = 'a-special-classname';

            new ScrollBlocker({ className }).enable();

            expect(rootContainsClassname(className)).to.be.true;
        });

        it('should overwrite the default `misplacedElements` with the given ones.', () => {
            const misplacedElements = [
                {
                    element: document.querySelector('p:nth-of-type(1)'),
                    property: 'margin-right'
                },
                {
                    element: document.querySelector('p:nth-of-type(2)'),
                    property: 'margin-left'
                }
            ];

            new ScrollBlocker({ misplacedElements }).enable();

            expect(document.querySelector('p:nth-of-type(1)').style.marginRight).to.equal('1024px');
            expect(document.querySelector('p:nth-of-type(2)').style.marginLeft).to.equal('1024px');
        });
    });

    describe('isEnabled', () => {
        describe('when `enable()` was called at least once more than `disable()`', () => {
            it('should be `true`.', () => {
                scrollBlocker.enable();
                scrollBlocker.enable();
                scrollBlocker.disable();

                expect(scrollBlocker.isEnabled).to.be.true;
            });

            describe('and `disable()` was called with parameter `force` equal to `true`.', () => {
                it('should be `false`.', () => {
                    scrollBlocker.enable();
                    scrollBlocker.enable();
                    scrollBlocker.disable(true);

                    expect(scrollBlocker.isEnabled).to.be.false;
                });
            });
        });

        describe('when `enable()` and `disable()` were called equally often', () => {
            it('should be `false`.', () => {
                scrollBlocker.enable();
                scrollBlocker.enable();
                scrollBlocker.disable();
                scrollBlocker.disable();

                expect(scrollBlocker.isEnabled).to.be.false;
            });
        });
    });

    describe('enable()', () => {
        it('should do nothing when given `breakpoint` is not `undefined` and it´s value is smaller then `window.innerWidth`.', () => {
            scrollBlocker.enable({ breakpoint: '800px' });

            expect(scrollBlocker.isEnabled).to.be.false;
        });

        it('should add the default className to the classList of `documentElement`.', () => {
            expect(rootContainsClassname(defaultClassName)).to.be.false;

            scrollBlocker.enable();

            expect(rootContainsClassname(defaultClassName)).to.be.true;
        });

        it('should set the scrollbar width as `margin-right` on the `documentElement`.', () => {
            scrollBlocker.enable();

            expect(document.documentElement.style.marginRight).to.equal('1024px');
        });

        it('should store the vertical window scroll position on the body.', () => {
            window.scrollTo(0, 1000);

            scrollBlocker.enable();

            expect(document.querySelector('body').style.top).to.equal('-1000px');
        });

        it('should adjust the styles of then given `misplacedElements`.', () => {
            const element = document.querySelector('p');

            scrollBlocker.enable({
                misplacedElements: [{
                    element,
                    property: 'margin-right'
                }]
            });

            expect(element.style.marginRight).to.equal('1024px');
        });

        it('should add a resize event listener on `window`.', () => {
            scrollBlocker.enable({ breakpoint: '2000px' });

            expect(window.addEventListener).to.have.been.calledOnceWith('resize');
        });
    });

    describe('disable()', () => {
        it('should do nothing when `disable()` is called without `enable()` having been called.', () => {
            expect(scrollBlocker.isEnabled).to.be.false;

            scrollBlocker.disable();

            expect(scrollBlocker.isEnabled).to.be.false;
        });

        it('should remove the default className from the classList of `documentElement`.', () => {
            scrollBlocker.enable();
            scrollBlocker.disable();

            expect(rootContainsClassname(defaultClassName)).to.be.false;
        });

        it('should call `window.scrollTo()` with the original window scroll position.', () => {
            window.scrollTo(0, 1000);

            scrollBlocker.enable();
            scrollBlocker.disable();

            expect(window.scrollTo).to.have.been.calledTwice;
            expect(window.scrollTo.getCall(0)).to.have.been.calledWith(0, 1000);
        });

        // This test is skipped because JSDom is not able to reset properties like 'margin-right' at the moment.
        // See https://github.com/jsdom/jsdom/issues/3372 and https://github.com/jsdom/cssstyle/pull/162.
        it.skip('should remove the scrollbar width adjustment on the `documentElement`.', () => {
            scrollBlocker.enable();
            expect(document.documentElement.style.marginRight).to.equal('1024px');

            scrollBlocker.disable();
            expect(document.documentElement.style.marginRight).to.equal('');
        });

        it('should remove the style adjustments of the `misplacedElements`.', () => {
            const element = document.querySelector('p');
            const scrollBlocker = new ScrollBlocker({
                misplacedElements: [{
                    element,
                    // The property 'margin' is used here instead of a more specific one like 'margin-right'
                    // because JSDom is not able to reset properties like 'margin-right' at the moment.
                    // See https://github.com/jsdom/jsdom/issues/3372 and https://github.com/jsdom/cssstyle/pull/162.
                    property: 'margin'
                }]
            });

            scrollBlocker.enable();
            scrollBlocker.disable();

            expect(element.style.marginRight).to.equal('');
        });

        it('should remove a resize event listener on `window`.', () => {
            scrollBlocker.enable();
            scrollBlocker.disable();

            expect(window.removeEventListener).to.have.been.calledOnceWith('resize');
        });
    });

    describe('#adjustElementPositions()', () => {
        it('should not adjust any stylings when no scrollbar is present.', () => {
            window.innerWidth = 0;

            scrollBlocker.enable();

            expect(document.body.style.top).to.equal('');
        });
    });

    describe('#handleResize', () => {
        const resizeHandlerSandbox = sinon.createSandbox();
        let eventListenerRegistered;

        beforeEach(() => {
            global.window.addEventListener = ({}, callback) => {
                if (eventListenerRegistered) {
                    return;
                }

                callback();
                eventListenerRegistered = true;
            };

            eventListenerRegistered = false;
            resizeHandlerSandbox.spy(scrollBlocker);
        });

        afterEach(() => {
            resizeHandlerSandbox.restore();
        });

        describe('when scrolling should be locked', () => {
            it('should invoke `enable()` method.', done => {
                scrollBlocker.enable({ breakpoint: '2000px' });

                resizeHandlerSandbox.reset();

                setTimeout(() => {
                    expect(scrollBlocker.enable).to.have.been.calledOnce;
                    expect(scrollBlocker.disable).to.not.have.been.called;

                    done();
                }, 150);
            });
        });

        describe('when scrolling should not be locked', () => {
            it('should invoke `disable()` method.', done => {
                scrollBlocker.enable({ breakpoint: '2000px' });
                scrollBlocker.enable({ breakpoint: '1000px' });

                resizeHandlerSandbox.reset();

                setTimeout(() => {
                    expect(scrollBlocker.enable).to.not.have.been.called;
                    expect(scrollBlocker.disable).to.have.been.calledOnce;

                    done();
                }, 150);
            });
        });
    });
});
