var SUBMITTER = SUBMITTER || {};

SUBMITTER.DEBUG = true;

SUBMITTER.log = function () {
    if (!!SUBMITTER.DEBUG && typeof console !== 'undefined') {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[DEBUG]');
        console.log.apply(console, args);
    }
};

SUBMITTER.options = (function ($) {
    var
    // Properties
    SETTINGS,
    SITES,
    MAPPINGS,

    // Methods
    setupEvents = function () {
        // Track options changes
        chrome.storage.onChanged.addListener(function (changes, namespace) {
            for (var key in changes) {
                var storageChange = changes[key];

                switch (key) {
                    case 'settings':
                        SETTINGS = storageChange.newValue;
                    break;

                    case 'sites':
                        SITES = storageChange.newValue;
                    break;

                    case 'mappings':
                        MAPPINGS = storageChange.newValue;
                    break;
                }

                setupSettings();
                setupSites();
                setupMappings();
            }
        });

        // Handle generic setting save
        $('#generic').on('click', '[data-action=save]', function (event) {
            var key = $('#generic-key').val(),
                oldkey = $('#generic-old-key').val(),
                value = $('#generic-value').val(),
                save = false;

            if (key && value) {
                // Check if key exists and we are not updating
                if (genericExists(key) && (oldkey !== key)) {
                    if (confirm('The key "' + key + '" already exists. Overwrite?')) {
                        save = true;
                    }
                } else {
                    save = true;
                }

                if (save) {
                    if (oldkey && (oldkey !== key)) {
                        SUBMITTER.log('old key: ' + oldkey);
                        deleteGeneric(oldkey);
                    }
                    saveGeneric(key, value);
                }
            } else {
                alert('Please fill key and value');
            }
        });

        // Handle generic setting cancel
        $('#generic').on('click', '[data-action=cancel]', function (event) {
            $('#generic-key').val('');
            $('#generic-value').val('');
            $(this).hide();
        });

        // Handle generic settings edit
        $('#generic').on('click', '[data-action=edit]', function (event) {
            var key = $(this).parent().find('dt').text(),
                value = $(this).parent().find('dd').text();

            event.preventDefault();

            $('#generic-key').val(key);
            $('#generic-old-key').val(key);
            $('#generic-value').val(value);
            // Show cancel button
            $('#generic [data-action=cancel]').show();
        });

        // Handle generic settings delete
        $('#generic').on('click', '[data-action=delete]', function (event) {
            var key = $(this).parents('li').find('dt').text();

            event.preventDefault();

            if (confirm('Are you sure you want to delete this item?')) {
                deleteGeneric(key);
            }
        });

        // Add site modal
        $('#sites').on('click', '[data-action=add]', function (event) {
            event.preventDefault();
            showSaveSiteForm();
        });

        // Delete site
        $('#sites').on('click', 'h3 [data-action=delete]', function (event) {
            var id = $(this).parents('section').data('id');

            event.preventDefault();

            if (confirm('Are you sure you want to delete this site?')) {
                deleteSite(id);
            }
        });

        // Edit site
        $('#sites').on('click', 'h3 [data-action=edit]', function (event) {
            var id = $(this).parents('section').data('id');

            event.preventDefault();
            showSaveSiteForm(id);
        });

        // Save mapping
        $('#sites').on('click', '[data-action=save-mapping]', function (event) {
            var site_id = $(this).parents('section').data('id'),
                xpath = $(this).parent().find('[name=xpath]').val(),
                oldxpath = $(this).parent().find('[name=oldxpath]').val(),
                mapping = $(this).parent().find('[name=mapping]').val(),
                save = false;

            if (site_id && xpath && mapping) {
                // Check if key exists and we are not updating
                if (mappingExists(site_id, xpath) && (oldxpath !== xpath)) {
                    if (confirm('Mapping with XPath "' + xpath + '" already exists. Overwrite?')) {
                        save = true;
                    }
                } else {
                    save = true;
                }

                if (save) {
                    if (oldxpath && (oldxpath !== xpath)) {
                        deleteMapping(site_id, oldxpath);
                    }
                    saveMapping(site_id, xpath, mapping);
                    // Hide cancel button
                    $(this).parent().find('[data-action=cancel]').hide();
                }
            } else {
                alert('Please fill the necessary fields!');
            }
        });

        // Delete site mapping
        $('#sites').on('click', '.mappings [data-action=delete]', function (event) {
            var site_id = $(this).parents('section').data('id'),
                xpath = $(this).parents('li').find('dt').text();

            event.preventDefault();

            if (confirm('Are you sure you want to delete this mapping?')) {
                deleteMapping(site_id, xpath);
            }
        });

        // Edit mapping
        $('#sites').on('click', '.mappings [data-action=edit]', function (event) {
            var xpath = $(this).parent().find('dt').text(),
                mapping = $(this).parent().find('dd').text();

            event.preventDefault();

            $(this).parents('section').find('[name=xpath]').val(xpath);
            $(this).parents('section').find('[name=oldxpath]').val(xpath);
            $(this).parents('section').find('[name=mapping]').val(mapping);
            // Show cancel button
            $(this).parents('section').find('[data-action=cancel]').show();
        });

        // Cancel edit mapping
        $('#sites').on('click', 'section [data-action=cancel]', function (event) {
            $(this).parent().find('[name=xpath]').val('');
            $(this).parent().find('[name=mapping]').val('');
            $(this).hide();
        });

        // Export data
        $('#export').on('click', '[data-action=export]', function (event) {
            chrome.storage.local.get(null, function (items) {
                $('#export textarea').val(JSON.stringify(items));
            });
        });

        // Import data
        $('#import').on('click', '[data-action=import]', function (event) {
            var json = $('#import textarea').val();
            chrome.storage.local.clear(function () {
                chrome.storage.local.set($.parseJSON(json));
            });
        });
    },

    showSaveSiteForm = function (id) {
        var modal = $('.add-site-overlay').clone();

        $(modal).removeAttr('style');

        if (id) {
            $(modal).find('#site-id').val(id);
            $(modal).find('#site-title').val(SITES[id].title);
            $(modal).find('#site-submit-url').val(SITES[id].url);
        }

        $(modal).find('button').click(function () {
            var id = $(modal).find('#site-id').val(),
                title = $(modal).find('#site-title').val(),
                url = $(modal).find('#site-submit-url').val();

            if ($(this).hasClass('save')) {
                if (title && url) {
                    saveSite(id, url, title);
                } else {
                    $(modal).find('p.error').show();
                    return false;
                }
            }
            $(modal).addClass('transparent');
            setTimeout(function() {
                $(modal).remove();
            }, 1000);
        });

        $(modal).click(function() {
            $(modal).find('.page').addClass('pulse');
            $(modal).find('.page').on('webkitAnimationEnd', function() {
                $(this).removeClass('pulse');
            });
        });

        $('body').append(modal);
    },

    setupSettings = function () {
        var callback = function (items) {
            $.each(items, function (key, value) {
                var item = $('#common-item').html();

                item = item.replace('%KEY%', key)
                           .replace('%VALUE%', value);
                $('#generic ul').append(item);
            });
        };

        $('#generic ul').html('');

        if (SETTINGS) {
            callback(SETTINGS);
        } else {
            chrome.storage.local.get('settings', function (items) {
                SETTINGS = items.settings || {};

                SUBMITTER.log('setupSettings: all settings:', SETTINGS);
                callback(SETTINGS);
            });
        }
    },

    setupSites = function () {
        var itemTemplate = $('#common-item').html(),
            callback = function (items) {
            $.each(items, function (key, value) {
                var section = $('#site-section').html(),
                mappings = '',
                genericSettings = '';

                if (MAPPINGS[key]) {
                    SUBMITTER.log('setupSites: site mappings:', MAPPINGS[key]);
                    $.each(MAPPINGS[key], function (xpath, mapping) {
                        var item = itemTemplate;

                        item = item.replace('%KEY%', xpath)
                                   .replace('%VALUE%', mapping);
                        mappings += item;
                    });
                }

                $.each(SETTINGS, function (key) {
                    genericSettings += '<option>' + key + '</option>';
                });

                section = section.replace(/%SITE_TITLE%/g, value.title)
                                 .replace(/%SITE_ID%/g, key)
                                 .replace(/%SITE_URL%/g, value.url)
                                 .replace('%SITE_MAPPINGS%', mappings)
                                 .replace('%GENERIC_SETTINGS%', genericSettings);

                $('#sites div.content').append(section);
            });
        };

        $('#sites div.content').html('');

        if (SITES) {
            callback(SITES);
        } else {
            chrome.storage.local.get('sites', function (items) {
                SITES = items.sites || {};

                SUBMITTER.log('setupSites: all sites:', SITES);
                callback(SITES);
            });
        }
    },

    setupMappings = function () {
        if (!MAPPINGS) {
            chrome.storage.local.get('mappings', function (items) {
                MAPPINGS = items.mappings || {};

                SUBMITTER.log('setupMappings: all mappings:', MAPPINGS);
            });
        }
    },

    saveGeneric = function (key, value) {
        SUBMITTER.log('saveGeneric: key "' + key + '" and value "' + value + '"');

        SETTINGS[key] = value;
        chrome.storage.local.set({ settings: SETTINGS }, function () {
            $('#generic-key,#generic-value').val('');
            // Hide cancel button
            $('#generic [data-action=cancel]').hide();
        });
    },

    deleteGeneric = function (key) {
        SUBMITTER.log('deleteGeneric: deleting item with key "' + key + '"');
        delete SETTINGS[key];
        // Delete corresponding mappings
        $.each(MAPPINGS, function (site_id, mappings) {
            $.each(mappings, function (xpath, mapping) {
                if (key === mapping) {
                    delete MAPPINGS[site_id][xpath];
                }
            });
        });
        chrome.storage.local.set({ settings: SETTINGS, mappings: MAPPINGS });
    },

    genericExists = function (key) {
        var exists = !!SETTINGS[key];
        SUBMITTER.log('genericExists:', exists);
        return exists;
    },

    deleteSite = function (id) {
        SUBMITTER.log('deleteSite: deleting site with ID "' + id + '"');
        delete SITES[id];
        // Delete corresponding mappings
        delete MAPPINGS[id];
        chrome.storage.local.set({ sites: SITES, mappings: MAPPINGS });
    },

    saveSite = function (id, url, title) {
        SUBMITTER.log('saveSite: url "' + url + '" and title "' + title + '"');

        // Are we creating a new site or updating an existing?
        id = id || uuid.v4();

        SITES[id] = { url: url, title: title };
        chrome.storage.local.set({ sites: SITES });
    },

    saveMapping = function (site_id, xpath, mapping) {
        SUBMITTER.log('saveMapping: site ID "' + site_id + '", XPath "' + xpath +'" and mapping "' +mapping+ '"');

        if (MAPPINGS[site_id]) {
            MAPPINGS[site_id][xpath] = mapping;
        } else {
            var record = {};
            record[xpath] = mapping;
            MAPPINGS[site_id] = record;
        }
        chrome.storage.local.set({ mappings: MAPPINGS });
    },

    deleteMapping = function (site_id, xpath) {
        SUBMITTER.log('deleteMapping: site ID "' + site_id + '", XPath "' + xpath + '"');

        delete MAPPINGS[site_id][xpath];
        chrome.storage.local.set({ mappings: MAPPINGS });
    },

    mappingExists = function (site_id, xpath) {
        var exists = MAPPINGS[site_id] ? !!MAPPINGS[site_id][xpath] : false;

        SUBMITTER.log('mappingExists:', exists);
        return exists;
    },

    init = function () {
        setupEvents();
        setupSettings();
        setupMappings();
        setupSites();
    };

    return {
        init: init
    };
}(Zepto));
