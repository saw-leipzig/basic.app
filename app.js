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


$(document).ready(function () {
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
                    // TODO: handle typespecific, string, dates, objects?
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


function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}


function replaceLocalIDInFrontend(old_id, new_id) {
    var list_item = $('#' + old_id);
    // Work around: Delete old, create new
    list_item.remove();
    createNewHTMLObject(getLocalObjectById(new_id));
}


function dataToString (data) {
    if (Array.isArray(data)) {
        data = data.join(', ');
    }
    return data;
}


function createNewHTMLObject(data){
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
    var status_dropdown_html = '<button id="btn-status-' + data.id + '" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="btn btn-status dropdown-toggle">' + status + '</button><div class="dropdown-menu" aria-labelledby="'+ data.id + '">' + status_buttons.join('') + '</div>'

    var input_gnd_html = '<input id="ipt-new-' + data.id + '" type="text" class="form-control form-control-gray" name="' + data.id + '" placeholder="new Identifier URL" />'
    var input_search_html = '<input id="ipt-search_' + data.id + '" type="text" class="form-control form-control-gray" placeholder="Search for" />'
    var button_add_html = '<button type="button" aria-label="Add Identifier-URL" title="Add given identifier" class="btn btn-add-gnd btn-outline-secondary"><span class="fas fa-plus"></span></button>'
    var button_edit_html = '<button id="btn-edit_' + data.id + '" type="button" data-toggle="modal" data-target="#object-modal" title="Edit" class="btn btn-edit btn-outline-secondary"><span class="fas fa-edit"></span></button>';
    var button_autoadd_html = '<button id="btn-auto-ad_' + data.id + '" type="button" aria-label="Try to automatically match authority data" data-api-search="' + data[config.v.titleElement] + '" title="Autofill: Click to search for: ' + data[config.v.titleElement] + '" class="btn btn-auto-ad btn-outline-secondary"><span class="fas fa-binoculars"></span></button>';
    var button_compare_html = '<button id="btn-compare_' + data.id + '" type="button" aria-label="Show tabular view of fetched data." data-toggle="modal" data-target="#compare-modal" title="Open card view" class="btn btn-compare btn-outline-secondary"><span class="fas fa-table"></span></button>';
    var button_del_html = '<button id="btn-delete_' + data.id + '" type="button" aria-label="Delete." title="Delete" class="btn btn-delete btn-outline-secondary"><span class="fas fa-trash"></span></button>';
    var ads_buttons = [];
    asArray(data[config.v.identifierElement]).forEach(function (ref_data) {
        var ref_id = ref_data['#text'].substring(config.v.identifierBaseURL.length);
        var pref_class = '';
        if (ref_data['preferred'] == 'YES') {
            pref_class = 'active';
        }
        ads_buttons.push('<label id="lbl-' + data.id + '_' + ref_id + '" data-ref-id="' + ref_id + '" data-content="Loading <i class=\'fas fa-sync-alt fa-spin\'></i>" class="btn ' + pref_class + '"><input name="ad_' + data.id + '" id="' + data.id + '_' + ref_id + '" type="radio">' + ref_id + '</input></label>')
    })
    var list_item_html = '<div class="list-group-item status-ref status-ref-' + status + '" id="'+ data.id +'">\
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
                            <div id="ads-' + data.id + '" class="btn-group btn-group-sm btn-group-toggle btn-group-ads">' + ads_buttons.join('') + '</div>\
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


function addRef2Data (element_id, ref_id) {
    var obj = getLocalObjectById(element_id);
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


function togglePreferredRef2Data (element_id, ref_id) {
    var obj = getLocalObjectById(element_id);
    if (Array.isArray(obj[config.v.identifierElement])) {
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
        if (ref_old_idx >= 0) {
            obj[config.v.identifierElement][ref_old_idx].preferred = 'NO';
        }
    } else {
        // Set preferred on new id
        obj[config.v.identifierElement].preferred = 'YES';
    }
}


function togglePreferred (id, ref_id) {
    // 1. update local object
    togglePreferredRef2Data(id, ref_id);
    // 2. update frontend
    // toggle button state in list
    $('#' + id + ' label.btn.active').removeClass('active');
    $('#lbl-' + id + '_' + ref_id).addClass('active');
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
        var id = $('#ipt-id').val();
        if (data_objects) {
            //console.log(local_object);
            if (id != '') {
                // 1. update local object
                editObject(id);
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
            var element_id = $(this).parents('.list-group-item'). get (0).id;
            var raw_value = $('#ipt-new-' + element_id).val();
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
                addReference(this, element_id, ref_id);
            }
        }
    });
}


function enableButtonIdentifierToggling (selector, delegate_selector) {
    $(selector).on('click', delegate_selector, function () {
        if (! $(this).hasClass('disabled')) {
            if (! $(this).hasClass('active')) {
                // button is not already active, so
                var id_composition = $(this). get (0).id.substring($(this). get (0).id.indexOf('-') + 1);
                var element_id = id_composition.substring(0, id_composition.indexOf('_'));
                var ref_id = $(this).attr("data-ref-id");
                // toggle state: local, backend, frontend
                togglePreferred(element_id, ref_id);
                // Fire event preferredReferenceChange
                $(this).trigger('preferredReferenceChange');
            }
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
        var element_id = $(this).parent().attr('aria-labelledby');
        var current_status = $('#btn-status-' + element_id).html();
        var new_status = $(this).html();
        changeStatus($(this), element_id, current_status, new_status);
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
            var element_id = $(this).attr('id').substring($(this).attr('id').indexOf('_') + 1);
            var search_value = $('#ipt-search_' + element_id).val();
            if (search_value) {
                // use input as query
                var searchterm = search_value;
            } else {
                // Simple name based search query
                var searchterm = $(this).parents('.list-group-item').find('h5').text();
            }
            findAuthorityData(btn, searchterm, element_id);
        }
    });
}


/* Load item data in modal form */
function enableButtonEdit (selector, delegate_selector) {
    $(selector).on('click', delegate_selector, function () {
        var recipient = $(this).attr('id') // Extract info from data-* attributes
        var data_id = recipient.substring(recipient.indexOf('_') + 1);
        var local_object = getLocalObjectById(data_id);
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
                var element_id = trigger.parents('.list-group-item').get(0).id;
                deleteObject(trigger, element_id);
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
        var status = $(this). get (0).id.substring(idstr.length);
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
    console.log('init');
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


function addReference (trigger_element, element_id, ref_input) {
    // ensure we have an array for further processing
    if (!Array.isArray(ref_input)) {
        ref_input = [ref_input];
    }
    var has_updated = false;
    ref_input.forEach(function(ref_id) {
        var selector = '#lbl-' + element_id + '_' + ref_id;
        // Only update, if not already set
        if ($(selector).length == 0) {
            has_updated = true;
            // 1. update local object
            addRef2Data(element_id, ref_id);
            // 2. update frontend
            $(trigger_element).parents('.list-group-item').find('.btn-group-toggle')
                .append('<label id="lbl-' + element_id + '_' + ref_id + '" data-ref-id="' + ref_id + '" data-content="Loading <i class=\'fas fa-sync-alt fa-spin\'></i>" class="btn">\
                            <input name="ad_' + element_id + '" id="' + element_id + '_' + ref_id + '" autocomplete="off" type="radio">' + ref_id + '</input>\
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
    if (obj[config.v.statusElement] == 'safe') {
        $('#' + obj.id + ' label.btn, #' + obj.id + ' input.form-control, #' + obj.id + ' .input-group > .input-group-append > button').addClass('disabled');
        $('#' + obj.id + ' input.form-control').attr('disabled', 'disabled');
    } else if (obj[config.v.statusElement] == 'unchecked' || obj[config.v.statusElement] == 'unsafe' || obj[config.v.statusElement] == 'unavailable') {
        $('#' + obj.id + ' label.btn, #' + obj.id + ' input.form-control, #' + obj.id + ' .input-group > .input-group-append > button').removeClass('disabled');
        $('#' + obj.id + ' input.form-control').removeAttr('disabled');
    }
}


function changeStatus (trigger_element, element_id, current_status, new_status){
    // 1. update local_object
    var local_object = getLocalObjectById(element_id);
    // Set new status in local object
    local_object[config.v.statusElement] = new_status;
    // 2. update frontend
    // update button and status attribute of list group
    $('#btn-status-' + element_id).html(local_object[config.v.statusElement]);
    $('#' + element_id).removeClass('status-ref-' + current_status).addClass('status-ref-' + local_object[config.v.statusElement]);
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
    if (params && params.id != undefined) {
        local_object.id = params.id.replace(/\./gi, '');
    } else {
        local_object.id = 'loc' + create_UUID();
    }
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
                } else {
                    local_object[e.localJSONPath] = null;
                }
            } else {
                if (params[e.localJSONPath]) {
                    local_object[e.localJSONPath] = prepareValueMapping(e, params[e.localJSONPath]);
                } else {
                    local_object[e.localJSONPath] = null;
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
}


function editObject(id, params) {
    var local_object = getLocalObjectById(id);
    if (params != undefined && typeof params == 'object') {
        Object.entries(params).forEach(function (entry) {
            var attr_name = entry[0];
            var mapping_config = config.m.find(function (mc){
                return mc.localJSONPath == attr_name;
            });
            local_object[attr_name] = prepareValueMapping(mapping_config, entry[1]);
        });
    } else {
        $('#object-form').find('.object-form-input').each(function (i, e) {
            var attr_name = $(e).attr('name');
            var mapping_config = config.m.find(function (mc){
                return mc.localJSONPath == attr_name;
            });
            local_object[attr_name] = prepareValueMapping(mapping_config, $(e).val());
        })
    }
    // Trigger an event
    $('#' + id).trigger('objectUpdate');
    /* 2. update frontend
    Update title and description of list item */
    $('#' + id + ' h5').text(local_object[config.v.titleElement]);
    $('#' + id + ' p').text(dataToString(local_object[config.v.descriptionElement]));
    // Close modal,
    $('#object-modal').modal('hide');
}


function deleteObject (trigger, element_id) {
    // 1. Update local object
    if (Array.isArray(data_objects[config.a.JSONContainer])) {
        var obj_idx = data_objects[config.a.JSONContainer].findIndex(function (obj) {
            if (obj !== undefined)
            {
                return obj.id === element_id
            }
        });
        data_objects[config.a.JSONContainer].splice(obj_idx, 1);
    } else {
        // there is only one object left, so reset data_objects
        data_objects = {};
    }
    console.log('Session: Deleted object with ID: ' + element_id);
    //Fire event objectDelete
    $(trigger).trigger('objectDelete', element_id);
    // 3. Update Frontend
    $('#' + element_id).remove()
}


/* Modals */
function getCardHTML (cardid, fn, attributes, links, classes) {
    // Card header, with buttons for preferred, moving and delete
    var header_buttons = [];
    // If links is empty, it should be the reference data set
    if (links.length) {
        header_buttons.push('<button type="button" class="btn btn-secondary btn-card-left"><i class="fas fa-angle-left"></i></button>');
        // preferred button
        var classes_pref = 'btn btn-secondary btn-card-preferred';
        if (classes.indexOf('bg-info') >= 0) {
            classes_pref = 'btn btn-secondary btn-card-preferred active disabled';
        }
        header_buttons.push('<button type="button" class="' + classes_pref + '">' + fn + '</button>');
        header_buttons.push('<button type="button" class="btn btn-secondary btn-card-delete"><i class="fas fa-times"></i></button>');
        header_buttons.push('<button type="button" class="btn btn-secondary btn-card-right"><i class="fas fa-angle-right"></i></button>');
    } else {
        header_buttons.push('<button type="button" class="btn btn-secondary disabled">' + fn + '</button>');
    }
    var button_group = '<div class="btn-group btn-group-sm btn-group-card-header" role="group">' + header_buttons.join('') + '</div>';
    var card_header = '<div class="card-header">' + button_group + '</div>';
    //var card_body = '<div class="card-body"><h5 class="card-title">' + obj.fullname + '</h5></div>';
    var card_body = '';
    // Put resource links in card footer
    link_items = '';
    links.forEach(function (link) {
        link_items = link_items + '<a href="' + link.url + '" class="badge badge-light" target="_blank" title="Open ' + link.url + ' in new tab.">' + link.name + '</a>';
    });
    var card_footer = '<div class="card-footer">' + link_items + '</div>';
    // Create attribute list
    var list_items = '';
    attributes.forEach(function (attribute_object) {
        var attribute = attribute_object.value;
        var attribute_classes = ['list-group-item', 'text-truncate', 'modal-card-zoom'];
        var attribute_content = '-';
        if (attribute === undefined || attribute == 0) {
            attribute_classes.push('list-group-item-secondary');
        } else {
            attribute_content = attribute;
        }
        list_items = list_items + '<li class="' + attribute_classes.join(' ') + '" data-content-label="' + attribute_object.key + '"><small>' + attribute_content + '</small></li>';
    });
    var card_attr_list = '<ul class="list-group list-group-flush text-dark">' + list_items + '</ul>';
    var card = '<div id="card-' + cardid + '" class="card ' + classes.join(" ") + '">' + card_header + card_body + card_attr_list + card_footer + '</div>';
    return card;
}


function shiftIdentifier (element_id, ref_id, direction) {
    var obj = getLocalObjectById(element_id);
    var id_to_shift_idx = obj[config.v.identifierElement].findIndex(function (el) {
        // TODO: API constraint: #text
        return el['#text'] == config.v.identifierBaseURL + ref_id;
    })
    var button_to_shift = $('#lbl-' + element_id + '_' + ref_id);
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


function deleteIdentifier (element_id, ref_id) {
    // 1. delete in local object
    var obj = getLocalObjectById(element_id);
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
    $('#lbl-' + element_id + '_' + ref_id).remove();
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
