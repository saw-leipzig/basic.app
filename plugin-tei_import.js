// Action button
var btn_action_tei_upload = $('<button id="btn-upload-tei" data-toggle="modal" data-target="#tei-file-upload-modal" type="button"></button>')
    // Add classes
    .addClass('btn btn-outline-light')
    // Add button content
    .append('<span class="fas fa-file"></span> Upload TEI-XML')
    // Register events for action button
    .on('click', function () {
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
    });
// Register action button
basicPluginActions.registerButton(btn_action_tei_upload);



var tei_modal_file_upload_html = '<div class="modal fade" id="tei-file-upload-modal" tabindex="-1" aria-hidden="true" role="dialog">\
                                  <div class="modal-dialog modal-lg" role="document">\
                                      <div class="modal-content">\
                                          <div class="modal-header">\
                                              <h5 class="modal-title">Upload TEI-XML</h5>\
                                              <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                                  <span aria-hidden="true">✖</span>\
                                              </button>\
                                          </div>\
                                          <div class="modal-body">\
                                              <div class="form-group">\
                                                <label for="uploadFileTEI">XML-file to load entities from</label>\
                                                <input type="file" class="form-control-file" id="uploadFileTEI" onchange="getEntitiesFromXML()">\
                                              </div>\
                                              <form id="import-entities-form"></form>\
                                              <button type="button" class="btn btn-primary disabled" id="btn-import-from-tei">Import <span class="badge badge-light" id="found-entities">0</span> entities</button>\
                                          </div>\
                                      </div>\
                                  </div>\
                              </div>';
var tei_modal_file_upload = $(tei_modal_file_upload_html)
    .appendTo('#modals');


var importable_entities;
var names_to_import = [];

// register click event listener
$('#modals').on('click', '#btn-import-from-tei', function (e){
    importEntities(e);
});


function getEntitiesFromXML () {
    var context2elementname = {
        'persons': 'persName',
        'places' : 'placeName',
        'organisations': 'orgName'
    };
    var btn_import = document.querySelector('#btn-import-from-tei');
    var count_span = document.querySelector('#found-entities');
    var entities_form = $('#import-entities-form');
    var file    = document.querySelector('#uploadFileTEI').files[0];
    var reader  = new FileReader();

    reader.addEventListener("load", function () {
        console.log('File loaded: ' + file.name);
        // Reset importables, form, etc.
        importable_entities = [];
        entities_form.empty();
        $(count_span).empty();
        $(btn_import).addClass('disabled');
        var xmlDoc = $.parseXML(reader.result);
        var xml = $(xmlDoc);
        // TODO: check if its TEI
        // Get all elements
        var entities = xml.find(context2elementname[context]);
        // Uniquify by reference and name
        var unique_names = [];
        var found_ids = [];
        var identified_entities = entities.filter(function (i, e) {
            var name = e.textContent;
            var id = e.getAttribute('ref');
            // object is identically if it has the same id or the same name

            if (id != null) {
                if (found_ids.includes(id)) {
                    return false;
                } else {
                    found_ids.push(id)
                    unique_names.push(e.textContent)
                    return true;
                }
            } else {
                if (unique_names.includes(e.textContent)) {
                    return false;
                } else {
                    unique_names.push(e.textContent)
                    return true;
                }
            }
        });
        console.log(identified_entities.length + ' / ' + entities.length + ' ' + context2elementname[context] + ' elements with unique name or identifier contained in file.');

        importable_entities = identified_entities;
        names_to_import = unique_names;
        // Update import button
        count_span.innerHTML = importable_entities.length;
        if (importable_entities.length > 0) {
            // Add importable entities to import form with filter buttons
            $('#tei-file-upload-modal .form-group button[type="button"]').remove();
            var chk_button_filter = '<div class="btn-group mt-2" id="check-buttons" role="group">\
                                        <button class="btn btn-sm btn-secondary" id="import-tei-btn-chk-all" type="button">Select All</button>\
                                        <button class="btn btn-sm btn-secondary" id="import-tei-btn-chk-none" type="button">Deselect All</button>\
                                    </div>';
            $(chk_button_filter).appendTo('#tei-file-upload-modal .form-group');
            importable_entities.each(function (i, e) {
                var ref_html = '';
                if (e.attributes.ref && e.attributes.ref.value.startsWith(config.v.identifierBaseURL)) {
                    ref_html = ' <span class="badge badge-dark">' + e.attributes.ref.value.substr(config.v.identifierBaseURL.length) + '</span>';
                }
                var chk_html = '<div class="form-check form-check-inline">\
                                  <input class="form-check-input" type="checkbox" value="' + e.textContent + '" id="import-entitiy-' + i + '" checked>\
                                  <label class="form-check-label" for="import-entitiy-' + i + '">\
                                    ' + e.textContent + ref_html +'\
                                  </label>\
                                </div>';
                $(chk_html).appendTo(entities_form);
            })
            $(btn_import).removeClass('disabled');
            $('#modals').on('click', '#import-tei-btn-chk-all', function(){
                $('#import-entities-form input[type="checkbox"]').prop('checked', true).trigger('change');
            });
            $('#modals').on('click', '#import-tei-btn-chk-none', function(){
                $('#import-entities-form input[type="checkbox"]').prop('checked', false).trigger('change');
            });
        }
        $('#modals').on('change', '#import-entities-form input[type="checkbox"]', updateImportables );
    }, false);

    if (file) {
        reader.readAsText(file);
    }
}


function updateImportables (event){
    var target_chk = event.target;
    if(target_chk.checked){
        if(!names_to_import.includes(target_chk.value)){
            names_to_import.push(target_chk.value);
        }
    } else {
        if(names_to_import.includes(target_chk.value)){
            var idx_ie = names_to_import.indexOf(target_chk.value);
            names_to_import.splice(idx_ie, 1);
        }
    }
    // update counter on import button
    $('#modals #found-entities').html(names_to_import.length);
}


function importEntities(event) {
    console.log('Importing entities...');
    importable_entities.each(function (i, e) {
        if (names_to_import.includes(e.textContent)) {
            // Set params for new local object
            var params = {};
            params[config.v.titleElement] = e.textContent;
            // Check if we already have references set, which we can import.
            // They should be in the 'ref'-attribute
            if (e.attributes.ref !== undefined && e.attributes.ref.value.startsWith(config.v.identifierBaseURL)) {
                // TODO: this structure must be configurable and should not be fixed in the code, because this is
                // specific to the exist-db JSON export.
                params[config.v.identifierElement] = {
                    '#text': e.attributes.ref.textContent,
                    'preferred': 'YES'
                };
            }
            addObject(event.target, params)
        }
    });
    console.log('Import finished.');
    countObjectsByStatus();
    // close modal
    $('#tei-file-upload-modal').modal('hide');
}

$('#modals').on('hidden.bs.modal', '#tei-file-upload-modal', function (e){
    // replace the modal html with html template
    $('#tei-file-upload-modal').replaceWith(tei_modal_file_upload_html);
});
