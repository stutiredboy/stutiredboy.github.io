(function () {
    'use strict';

    // -------- Theme toggle --------
    function setupTheme() {
        var btn = document.querySelector('.theme-toggle');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            var next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
        });

        // Follow system when user hasn't set a manual preference.
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        var mediaHandler = function (e) {
            try {
                if (localStorage.getItem('theme')) return;
            } catch (err) {}
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        };
        if (media.addEventListener) {
            media.addEventListener('change', mediaHandler);
        } else if (media.addListener) {
            media.addListener(mediaHandler);
        }
    }

    // -------- Table of contents --------
    function setupToc() {
        var container = document.querySelector('[data-toc]');
        var content = document.querySelector('.article-content');
        if (!container || !content) return;

        var headings = content.querySelectorAll('h2, h3');
        if (headings.length < 3) {
            var toc = container.closest('.article-toc');
            if (toc) toc.style.display = 'none';
            return;
        }

        var frag = document.createDocumentFragment();
        var slugCounts = {};

        headings.forEach(function (heading) {
            if (!heading.id) {
                var base = (heading.textContent || '')
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\w\u4e00-\u9fa5-]/g, '');
                if (!base) base = 'section';
                var n = slugCounts[base] || 0;
                slugCounts[base] = n + 1;
                heading.id = n ? base + '-' + n : base;
            }
            var link = document.createElement('a');
            link.href = '#' + heading.id;
            link.textContent = heading.textContent;
            link.className = heading.tagName === 'H3' ? 'is-h3' : 'is-h2';
            link.dataset.target = heading.id;
            frag.appendChild(link);
        });

        container.appendChild(frag);

        // Current-section highlight via IntersectionObserver.
        if (!('IntersectionObserver' in window)) return;

        var links = container.querySelectorAll('a');
        var linkById = {};
        links.forEach(function (a) { linkById[a.dataset.target] = a; });

        var visible = {};
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                visible[entry.target.id] = entry.isIntersecting;
            });
            // Choose the first visible heading as active.
            var activeId = null;
            for (var i = 0; i < headings.length; i++) {
                if (visible[headings[i].id]) {
                    activeId = headings[i].id;
                    break;
                }
            }
            links.forEach(function (a) { a.classList.remove('is-active'); });
            if (activeId && linkById[activeId]) {
                linkById[activeId].classList.add('is-active');
            }
        }, { rootMargin: '-72px 0px -60% 0px', threshold: 0 });

        headings.forEach(function (h) { observer.observe(h); });
    }

    // -------- Code copy buttons --------
    function setupCodeCopy() {
        var copyIcon =
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
        var checkIcon =
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

        var blocks = document.querySelectorAll('.article-content .highlight');
        blocks.forEach(function (block) {
            var pre = block.querySelector('pre');
            if (!pre) return;

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'code-copy';
            btn.setAttribute('aria-label', '复制代码');
            btn.innerHTML = copyIcon + '<span>复制</span>';

            btn.addEventListener('click', function () {
                var text = pre.innerText;
                var done = function () {
                    btn.classList.add('is-copied');
                    btn.innerHTML = checkIcon + '<span>已复制</span>';
                    setTimeout(function () {
                        btn.classList.remove('is-copied');
                        btn.innerHTML = copyIcon + '<span>复制</span>';
                    }, 1600);
                };

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done, done);
                } else {
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    try { document.execCommand('copy'); } catch (e) {}
                    document.body.removeChild(ta);
                    done();
                }
            });

            block.appendChild(btn);
        });
    }

    function init() {
        setupTheme();
        setupToc();
        setupCodeCopy();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
