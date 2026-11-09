(function () {
    'use strict';

    var WORKER_BASE = 'https://views.chenxiaosheng.com';
    var SEEDS_URL = '/theme/data/view-seeds.json';

    var fmt = (typeof Intl !== 'undefined' && Intl.NumberFormat)
        ? new Intl.NumberFormat('en-US')
        : { format: function (n) { return String(n); } };

    function fetchJson(url, opts) {
        return fetch(url, opts || { credentials: 'omit', cache: 'no-store' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            });
    }

    function showSiteStats() {
        var wrap = document.getElementById('site-stats-wrap');
        if (!wrap) return;
        fetchJson(WORKER_BASE + '/v/site').then(function (data) {
            var pvEl = document.getElementById('site-pv');
            var uvEl = document.getElementById('site-uv');
            if (pvEl) pvEl.textContent = fmt.format(data.pv || 0);
            if (uvEl) uvEl.textContent = fmt.format(data.uv || 0);
            wrap.hidden = false;
        }).catch(function (err) {
            console.warn('[views] site stats unavailable:', err.message);
        });
    }

    function showArticlePv() {
        var slug = document.body && document.body.dataset ? document.body.dataset.slug : null;
        if (!slug) return;
        var wrap = document.getElementById('article-pv-wrap');
        if (!wrap) return;

        var seedsPromise = fetchJson(SEEDS_URL).catch(function () { return {}; });
        var pvPromise = fetchJson(WORKER_BASE + '/v/' + encodeURIComponent(slug))
            .catch(function (err) {
                console.warn('[views] article pv unavailable:', err.message);
                return null;
            });

        Promise.all([seedsPromise, pvPromise]).then(function (results) {
            var seeds = results[0] || {};
            var pvData = results[1];
            if (!pvData) return; // worker down → keep hidden
            var seedVal = (typeof seeds[slug] === 'number') ? seeds[slug] : 0;
            var total = seedVal + (pvData.pv || 0);
            var el = document.getElementById('article-pv');
            if (el) el.textContent = fmt.format(total);
            wrap.hidden = false;
        });
    }

    function init() {
        showSiteStats();
        showArticlePv();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
