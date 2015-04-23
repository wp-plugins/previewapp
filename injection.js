(function() {
    function addEvent( obj, type, fn ) {
        if ( obj.attachEvent ) {
            obj['e'+type+fn] = fn;
            obj[type+fn] = function() { obj['e'+type+fn]( window.event ); };
            obj.attachEvent( 'on'+type, obj[type+fn] );
        } else
            obj.addEventListener( type, fn, false );
    }

    function removeEvent( obj, type, fn ) {
        if ( obj.detachEvent ) {
            obj.detachEvent( 'on'+type, obj[type+fn] );
            obj[type+fn] = null;
        } else
            obj.removeEventListener( type, fn, false );
    }

    var Fidesio = Fidesio || {};
    Fidesio.rpc = Fidesio.rpc || {};
    Fidesio.rpc.Server = (function () {

        var Server = function () {
            this.listeners = {};
            this.source = null;
            this.origin = null;
        };

        Server.prototype.on = function (action, callback) {
            this.listeners[action] = callback;
        };

        Server.prototype.postMessage = function (message) {

            if (this.source === null) {
                console.log('PREVIEW: source is not defined');
            } else {
                this.source.postMessage(message, this.origin);
            }
        };

        Server.prototype.postTransactionResponse = function (transaction_id, action, result) {
            this.postMessage({
                action: action,
                transaction_id: transaction_id,
                url: window.location.href,
                result: result
            });
        };

        Server.prototype.listen = function (target) {
            var me = this;

            addEvent( target, 'message', function (event) {
                if (event.origin !== event.data.urlsrc) {
                    return;
                }

                me.source = event.source;
                me.origin = event.origin;
                var action = event.data.action;
                if (!me.listeners.hasOwnProperty(action)) {
                    console.error('Missing action `' + action + '`.');
                    return;
                }

                var result = me.listeners[action].apply(me, event.data.parameters);

                me.postTransactionResponse(event.data.transaction_id, action, result);
            });
        };
        return Server;
    })();

    var server = new Fidesio.rpc.Server();

    addEvent(window, 'load', function () {

        var x = 0, scroll_x = 0,
            y = 0, scroll_y = 0,
            width, height,
            mask, css, lastScrollTop = null;

        /****************************************************************/
        // Scoped functions                                             //
        /****************************************************************/

        function initInspectorBug() {

            height = Math.max(document.documentElement.clientHeight, document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight);
            width = Math.max(document.documentElement.clientWidth, document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth);

            mask = document.createElement('div');
            mask.style.background = 'transparent';
            mask.style.height = parseInt(height) + 'px';
            mask.style.width = parseInt(width) + 'px';
            mask.style.zIndex = 99999;
            mask.style.top = 0;
            mask.style.left = 0;
            mask.style.position = 'fixed';
            mask.style.display = 'block';
            mask.style.cursor = 'crosshair';

            css = document.createElement('style');
            css.type = 'text/css';
            css.innerHTML = '* { -webkit-box-sizing: border-box; -moz-box-sizing: border-box; box-sizing: border-box; }';

            document.body.appendChild(css);
            document.body.appendChild(mask);

            mask.onclick = function (e) {

                x = e.x == undefined ? e.clientX - mask.offsetLeft : e.x;
                y = e.y == undefined ? e.clientY - mask.offsetTop : e.y;

                server.postMessage({
                    action: 'inspector-prepare-issue-creation', result: {
                        x: x,
                        y: y,
                        scroll_x: scroll_x,
                        scroll_y: scroll_y
                    }
                });

            };

            window.onmousemove = function (e) {
                server.postMessage({
                    action: 'inspector-mouse-move', result: {
                        x: e.x == undefined ? e.clientX - mask.offsetLeft : e.x,
                        y: e.y == undefined ? e.clientY - mask.offsetTop : e.y
                    }
                });

            };

            window.onscroll = function () {
                var direction, scrollTop, scroll = getScroll();

                scrollTop = scroll.y;
                if (lastScrollTop == null || scrollTop > lastScrollTop) {
                    direction = 'down';
                } else {
                    direction = 'top';
                }

                scroll_x = scroll.x;
                scroll_y = scroll.y;

                server.postMessage({
                    action: 'preview-scroll-event', result: {
                        x: scroll_x,
                        y: scroll_y,
                        direction: direction,
                        last_scroll: lastScrollTop
                    }
                });

                lastScrollTop = scrollTop;
            };
        }

        /**
         * Retourne la taille de la scrollbar
         * @return {number}
         */
        function getScrollbarWidth() {

            var outer = document.createElement('div');
            outer.style.visibility = 'hidden';
            outer.style.width = '100px';

            document.body.appendChild(outer);

            var width_no_scroll = outer.offsetWidth;
            outer.style.overflow = 'scroll';

            var inner = document.createElement('div');
            inner.style.width = '100%';
            outer.appendChild(inner);

            var width_with_scroll = inner.offsetWidth;
            outer.parentNode.removeChild(outer);

            return width_no_scroll - width_with_scroll;
        }

        function screenshot() {

            mask.style.display = 'none';

            var base = document.querySelector('head base'),
                head, document_width;

            if (base === false || base === null) {
                base = document.createElement('BASE');
                base.setAttribute('href', window.location.href);
                head = document.querySelector('head');
                head.insertBefore(base, head.firstChild);
            }

            document_width = document.body.clientWidth;

            if (document.body.clientHeight > screen.height) {
                document_width += getScrollbarWidth();
                x += Math.floor(getScrollbarWidth() / 2);
            }

            return {
                'width': width,
                'height': height,
                'x': x + scroll_x,
                'y': y + scroll_y,
                'url': window.location.href,
                'window_width': screen.width,
                'window_height': screen.height,
                'crop_y': document.body.scrollTop,
                'crop_x': document.body.scrollLeft,
                'scroll_y': document.body.scrollTop,
                'scroll_x': document.body.scrollLeft,
                'scroll_width': getScrollbarWidth(),
                'html': encodeURIComponent(document.documentElement.outerHTML)
            };

        }

        function getScroll() {

            var x = 0, y = 0;

            if (typeof( window.pageYOffset ) == 'number') {
                // Netscape
                x = window.pageXOffset;
                y = window.pageYOffset;
            } else if (document.body && ( document.body.scrollLeft || document.body.scrollTop )) {
                // DOM
                x = document.body.scrollLeft;
                y = document.body.scrollTop;
            } else if (document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop )) {
                // IE6 standards compliant mode
                x = document.documentElement.scrollLeft;
                y = document.documentElement.scrollTop;
            }

            return {
                'x': x,
                'y': y
            }
        }

        /****************************************************************/
        // Server listeners                                             //
        /****************************************************************/

        server.on('inspector-scroll-to', function(scrollY) {
            //TODO: check x/y
            window.scrollTo(scrollY, scrollY);
            server.postMessage({
                action: 'inspector-scroll-to',
                result: {}
            });
        });

        /**
         *
         */
        server.on('inspector-mode-bug-on', function () {
            initInspectorBug();
        });

        /**
         *
         */
        server.on('inspector-mode-bug-off', function () {
            if (mask && mask.parentNode) {
                mask.parentNode.removeChild(mask);
            }

            if (css && css.parentNode) {
                css.parentNode.removeChild(css);
            }

            window.onmousemove = function () {};
            window.onscroll = function () {};
        });

        /**
         *
         */
        server.on('inspector-iframe-info', function () {

            var scroll = getScroll();

            height = Math.max(document.documentElement.clientHeight, document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight);
            width = Math.max(document.documentElement.clientWidth, document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth);

            return {
                scroll_x: scroll.x,
                scroll_y: scroll.y,
                width: width,
                height: height,
                title: document.title,
                url: window.location.href
            };
        });

        /**
         *
         */
        server.on('inspector-prepare-screenshot', function () {
            return screenshot();
        });

        /**
         *
         */
        server.on('inspector-end-screenshot', function () {
            mask.style.display = 'block';
        });

        /**
         *
         */
        server.on('inspector-get-html', function () {
            return encodeURIComponent(document.documentElement.outerHTML)
        });

        server.listen(window);
    });

    addEvent( window, 'unload', function () {

        server.postMessage({
            action: 'inspector-change-page', result: {
                url: window.location.href
            }
        });

    });
}());
