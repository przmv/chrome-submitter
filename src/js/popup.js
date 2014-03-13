var SUBMITTER = SUBMITTER || {};

SUBMITTER.popup = (function ($) {
    var
    QUEUE,
    SITES,
    MAPPINGS,
    SETTINGS,
    SITE_ID,

    setupEvents = function () {
        // Track options changes
        chrome.storage.onChanged.addListener(function (changes, namespace) {
            for (var key in changes) {
                var storageChange = changes[key];

                switch (key) {
                    case 'queue':
                        QUEUE = storageChange.newValue;
                    break;

                    case 'site_id':
                        SITE_ID = storageChange.newValue;
                    break;
                }
            }
        });

        $('#start').on('click', function () {
            chrome.storage.local.get('sites', function (items) {
                QUEUE = Object.keys(items.sites);
                processQueue();
            });
            $(this).text('Restart');
            $('#next').text('Next').show();
        });

        $('#next').on('click', function () {
            processQueue();
            if (QUEUE.length == 1) {
                $(this).text('Finish');
            } else if (QUEUE.length === 0) {
                $(this).hide();
            }
        });

        $('#refill').on('click', function () {
            reProcessQueue();
        });
    },

    setupSites = function () {
        if (!SITES) {
            chrome.storage.local.get('sites', function (items) {
                SITES = items.sites;
                SUBMITTER.log('setupSites: all sites:', SITES);
            });
        }
    },

    setupSettings = function () {
        if (!SETTINGS) {
            chrome.storage.local.get('settings', function (items) {
                SETTINGS = items.settings;
                SUBMITTER.log('setupSettings: all settings:', SETTINGS);
            });
        }
    },

    setupMappings = function () {
        if (!MAPPINGS) {
            chrome.storage.local.get('mappings', function (items) {
                MAPPINGS = items.mappings;
                SUBMITTER.log('setupMappings: all mappings:', MAPPINGS);
            });
        }
    },

    setupQueue = function () {
        if (!QUEUE) {
            chrome.storage.local.get('queue', function (items) {
                QUEUE = items.queue;
                SUBMITTER.log('setupQueue: queue:', QUEUE);
                if (QUEUE) {
                    SUBMITTER.log('setupQueue: queue length:', QUEUE.length);
                    $('#start').text('Restart');
                    $('#refill').show();
                    if (QUEUE.length == 1) {
                        SUBMITTER.log('setupQueue: One to last item');
                        $('#next').text('Finish').show();
                        $('#refill').show();
                    } else if (QUEUE.length == 0) {
                        SUBMITTER.log('setupQueue: Last item');
                        $('#next').hide();
                    } else {
                        $('#next').text('Next').show();
                        $('#refill').show();
                    }
                }
            });
        }
    },



    processQueue = function () {
        SUBMITTER.log('processQueue: queue:', QUEUE);

        SITE_ID = QUEUE.shift();

        chrome.runtime.sendMessage({ processQueue: SITE_ID });
        chrome.storage.local.set({ site_id: SITE_ID, queue: QUEUE });
    },

    reProcessQueue = function () {
        chrome.storage.local.get('site_id', function (items) {
            SITE_ID = items.site_id;

            SUBMITTER.log('reProcessQueue: site_id:', SITE_ID);
            chrome.runtime.sendMessage({ processQueue: SITE_ID });
        });
    },

    init = function () {
        setupQueue();
        setupEvents();
        setupSites();
        setupSettings();
        setupMappings();
    };

    return {
        init: init
    };
}(Zepto));

$(function () {
    SUBMITTER.popup.init();
});
