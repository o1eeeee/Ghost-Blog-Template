/* global maxPages */

// Code snippet inspired by https://github.com/douglasrodrigues5/ghost-blog-infinite-scroll
ready(function () {
    var currentPage = 1;
    var pathname = window.location.pathname;
    var $result = document.querySelectorAll('.gh-postfeed');
    var buffer = 300;

    var ticking = false;
    var isLoading = false;

    var lastScrollY = window.scrollY;
    var lastWindowHeight = window.innerHeight;
    var lastDocumentHeight = getDocumentHeight();

    function getDocumentHeight() {
        return Math.max( document.body.scrollHeight, document.body.offsetHeight, 
            document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );
    }

    function onScroll() {
        lastScrollY = window.scrollY;
        requestTick();
    }

    function onResize() {
        lastWindowHeight = window.innerHeight;
        lastDocumentHeight = getDocumentHeight();
        requestTick();
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(infiniteScroll);
        }
        ticking = true;
    }

    function sanitizePathname(path) {
        var paginationRegex = /(?:page\/)(\d)(?:\/)$/i;

        // remove hash params from path
        path = path.replace(/#(.*)$/g, '').replace('////g', '/');

        // remove pagination from the path and replace the current pages
        // with the actual requested page. E. g. `/page/3/` indicates that
        // the user actually requested page 3, so we should request page 4
        // next, unless it's the last page already.
        if (path.match(paginationRegex)) {
            currentPage = parseInt(path.match(paginationRegex)[1]);

            path = path.replace(paginationRegex, '');
        }

        return path;
    }

    function infiniteScroll() {
        // sanitize the pathname from possible pagination or hash params
        pathname = sanitizePathname(pathname);

        // return if already loading
        if (isLoading) {
            return;
        }

        // return if not scroll to the bottom
        if (lastScrollY + lastWindowHeight <= lastDocumentHeight - buffer) {
            ticking = false;
            return;
        }

        /**
        * maxPages is defined in default.hbs and is the value
        * of the amount of pagination pages.
        * If we reached the last page or are past it,
        * we return and disable the listeners.
        */
        if (currentPage >= maxPages) {
            window.removeEventListener('scroll', onScroll, {passive: true});
            window.removeEventListener('resize', onResize);
            return;
        }

        isLoading = true;

        // next page
        currentPage += 1;

        // Load more
        var nextPage = pathname + 'page/' + currentPage + '/';

        var ajaxRequest = new XMLHttpRequest();
        ajaxRequest.open('GET', nextPage, true);

        ajaxRequest.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                var parse = document.createRange().createContextualFragment(this.response);
                var posts = parse.querySelectorAll('.post');
                if (posts.length) {
                    [].forEach.call(posts, function (post) {
                        $result[0].appendChild(post);
                    });
                }
                else if (this.status === 404) {
                    window.removeEventListener('scroll', onScroll, {passive: true});
                    indow.removeEventListener('resize', onResize);
                }
            }
            lastDocumentHeight = getDocumentHeight();
            isLoading = false;
            ticking = false;
        };

        ajaxRequest.onerror = function() {};

        ajaxRequest.send();
    }

    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onResize);

    infiniteScroll();
});
