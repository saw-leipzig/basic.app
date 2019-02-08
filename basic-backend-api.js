/**
 * This storage plugin requires additional parameter configured in config.js to work properly.
 *
 * config.app.config.baseURL = 'http://localhost:9080/exist/apps/basic/';
 * config.app.config.api.persons.datasets = "api/datasets/";
 * config.app.config.api.persons.RESTAPI = "api/persons/";
 * config.app.config.api.places.datasets = "api/datasets/";
 * config.app.config.api.places.RESTAPI = "api/places/";
 * config.app.config.api.organisations.datasets = "api/datasets/";
 * config.app.config.api.organisations.RESTAPI = "api/organisations/";
 *
 */


// Current dataset - cds (backend XML storage)
var request_url = new URL(window.location);
var cds = request_url.searchParams.get("dataset");
console.log('REST-API: Current dataset: ' + cds);
var query_dataset = {'dataset': cds};


// Build plugin dataset dropdown
var plugin_xml_datasets = $('<div id="xml-datasets-dropdown"></div>')
    // Add classes
    .addClass('btn-group btn-group-sm')
    // Add dropdown button
    .append('<button type="button" class="btn btn-outline-light dropdown-toggle text-truncate" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                Current Dataset: <em id="xml-dataset-current"/>\
            </button>')
    // Add dropdown menu
    .append('<div class="dropdown-menu" id="xml-datasets"></div>');


// Add plugin section
var basicPluginXMLStorage = new BasicAppPlugin('app-plugin-xml', 'eXist Storage Configuration', 'fas fa-database', '#app-content-plugins-configuration', 'NO');
basicPluginXMLStorage.render(plugin_xml_datasets);


/* Dataset dropdown */
function enableButtonDatasets (selector) {
    $(selector).on('click', function () {
        var element_value = $(this).text();
        console.log('This is the dataset: ' + element_value);
        var uri = window.location.origin + window.location.pathname + '?dataset=' + element_value;
        window.location.href = uri;
        $('#app-content-plugins-area').collapse('hide');
    });
}


function addDatasetsToDOM (result) {
    var cnt = 0;
    if (result) {
        cnt = asArray(result.dataset).length;
        asArray(result.dataset).forEach(function (dataset) {
            if (dataset != cds){
                $('#xml-datasets').append('<button class="dropdown-item" type="button">' + dataset + '</button>');
            }
        })
        // enable dataset dropdown
        enableButtonDatasets('#xml-datasets > button');
    }
    console.log('REST-API: ' + cnt + ' datasets available.');
}

// @return: frontend id
function getIDFromEventListItem (event) {
    var et = $(event.target);
    if (et.hasClass('list-group-item')) {
        return et.attr('id');
    } else {
        return et.parents('.list-group-item').get(0).id;
    }
}


// @return: frontend id
function getIDFromEventModals (event) {
    var et = $(event.target);
    var card = et.parents('.card-reference');
    var ids = card.attr('id').substring('card-'.length);
    var fid = ids.substring(0, ids.indexOf('_'));
    return fid;
}


// @return: frontend id
function getIDFromEventMap (event){
    var et = $(event.target);
    var ids = et.attr('id').substring('mapMarkerPref-'.length);
    var fid = ids.substring(0, ids.indexOf('_'));
    return fid;
}


function getXMLElementString (element_name, content) {
    content = content || '';
    return '<' + element_name + '>' + content + '</' + element_name + '>';
}


function getXMLStringFromLocalObjectByID (oid) {
    if (oid != '') {
        // get instance of local object
        var local_object = getLocalObjectById(oid);
        // Create XML container as JQuery object
        var container_xml = getXMLElementString(config.a.JSONContainer);
        var xml_doc = $.parseXML(container_xml);
        var xml = $(xml_doc);
        // Add attributes id and status to container
        var container = xml.find(config.a.JSONContainer);
        container.attr('id', local_object.id).attr(config.v.statusElement, local_object[config.v.statusElement]);
        // Add name element
        container.append(getXMLElementString(config.v.titleElement, local_object[config.v.titleElement]));
        // Add description element (optional) -- excluded 'alias'
        if (config.v.descriptionElement != undefined && config.v.descriptionElement != 'alias') {
            container.append(getXMLElementString(config.v.descriptionElement, local_object[config.v.descriptionElement]));
        }
        // Add reference elements
        asArray(local_object[config.v.identifierElement]).forEach(function (ref) {
            var ref_element = xml_doc.createElement(config.v.identifierElement);
            ref_element.appendChild(xml_doc.createTextNode(ref['#text']));
            var preferred_attribute = xml_doc.createAttribute('preferred');
            preferred_attribute.value = ref['preferred'];
            ref_element.setAttributeNode(preferred_attribute);
            container.append(ref_element);
        });
        // Add elements, configured in mapping, except title, because we did that already
        asArray(config.m).forEach(function (c) {
            if (c.localJSONPath && local_object[c.localJSONPath] && c.localJSONPath != config.v.titleElement) {
                if (Array.isArray(local_object[c.localJSONPath])) {
                    local_object[c.localJSONPath].forEach(function(i) {
                        container.append(getXMLElementString(c.localJSONPath, i));
                    })
                } else {
                    container.append(getXMLElementString(c.localJSONPath, local_object[c.localJSONPath]));
                }
            }
        });

        return new XMLSerializer().serializeToString(xml[0].documentElement);
    }
}


// Add event listener for all API calls
$('body').on('objectAdd', function (e,data) {
    APIAdd(data);
})
$('body').on('objectDelete', function (e, oid) {
    APIDelete(oid);
})
$('body').on('objectUpdate statusChange preferredReferenceChange referenceUpdate', function (e) {
    APIUpdate(idm.getObjectId(getIDFromEventListItem(e)));
})

$('body').on('cardReferenceDelete cardPreferredReferenceChange cardSwitch',function (e){
    APIUpdate(idm.getObjectId(getIDFromEventModals(e)));
})

$('body').on('mapPreferredReferenceChange', function (e) {
    APIUpdate(idm.getObjectId(getIDFromEventMap(e)));
})
$('body').on('basicAppConfigLoaded', function () {
    APIDatasets();
})


/* API functions */
function APIAdd(obj){
    var query = '?' + jQuery.param(query_dataset);
    $.post(config.app.config.baseURL + config.a.RESTAPI + query, obj).done(function (data) {
        //Update ID of Local Object
        var old_id = obj.id;
        getLocalObjectById(obj.id).id =  data.response.id;
        // Update id mapping
        idm.update(idm.getFrontendId(old_id), old_id, data.response.id);
        console.log('REST-API: Added object with new ID: ' + data.response.id);
    });

}


function APIUpdate (oid) {
    var query = '?' + jQuery.param(query_dataset);
    $.ajax({
        url: config.app.config.baseURL + config.a.RESTAPI + oid + query,
        type: 'PUT',
        headers: {
            "Content-Type": "application/xml",
            "charset": "utf-8"
        },
        data: getXMLStringFromLocalObjectByID(oid),
        success: function () {
            console.log('REST-API: Updated object with ID: ' + oid);
        }
    });
}


function APIDelete (oid) {
    var query = '?' + jQuery.param(query_dataset);
    $.ajax({
        url: config.app.config.baseURL + config.a.RESTAPI + oid + query,
        type: 'DELETE',
        success: function () {
            console.log('REST-API: Deleted object with ID: ' + oid);
        }
    });
}


function APIDatasets () {
    // save the current dataset for the session to easly switch the context without loosing chosen datasets
    if(cds){
       sessionStorage.setItem(context,cds);
    }
    // Load available datasets
    $.getJSON(config.app.config.baseURL + config.a.datasets + context).done(function (result) {
        addDatasetsToDOM(result);
    });
    // To take the remembered dataset query_dataset has to override
    if(sessionStorage.getItem(context)){
        cds = sessionStorage.getItem(context);
        query_dataset = {'dataset': cds};
    }
    if (cds) {
        // Load objects from cds in object cache
        $.getJSON(config.app.config.baseURL + config.app.config.api[context].RESTAPI, query_dataset).done(function (result) {
            var cnt = 0;
            if (result) {
                cnt = 1;
                if (Array.isArray(result[config.a.JSONContainer])) {
                    cnt = result[config.a.JSONContainer].length;
                }
                data_objects = result;
            }
            console.log('REST-API: ' + cnt + ' object(s) loaded.');
            // Create result list representation and activate id management
            asArray(data_objects[config.a.JSONContainer]).reverse().forEach(function (obj) {
                idm.add(obj.id);
                createNewHTMLObject(obj);
            });
            // Set current dataset
            $('#xml-dataset-current').html(cds);
            // dataset loaded
            $('body').trigger('datasetLoaded');
        });
    }
}
