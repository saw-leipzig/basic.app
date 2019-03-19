// Global application object
// TODO: reimplement, so that everything important is accessable via the global app object
function BasicApp (ctx, cfg) {
    this.context = ctx;
    this.config = cfg;
    this.plugins = [];  // Container for registered plugins
}


// Instantiate global application object
var app = new BasicApp(context, config);
// Object store
var data_objects = {};
// Contains all fetched objects
var fetched_objects = {
    objects: [],
    seealso: []
};
var idm = new IdentityManager();


$(document).ready(function () {
    idm.init();
    initApplication(config);
});


function initApplication (config) {
    // Initialize footer
    initAppFooter();
    // Load config
    config = config || null;
    if (config != null) {
        // TODO: check configuration for minimal set of options
        // shorten some config paths
        config.v = config.app.config.view[context];
        config.a = config.app.config.api[context];
        config.m = config.app.config.mapping[context];
        console.log('Config loaded.');
        // config is loaded trigger a event
        $('body').trigger('basicAppConfigLoaded');
        // Init object form
        initModalObjectFormFields();
        enableButtonObjectFormSubmit('#object-form', '#btn-object-form-submit');
    } else {
        console.log('App (ERROR): No configuration available. You have to provide a "config" object.');
    }
}


/* Helper functions and utilities */
function asArray (thing_to_transform) {
    if (thing_to_transform) {
        if ($.isArray(thing_to_transform)) {
            return thing_to_transform;
        } else {
            return [thing_to_transform];
        }
    } else {
        return [];
    }
}


function getLocalObjectById (id) {
    return asArray(data_objects[config.a.JSONContainer]).find(function (e) {
        return e.id === id;
    });
}


function getLocalObjectByTitle (title) {
    return asArray(data_objects[config.a.JSONContainer]).find(function (e) {
        return e[config.v.titleElement] === title;
    });
}


function getLocalObjectByAlias (alias) {
    return asArray(data_objects[config.a.JSONContainer]).find(function (e) {
        return asArray(e[config.v.aliasElement]).includes(alias);
    });
}


// get the value using the path_key from config template
function deepFind (obj, path_key, allow_arrays) {
    var allow_arrays = allow_arrays || false;
    // Dynamic attributes
    var attributes = config.m;
    var attr_array =[];
    attributes.forEach(function (e) {
        var dn = e.displayName;
        // get attribute value from path
        if (e[path_key] != undefined) {
            var paths = e[path_key].split('.');
            var current = obj;
            var i;
            for (i = 0; i < paths.length;++ i) {
                if (current[paths[i]] == undefined) {
                    if (Array.isArray(current) && current.length > 0) {
                        // last path part is in objects in a collection, so try to map the corresponding
                        // values a new array and join it nicely.
                        current = current.map(function (e) {
                            return e[paths[i]];
                        });
                        if (!allow_arrays) {
                            current = current.join(', ');
                        } else {
                            break;
                        }
                    } else {
                        current = undefined;
                        break;
                    }
                } else if (i + 1 == paths.length && Array.isArray(current[paths[i]])) {
                    // end of path reached and node is an array, so this should be a collection
                    // of simple values and could be joined nicely.
                    if (!allow_arrays) {
                        current = current[paths[i]].join(', ');
                    } else {
                        current = current[paths[i]];
                        break;
                    }
                } else {
                    current = current[paths[i]];
                }
            }
        } else {
            var current = undefined;
        }
        attr_array.push({
            'key': dn, 'value': current
        });
    });
    // attr_array = [{key: <key>, value: <value>},{...}]
    return attr_array;
}


function replaceLocalIDInFrontend(old_fid, new_fid) {
    var list_item = $('#' + old_fid);
    // Work around: Delete old, create new
    list_item.remove();
    createNewHTMLObject(getLocalObjectById(new_fid));
}


function dataToString (data) {
    if (Array.isArray(data)) {
        data = data.join(', ');
    }
    return data;
}


function createNewHTMLObject(data){
    // As local objects exist before frontend representation, an id mapping is already there
    var fid = idm.getFrontendId(data.id);
    if(config.v.descriptionElement !== undefined && data[config.v.descriptionElement] != null){
        description_html = '<p class="mb-1">' + dataToString(data[config.v.descriptionElement]) + '</p>';
    } else {
        description_html = '<p class="mb-1"></p>'
    }
    var title_html = '<h5 class="mb-1">' + data[config.v.titleElement] + '</h5>' + description_html;
    // Status button (dropdown)
    var status = config.app.config.status.default;
    if (data[config.v.statusElement]) {
        status = data[config.v.statusElement];
    }
    var status_buttons = [];
    var left_status = config.app.config.status.available.filter(function (item) {
        return item != status;
    });
    left_status.forEach(function (stat) {
        status_buttons.push('<button class="dropdown-item" type="button">' + stat + '</button>');
    })
    var status_dropdown_html = '<button id="btn-status-' + fid + '" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="btn btn-status dropdown-toggle">' + status + '</button><div class="dropdown-menu" aria-labelledby="'+ fid + '">' + status_buttons.join('') + '</div>'

    var input_gnd_html = '<input id="ipt-new-' + fid + '" type="text" class="form-control form-control-gray" name="' + fid + '" placeholder="new Identifier URL" />'
    var input_search_html = '<input id="ipt-search_' + fid + '" type="text" class="form-control form-control-gray" placeholder="Search for" />'
    var button_add_html = '<button type="button" aria-label="Add Identifier-URL" title="Add given identifier" class="btn btn-add-gnd btn-outline-secondary"><span class="fas fa-plus"></span></button>'
    var button_edit_html = '<button id="btn-edit_' + fid + '" type="button" data-toggle="modal" data-target="#object-modal" title="Edit" class="btn btn-edit btn-outline-secondary"><span class="fas fa-edit"></span></button>';
    var button_autoadd_html = '<button id="btn-auto-ad_' + fid + '" type="button" aria-label="Try to automatically match authority data" data-api-search="' + data[config.v.titleElement] + '" title="Autofill: Click to search for: ' + data[config.v.titleElement] + '" class="btn btn-auto-ad btn-outline-secondary"><span class="fas fa-binoculars"></span></button>';
    var button_compare_html = '<button id="btn-compare_' + fid + '" type="button" aria-label="Show tabular view of fetched data." data-toggle="modal" data-target="#compare-modal" title="Open card view" class="btn btn-compare btn-outline-secondary"><span class="fas fa-table"></span></button>';
    var button_del_html = '<button id="btn-delete_' + fid + '" type="button" aria-label="Delete." title="Delete" class="btn btn-delete btn-outline-secondary"><span class="fas fa-trash"></span></button>';
    var ads_buttons = [];
    asArray(data[config.v.identifierElement]).forEach(function (ref_data) {
        var ref_id = ref_data['#text'].substring(config.v.identifierBaseURL.length);
        var pref_class = '';
        if (ref_data['preferred'] == 'YES') {
            pref_class = 'active';
        }
        ads_buttons.push('<label id="lbl-' + fid + '_' + ref_id + '" data-ref-id="' + ref_id + '" data-content="Loading <i class=\'fas fa-sync-alt fa-spin\'></i>" class="btn ' + pref_class + '"><input name="ad_' + fid + '" id="' + fid + '_' + ref_id + '" type="radio">' + ref_id + '</input></label>')
    })
    var list_item_html = '<div class="list-group-item status-ref status-ref-' + status + '" id="'+ fid +'">\
                            ' + title_html + '\
                            <div class="input-group input-group-sm">\
                                <div class="input-group-prepend">\
                                    ' + status_dropdown_html
                                    + button_edit_html
                                    + button_del_html
                                    + button_add_html
                                    + '</div>\
                                ' + input_gnd_html
                                + input_search_html + '\
                                <div class="input-group-append">\
                                    '+ button_autoadd_html
                                    + button_compare_html
                                    + '</div>\
                            </div>\
                            <div id="ads-' + fid + '" class="btn-group btn-group-sm btn-group-toggle btn-group-ads">' + ads_buttons.join('') + '</div>\
                        </div>';
    var list_item = $(list_item_html);
    $("#result-container div.list-group").prepend(list_item);
    list_item.trigger('listItemCreated');
    // Enable/disable buttons depending on status
    setItemButtonsAbilityByStatus(data);
}


function getPopoverHTMLFromObject(obj) {
    // Dynamic attributes
    var html = '';
    deepFind(obj, 'JSONPath').forEach(function (i) {
        if (i.value != undefined) {
            html = html + '<dt>' + i.key + '</dt><dd class="text-truncate">' + i.value + '</dd>';
        }
    });
    return '<dl>' + html + '</dl>';
}


// Load the JSON data for the popover
function loadPopoverContent (label_obj){
    var use_corsanywhere = config.app.config.use_corsanywhere;
    var corsanywhere_url = '';
    if (use_corsanywhere) {
        corsanywhere_url = 'https://cors-anywhere.herokuapp.com/';
    }
    var ref_id = label_obj.attr('data-ref-id').toUpperCase();
    var already_fetched_object = fetched_objects.objects.find(function (e) {
        return e.id === ref_id;
    });

    var attr = $(label_obj).attr("data-content");
    if (attr.startsWith('Loading') && already_fetched_object === undefined && !$(label_obj).hasClass('btn-loading')) {
        /* There is no data-content attribute or if its there it is empty */
        // Mark button as already fetching the object (visual feedback by CSS)
        $(label_obj).toggleClass('btn-loading');
        // compose the source URL
        var source_url = corsanywhere_url + config.a.authorityDataBaseURL + ref_id;
        console.log('Request external object: ', source_url);
        $.getJSON(source_url).done(function (result) {
            // Highlight loading button
            $(label_obj).toggleClass('btn-loading');
            // Geonames API doesn't use HTTP-Codes, so check if we got an status objects
            if (result.status != undefined) {
                /* Example result:
                    {"status": {
                      "message": "For input string: \"1111-1\"",
                      "value": 14
                    }}
                 */
                var err = 'Request failed: ' + result.status.message + ", " + result.status.value;
                console.log(err);
                $(label_obj).attr('data-content', err);
                $('#' + $(label_obj).attr('aria-describedby') + ' .popover-body').html(err);
            } else {
                var already_fetched_object = fetched_objects.objects.find(function (e) {
                    return e.id === ref_id;
                });
                if (already_fetched_object === undefined) {
                    fetched_objects.objects.push({
                        "id": ref_id, "data": result
                    });
                }
                var pop_html = getPopoverHTMLFromObject(result);
                $(label_obj).attr('data-content', pop_html);
                $('#' + $(label_obj).attr('aria-describedby') + ' .popover-body').html(pop_html);
            }
        }).fail(function (jqxhr, textStatus, error) {
            // Highlight loading button
            $(label_obj).toggleClass('btn-loading');
            var err = 'Request failed: ' + textStatus + ", " + error;
            console.log(err);
            $(label_obj).attr('data-content', err);
            $('#' + $(label_obj).attr('aria-describedby') + ' .popover-body').html(err);
        });
    } else if (attr.startsWith('Loading') && already_fetched_object !== undefined) {
        // Object is cached, but popover data isn't set
        var pop_html = getPopoverHTMLFromObject(already_fetched_object.data);
        $(label_obj).attr('data-content', pop_html);
        $('#' + $(label_obj).attr('aria-describedby') + ' .popover-body').html(pop_html);
    }
}


function addRef2Data (oid, ref_id) {
    var obj = getLocalObjectById(oid);
    var id_element = config.v.identifierElement;
    var ref_obj = obj[id_element];
    if (! Array.isArray(ref_obj)) {
        // there is just a single reference, but we want to add another, so switch datatype to array
        if (ref_obj == undefined) {
            obj[id_element] =[];
        } else {
            obj[id_element] =[ref_obj];
        }
    }

    obj[id_element].push({
        // TODO: API Model constrain: preferred
        'preferred': 'NO',
        // TODO: API Model constrain: #text
        '#text': config.v.identifierBaseURL + ref_id
    });
}


function togglePreferredRef2Data (oid, ref_id) {
    var obj = getLocalObjectById(oid);
    if (Array.isArray(obj[config.v.identifierElement])) {
        // references > 1
        var ref_new_idx = obj[config.v.identifierElement].findIndex(function (ref) {
            // TODO: API Model constrain: #text
            return ref['#text'] === config.v.identifierBaseURL + ref_id
        });
        var ref_old_idx = obj[config.v.identifierElement].findIndex(function (ref) {
            // TODO: API Model constrain: preferred
            return ref.preferred === 'YES'
        });
        // Set preferred on new id
        obj[config.v.identifierElement][ref_new_idx].preferred = 'YES';
        // Remove preferred on old id, if exist
        // If new_index = old_index this will also unprefer, like we want it to do
        if (ref_old_idx >= 0) {
            obj[config.v.identifierElement][ref_old_idx].preferred = 'NO';
        }
    } else {
        // references = 1
        // Toggle preferred
        if (obj[config.v.identifierElement].preferred === 'NO') {
            obj[config.v.identifierElement].preferred = 'YES';
        } else {
            obj[config.v.identifierElement].preferred = 'NO';
        }
    }
}


function togglePreferred (oid, ref_id) {
    // 1. update local object
    togglePreferredRef2Data(oid, ref_id);
    // 2. update frontend
    // toggle button state in list
    var fid = idm.getFrontendId(oid);
    var current_is_active = $('#lbl-' + fid + '_' + ref_id).hasClass('active');
    $('#' + fid + ' label.btn.active').removeClass('active');
    if (!current_is_active) {
        $('#lbl-' + fid + '_' + ref_id).addClass('active');
    }
}


function getPreferredIdentifierFromObject (obj) {
    var preferred_id_obj = asArray(obj[config.v.identifierElement]).find(o => o.preferred == 'YES');
    if (preferred_id_obj != undefined) {
        return preferred_id_obj['#text'];
    } else {
        return null;
    }
}


function initModalObjectFormFields () {
    var attributes = config.m;
    var form = $('#object-form #object-form-container');
    if (Array.isArray(attributes)) {
        attributes.forEach(function (e) {
            // TODO: validation and required fields, configured by JSON
            if (e.localJSONPath) {
                if (e.multiple) {
                     var input_html = '<div class="form-group col-md-12 mb-2">\
                                           <label for="ipt-' + e.localJSONPath + '">' + e.displayName + ':</label>\
                                           <textarea class="form-control object-form-input" name="' + e.localJSONPath + '" id="ipt-' + e.localJSONPath + '"></textarea>\
                                       </div>';
                } else if (!e.multply) {
                     var input_html = '<div class="form-group col-md-12 mb-2">\
                                            <label for="ipt-' + e.localJSONPath + '">' + e.displayName + ':</label>\
                                            <input type="text" class="form-control object-form-input" name="' + e.localJSONPath + '" id="ipt-' + e.localJSONPath + '"/>\
                                        </div>';
                }
            form.append(input_html);
            }
        })
        // add hidden id field and submit button
        form.append('<input type="hidden" name="id" class="form-control" id="ipt-id"/>\
                    <div class="form-group col-md-12 mb-2">\
                        <button id="btn-object-form-submit" type="button" class="btn btn-primary">Submit</button>\
                    </div>')
    }
}


// Add or edit object
function enableButtonObjectFormSubmit (selector, delegate_selector) {
    $(selector).on('click', delegate_selector, function () {
        var oid = $('#ipt-id').val();
        if (data_objects) {
            //console.log(local_object);
            if (oid != '') {
                // 1. update local object
                editObject(oid);
            } else {
                addObject(this);
            }
        } else {
            addObject(this);
        }
    });
}


/* ---  Logging API Events --- */
$('body').on('objectAdd objectUpdate preferredReferenceChange statusChange referenceUpdate objectDelete basicAppConfigLoaded',  function(e, data){
    console.log('Fired ' + e.type);
})


function enableButtonAddReference (selector, delegate_selector) {
    $(selector).on('click', delegate_selector, function () {
        if (! $(this).hasClass('disabled')) {
            // Get values like element id, new url
            var fid = $(this).parents('.list-group-item').get(0).id;
            var raw_value = $('#ipt-new-' + fid).val();
            // Simple Validation
            if (raw_value == '') {
                // no input was given, maybe give a hint on that
                console.log('No input given.');
            } else if (! raw_value.startsWith(config.v.identifierBaseURL)) {
                // input doesn't match a valid gnd URI (we should use a regex to check)
                console.log('Invalid input given.');
            } else {
                // valid input, we should check if a button with this id already exist
                // and than add a new button and update the backend
                console.log('Valid URI: ' + raw_value);
                // Get Reference-ID
                var ref_id = raw_value.substring(config.v.identifierBaseURL.length)
                console.log('REF-ID: ' + ref_id);
                // add button and set popover event
                addReference(this, fid, ref_id);
            }
        }
    });
}


function enableButtonIdentifierToggling (selector, delegate_selector) {
    $(selector).on('click', delegate_selector, function (e) {
        e.preventDefault();
        if (! $(this).hasClass('disabled')) {
            var id_composition = $(this).get(0).id.substring($(this).get(0).id.indexOf('-') + 1);
            var fid = id_composition.substring(0, id_composition.indexOf('_'));
            var ref_id = $(this).attr("data-ref-id");
            togglePreferred(idm.getObjectId(fid), ref_id);
            // Fire event preferredReferenceChange
            $(this).trigger('preferredReferenceChange');
        }
    });
}


function enableButtonIdentifierPopover (selector, delegate_selector) {
    $(selector)
        // Configure Bootstrap popover
        .popover({
            placement: 'bottom',
            html: true,
            trigger: 'hover',
            selector: delegate_selector
        })
        // Get and set content for popover
        .on('mouseover', delegate_selector, function () {
            loadPopoverContent($(this));
        });
}


/* Status dropdown */
function enableButtonStatus (selector, delegate_selector) {
    $(selector).on('click', delegate_selector, function () {
        var fid = $(this).parent().attr('aria-labelledby');
        var current_status = $('#btn-status-' + fid).html();
        var new_status = $(this).html();
        changeStatus($(this), fid, current_status, new_status);
        // Fire event trifferSetStatus
        $(this).trigger('statusChange');
    });
}


/* Find and suggest authority data */
function enableButtonAutoAdd (selector, delegate_selector){
    $(selector).on('click', delegate_selector, function () {
        if (! $(this).hasClass('disabled')) {
            // Visualize search activity by changing to rotating sync icon
            $(this).children('.fas')
                .toggleClass('fa-binoculars fa-sync-alt fa-spin')
                .html('');
            //$(this).html('Searching...');
            var btn = $(this);
            var fid = $(this).attr('id').substring($(this).attr('id').indexOf('_') + 1);
            var search_value = $('#ipt-search_' + fid).val();
            if (search_value) {
                // use input as query
                var searchterm = search_value;
            } else {
                // Simple name based search query
                var searchterm = $(this).parents('.list-group-item').find('h5').text();
            }
            findAuthorityData(btn, searchterm, fid);
        }
    });
}


/* Load item data in modal form */
function enableButtonEdit (selector, delegate_selector) {
    $(selector).on('click', delegate_selector, function () {
        var recipient = $(this).attr('id') // Extract info from data-* attributes
        var fid = recipient.substring(recipient.indexOf('_') + 1);
        var local_object = getLocalObjectById(idm.getObjectId(fid));
        var attributes = config.m;
        attributes.forEach(function (e) {
            if (e.localJSONPath) {
                $('#ipt-' + e.localJSONPath).val(prepareValueForEdit(local_object[e.localJSONPath]));
            }
        })
        $('#ipt-id').val(local_object.id);
   });
}


function enableButtonDelete (selector, delegate_selector) {
    $(selector).on('click', delegate_selector, function () {
        var trigger = $(this);
        confirmModal(trigger,function(result){
            if (result) {
                var fid = trigger.parents('.list-group-item').get(0).id;
                deleteObject(trigger, idm.getObjectId(fid));
            }
        });
    });
}


/* Reset form if modal is hiding */
function enableObjectFormReset (selector) {
    $(selector).on('hidden.bs.modal', function () {
        $('#object-form .form-control').val('')
    });
}


// click button to filter by status
function enableButtonFilter (selector) {
    $(selector).on('click', function () {
        var idstr = 'btn-filter-';
        var status = $(this).get(0).id.substring(idstr.length);
        $(this).toggleClass('active');
        if ($(this).hasClass('active')) {
            $('.status-ref-' + status).css('display', 'none');
        } else {
            $('.status-ref-' + status).css('display', 'block');
        }
    });
}


// Initialize app footer
function initAppFooter () {
    var f_conf = config.app.config.footer;
    var img_path = 'img/' + config.app.config.footer.logoFileName;
    if (context != 'root') {
        img_path = '../' + img_path;
    }
    var logo_html = '';
    if (f_conf.logoFileName != undefined && f_conf.logoFileName != '') {
        logo_html = '<a href="' + f_conf.logoURL + '" target="_blank">\
                        <img src="' + img_path + '" alt="' + f_conf.logoAlternativeText + '">\
                    </a>';
    }
    var f_html = '<div class="container">\
                    <div class="row">\
                        <div class="col-6 col-md-2" id="footer-logo">\
                        ' + logo_html + '</div>\
                        <div class="col-md-8 d-none d-md-block" id="footer-text">\
                            <span class="text-light small">' + f_conf.text + '</span>\
                        </div>\
                        <div class="col-6 col-md-2" id="footer-version">\
                            <span class="text-light small">Version ' + config.app.version + '</span>\
                        </div>\
                    </div>\
                </div>';
    var footer = $(f_html);
    console.log('Footer initialized.');
    $('#footer').append(footer);
}


// Initialize buttons
function initItemActionButtons (selector) {
    // enable buttons (status, add, delete, autofill)
    enableButtonStatus(selector, '.dropdown-item');
    enableButtonAddReference(selector, 'button.btn-add-gnd');
    enableButtonAutoAdd(selector, 'button.btn-auto-ad');
    enableButtonEdit(selector, 'button.btn-edit');
    enableButtonDelete(selector, 'button.btn-delete');
}


function initIdentifierButtons (selector, delegate) {
    enableButtonIdentifierPopover(selector, delegate);
    enableButtonIdentifierToggling(selector, delegate);
}


// Init buttons
// Initialize action buttons
initItemActionButtons('#result-container');
// Initialize identifier buttons
initIdentifierButtons('#result-container', '.btn-group-ads .btn');
// Initialize Object Form Reset
enableObjectFormReset('#object-modal');


function addReference (trigger_element, fid, ref_input) {
    // ensure we have an array for further processing
    if (!Array.isArray(ref_input)) {
        ref_input = [ref_input];
    }
    var has_updated = false;
    ref_input.forEach(function(ref_id) {
        var selector = '#lbl-' + fid + '_' + ref_id;
        // Only update, if not already set
        if ($(selector).length == 0) {
            has_updated = true;
            // 1. update local object
            addRef2Data(idm.getObjectId(fid), ref_id);
            // 2. update frontend
            $(trigger_element).parents('.list-group-item').find('.btn-group-toggle')
                .append('<label id="lbl-' + fid + '_' + ref_id + '" data-ref-id="' + ref_id + '" data-content="Loading <i class=\'fas fa-sync-alt fa-spin\'></i>" class="btn">\
                            <input name="ad_' + fid + '" id="' + fid + '_' + ref_id + '" autocomplete="off" type="radio">' + ref_id + '</input>\
                        </label>');
        } else {
            console.log('Reference already exist.');
        }
    });
    if (has_updated) {
        //Fire event referenceUpdate
        $(trigger_element).trigger('referenceUpdate');
    }
}


function setItemButtonsAbilityByStatus (obj) {
    var fid = idm.getFrontendId(obj.id);
    if (obj[config.v.statusElement] == 'safe') {
        $('#' + fid + ' label.btn, #' + fid + ' input.form-control, #' + fid + ' .input-group > .input-group-append > button').addClass('disabled');
        $('#' + fid + ' input.form-control').attr('disabled', 'disabled');
    } else if (obj[config.v.statusElement] == 'unchecked' || obj[config.v.statusElement] == 'unsafe' || obj[config.v.statusElement] == 'unavailable') {
        $('#' + fid + ' label.btn, #' + fid + ' input.form-control, #' + fid + ' .input-group > .input-group-append > button').removeClass('disabled');
        $('#' + fid + ' input.form-control').removeAttr('disabled');
    }
}


function changeStatus (trigger_element, fid, current_status, new_status){
    // 1. update local_object
    var local_object = getLocalObjectById(idm.getObjectId(fid));
    // Set new status in local object
    local_object[config.v.statusElement] = new_status;
    // 2. update frontend
    // update button and status attribute of list group
    $('#btn-status-' + fid).html(local_object[config.v.statusElement]);
    $('#' + fid).removeClass('status-ref-' + current_status).addClass('status-ref-' + local_object[config.v.statusElement]);
    // update dropdown menu, by replacing content of current link with old status.
    // May disable button
    setItemButtonsAbilityByStatus(local_object);
    // This ends in new order of elements and could be optimized for better UX.
    trigger_element.html(current_status);
}


function prepareValueMapping (mapping_config, mapping_value) {
    var ret = mapping_value.toString();
    if (mapping_config.multiple){
        if (typeof mapping_value === 'string') {
            var value_arr = mapping_value.split('\n');
            if (value_arr.length > 1) {
                ret = value_arr.filter(function(v){
                    return v != '';
                });
            }
        } else if (Array.isArray(mapping_value)) {
            ret = mapping_value;
        }
    }
    return ret;
}


function prepareValueForEdit(mapping_value){
    var ret = mapping_value;
    if(Array.isArray(mapping_value)){
        ret = mapping_value.join('\n');
    }
    return ret;
}


function addObject (el, params){
    var params = params || null;
    // the first entry from config - mapping - localJSON Path is requierd //
    // 1. Create new local object
    var local_object = {};
    // Set ID, if not given as parameter
    var ids = false;
    if (params && params.id != undefined) {
        ids = idm.add(params.id);
    } else {
        ids = idm.add(); // new id will be generated
    }
    // Add new id mapping
    if (ids) {
        local_object.id = ids[1];
        // Set status (default status is configured), if not given as parameter
        if (params && params[config.v.statusElement] != undefined) {
            local_object[config.v.statusElement] = params[config.v.statusElement];
        } else {
            local_object[config.v.statusElement] = config.app.config.status.default;
        }
        // Add configured attributes to object
        var attributes = config.m;
        attributes.forEach(function (e) {
            if (e.localJSONPath) {
                if (params === null) {
                    if ($('#ipt-' + e.localJSONPath).val()) {
                        local_object[e.localJSONPath] = prepareValueMapping(e, $('#ipt-' + e.localJSONPath).val());
                    }
                } else {
                    if (params[e.localJSONPath]) {
                        local_object[e.localJSONPath] = prepareValueMapping(e, params[e.localJSONPath]);
                    }
                }
            }
        })
        // Add existing reference to object (this is for importing)
        if (params !== null && config.v.identifierElement !== undefined && params[config.v.identifierElement] !== undefined) {
            local_object[config.v.identifierElement] = params[config.v.identifierElement];
        }

        // 2. add new object (JSON) to local objects,
        if (Array.isArray(data_objects[config.a.JSONContainer])) {
            // at least 2 persons already exist
            data_objects[config.a.JSONContainer].push(local_object);
        } else if (data_objects[config.a.JSONContainer]) {
            // exactly one person exist
            var existing_person = data_objects[config.a.JSONContainer];
            data_objects[config.a.JSONContainer] = [existing_person];
            data_objects[config.a.JSONContainer].push(local_object);
        } else {
            // no person exist
            data_objects[config.a.JSONContainer] = local_object;
        }

        // 3 Fire add event
        $(el).trigger('objectAdd', local_object);

        // 3. update frontend,
        createNewHTMLObject(local_object);
        // 4. updates done then close modal
        $('#object-modal').modal('hide');
        $('#app-content-plugins-area').collapse('hide');

        // return new object
        return local_object;
    } else {
        // TODO: Throw error, an object with id already exist
    }
}


function editObject(oid, params) {
    var local_object = getLocalObjectById(oid);
    if (params != undefined && typeof params == 'object') {
        Object.entries(params).forEach(function (entry) {
            var attr_name = entry[0];
            if (entry[1].toString().trim() != '') {
                // update property
                var mapping_config = config.m.find(function (mc){
                    return mc.localJSONPath == attr_name;
                });
                local_object[attr_name] = prepareValueMapping(mapping_config, entry[1]);
            } else {
                // delete property
                delete local_object[attr_name];
            }
        });
    } else {
        $('#object-form').find('.object-form-input').each(function (i, e) {
            var attr_name = $(e).attr('name');
            if ($(e).val().toString().trim() != '') {
                var mapping_config = config.m.find(function (mc){
                    return mc.localJSONPath == attr_name;
                });
                local_object[attr_name] = prepareValueMapping(mapping_config, $(e).val());
            } else {
                // delete property
                delete local_object[attr_name];
            }
        })
    }
    var fid = idm.getFrontendId(oid);
    // Trigger an event
    $('#' + fid).trigger('objectUpdate');
    /* 2. update frontend
    Update title and description of list item */
    $('#' + fid + ' h5').text(local_object[config.v.titleElement]);
    $('#' + fid + ' p').text(dataToString(local_object[config.v.descriptionElement]));
    // Close modal,
    $('#object-modal').modal('hide');
}


function deleteObject (trigger, oid) {
    // 1. Update local object
    if (Array.isArray(data_objects[config.a.JSONContainer])) {
        var obj_idx = data_objects[config.a.JSONContainer].findIndex(function (obj) {
            if (obj !== undefined)
            {
                return obj.id === oid
            }
        });
        data_objects[config.a.JSONContainer].splice(obj_idx, 1);
    } else {
        // there is only one object left, so reset data_objects
        data_objects = {};
    }
    console.log('Session: Deleted object with ID: ' + oid);
    //Fire event objectDelete
    $(trigger).trigger('objectDelete', oid);
    // 3. Update Frontend
    var fid = idm.getFrontendId(oid);
    $('#' + fid).remove()
    // 4. Delete id mapping
    idm.delete(fid);
}


/* Modals */
function shiftIdentifier (fid, ref_id, direction) {
    var obj = getLocalObjectById(idm.getObjectId(fid));
    var id_to_shift_idx = obj[config.v.identifierElement].findIndex(function (el) {
        // TODO: API constraint: #text
        return el['#text'] == config.v.identifierBaseURL + ref_id;
    })
    var button_to_shift = $('#lbl-' + fid + '_' + ref_id);
    if (direction == 'right') {
        // 1. update local object
        obj[config.v.identifierElement].splice(id_to_shift_idx + 2, 0, obj[config.v.identifierElement][id_to_shift_idx]) // Copy element after next element
        obj[config.v.identifierElement].splice(id_to_shift_idx, 1); // Remove duplicate at initial position
        // 2. update frontend (list item)
        var button_to_swap_with = button_to_shift.next();
        button_to_swap_with.replaceWith(button_to_shift);
        button_to_swap_with.insertBefore(button_to_shift);
    } else if (direction == 'left') {
        // 1. update local object
        obj[config.v.identifierElement].splice(id_to_shift_idx - 1, 0, obj[config.v.identifierElement][id_to_shift_idx]) // Copy element before previous element
        obj[config.v.identifierElement].splice(id_to_shift_idx + 1, 1); // Remove duplicate. Attention: index of duplicate increased by one!
        // 2. update frontend (list item)
        var button_to_swap_with = button_to_shift.prev();
        button_to_swap_with.replaceWith(button_to_shift);
        button_to_swap_with.insertAfter(button_to_shift);
    }
}


function deleteIdentifier (fid, ref_id) {
    // 1. delete in local object
    var obj = getLocalObjectById(idm.getObjectId(fid));
    if (Array.isArray(obj[config.v.identifierElement])) {
        var id_to_delete_idx = obj[config.v.identifierElement].findIndex(function (el) {
            // TODO: API constraint: #text
            return el['#text'] == config.v.identifierBaseURL + ref_id;
        });
        obj[config.v.identifierElement].splice(id_to_delete_idx, 1);
    } else {
        // only one identifier left, delete reference property
        delete obj[config.v.identifierElement];
    }
    // 2. delete in frontend (list item)
    $('#lbl-' + fid + '_' + ref_id).remove();
}


function confirmModal (selector, callback) {
    var button = $(selector) // Button that triggered the modal
    var recipient = button.attr('id') // Extract info from data-* attributes
    var action_name = recipient.substring(recipient.indexOf('-') + 1,recipient.indexOf('_'));
    var list_group_item = button.parents('.list-group-item');
    var title = list_group_item.find('h5').text();
    bootbox.confirm({
        title: '<h5>Delete object: ' + title + '</h5>',
        size: 'small',
        closeButton: false,
        message: 'Do you really want to ' + action_name + '?',
        buttons: {
            confirm: {
                label: '<i class="fa fa-check"></i> YES',
                className: 'btn-sm',
                className: 'btn-dark'
            },
            cancel: {
                label: '<i class="fa fa-ban"></i> NO',
                className: 'btn-sm',
                className: 'btn-outline-secondary'
            }
        },
        callback: callback
    });
}


/*
    Identity Manager (IDM)
    The IDM provides an index of mapped local and foreign IDs and methods to manage them.
    It is used to seperate local, especially frontend, JQuery-secure IDs from external
    ID schemata, which may break the element access by CSS-selectors.
*/
function IdentityManager () {
    this.object_ids;
    this.frontend_ids;
    this.id_map;
}


IdentityManager.prototype.init = function() {
    this.object_ids = new Set();
    this.frontend_ids = new Set();
    this.id_map = new Set();
    console.log('IdentityManager: Initialized.');
    return this;
}


IdentityManager.prototype.add = function(object_id) {
    // Generate new frontend id
    var frontend_id = 'fid' + this.create_UUID();
    // Use new frontend id as object id if not provided
    if (object_id === undefined || object_id.toString().trim() === '') {
        object_id = frontend_id;
    }
    if (!this.object_ids.has(object_id)) {
        // Add id pair to id map
        this.object_ids.add(object_id);
        this.frontend_ids.add(frontend_id);
        this.id_map.add([frontend_id, object_id]);

        return [frontend_id, object_id];
    }
};


IdentityManager.prototype.delete = function(frontend_id) {
    var object_id = this.getObjectId(frontend_id);
    // remove ids from index and map
    this.object_ids.delete(object_id);
    this.frontend_ids.delete(frontend_id);
    this.id_map.delete(this.getMappingByFrontendId(frontend_id));
    return object_id;
};


IdentityManager.prototype.getFrontendId = function(object_id) {
    var frontend_id;
    for (let ids of this.id_map.values()) {
        if (ids[1] == object_id) {
            frontend_id = ids[0];
            break;
        }
    }
    return frontend_id;
};


IdentityManager.prototype.getObjectId = function(frontend_id) {
    var object_id;
    for (let ids of this.id_map.values()) {
        if (ids[0] == frontend_id) {
            object_id = ids[1];
            break;
        }
    }
    return object_id;
};


IdentityManager.prototype.getMappingByFrontendId = function(frontend_id) {
    var mapping;
    for (let ids of this.id_map.values()) {
        if (ids[0] == frontend_id) {
            mapping = ids;
            break;
        }
    }
    return mapping;
};


IdentityManager.prototype.update = function(frontend_id, old_object_id, new_object_id) {
    if (this.object_ids.has(old_object_id) && !this.object_ids.has(new_object_id)) {
        this.object_ids.delete(old_object_id);
        this.object_ids.add(new_object_id);
        this.id_map.delete(this.getMappingByFrontendId(frontend_id));
        this.id_map.add([frontend_id, new_object_id]);
        return [frontend_id, new_object_id];
    }
}


IdentityManager.prototype.create_UUID = function (){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}


