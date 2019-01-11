function TEIImportPlugin() {
    var plugin = this;
    this.importable_entities =[];
    this.names_to_import = [];
    this.ids_to_import = []; // local ids
    this.context2elementname ={
        'persons': 'persName',
        'places' : 'placeName',
        'organisations': 'orgName'
    }
    this.id_attribute_name = 'id';
    this.reference_attribute_name = 'ref';

    /* ----- Upload XML/TEI ----- */
    // Create and register TEI upload button
    this.btn_action_tei_upload = $('<button id="btn-upload-tei" data-toggle="modal" data-target="#tei-file-upload-modal" type="button"></button>')
        // Add classes
        .addClass('btn btn-outline-light')
        // Add button content
        .append('<span class="fas fa-file-upload"></span> Upload TEI-XML')
        // Register events for action button
        .on('click', function () {
            // Hide plugins
            $('#app-content-plugins-area').collapse('hide');
        });
    // Register action button
    basicPluginActions.registerButton(this.btn_action_tei_upload);


    // Build the statuus buttons
    var modal_tei_file_upload_status_html = '';
    config.app.config.status.available.forEach(function (status) {
        if(status == config.app.config.status.default){
            modal_tei_file_upload_status_html += '<label class="btn btn-secondary active">\
                    <input type="radio" name="tei-import-status" value="' + status + '" autocomplete="off" checked>' + status + '\
                </label>';
        } else {
            modal_tei_file_upload_status_html += '<label class="btn btn-secondary">\
                    <input type="radio" name="tei-import-status" value="' + status + '" autocomplete="off">' + status + '\
                </label>';
        }
    });
    // Build part for name parameters
    var modal_tei_file_upload_names_html = '<div class="form-row">\
                                                <div class="form-group col">\
                                                    <label for="objectElementName"><small>Element name. <span class="text-muted">The name of the element, which holds importable object information.</span></small></label>\
                                                    <input type="text" id="objectElementName" name="tei-import-element" class="modal-tei-upload-names-ipt form-control form-control-sm" value="' + this.context2elementname[context] + '">\
                                                </div>\
                                                <div class="form-group col">\
                                                    <label for="objectReferenceAttribute"><small>Reference attribute name. <span class="text-muted">The name of the attribute, where external ID is stored.</span></small></label>\
                                                    <input type="text" id="objectReferenceAttribute" name="tei-import-reference-attribute" class="modal-tei-upload-names-ipt form-control form-control-sm" value="' + this.reference_attribute_name + '">\
                                                </div>\
                                                <div class="form-group col">\
                                                    <label for="objectIdAttribute"><small>ID attribute name. <span class="text-muted">The name of the attribute, where local ID is stored.</span></small></label>\
                                                    <input type="text" id="objectIdAttribute" name="tei-import-id-attribute" class="modal-tei-upload-names-ipt form-control form-control-sm" value="' + this.id_attribute_name + '">\
                                                </div>\
                                            </div>';
    // Upload modal
    this.tei_modal_file_upload_html = '<div class="modal fade" id="tei-file-upload-modal" tabindex="-1" aria-hidden="true" role="dialog">\
                                          <div class="modal-dialog modal-lg" role="document">\
                                              <div class="modal-content">\
                                                  <div class="modal-header">\
                                                      <h5 class="modal-title">Upload TEI</h5>\
                                                      <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                                          <span aria-hidden="true">✖</span>\
                                                      </button>\
                                                  </div>\
                                                  <div class="modal-body">\
                                                      <form id="import-teidata-file-form">\
                                                          <div class="custom-file mb-2">\
                                                            <input type="file" class="custom-file-input" id="uploadFileTEI">\
                                                            <label for="uploadFileTEI" class="custom-file-label" id="uploadFileTEILabel">TEI-file to load data from</label>\
                                                          </div>\
                                                          <small class="form-text">Select status. <span class="text-muted">The selected status will be set on all imported/added entities.</span></small>\
                                                          <div id="import-teidata-file-form-statuus-btn-grp" class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons">\
                                                            '+ modal_tei_file_upload_status_html +'\
                                                          </div>\
                                                          ' + modal_tei_file_upload_names_html + '\
                                                      </form>\
                                                      <form id="import-entities-form"></form>\
                                                  </div>\
                                                  <div class="modal-footer">\
                                                      <button type="button" class="btn btn-primary disabled" id="btn-import-from-tei">Import <span class="badge badge-light found-tei-objects">0</span> objects</button>\
                                                      <button type="button" class="btn btn-primary disabled" id="btn-add-from-tei">Add <span class="badge badge-light found-tei-objects">0</span> objects</button>\
                                                  </div>\
                                              </div>\
                                          </div>\
                                      </div>';
    $(this.tei_modal_file_upload_html).appendTo('#modals');

    // register click event listener
    $('#modals').on('click', '#btn-import-from-tei', function (e){
        // Make sure button is not disabled
        if (!$(this).hasClass('disabled')) {
            plugin.importEntities(e);
        }
    });
    $('#modals').on('click', '#btn-add-from-tei', function (e){
        // Make sure button is not disabled
        if (!$(this).hasClass('disabled')) {
            plugin.addEntities(e);
        }
    });
    $('#modals').on('change', '#uploadFileTEI', function (e){
        $('#uploadFileTEILabel').html(this.files[0].name);
        plugin.getEntitiesFromXML();
    });
    $('#modals').on('change', '.modal-tei-upload-names-ipt', function (e){
        plugin.getEntitiesFromXML();
    });
    $('#modals').on('hidden.bs.modal', '#tei-file-upload-modal', function (e){
        $('#tei-file-upload-modal').replaceWith(plugin.tei_modal_file_upload_html);
    });
}


TEIImportPlugin.prototype.getEntitiesFromXML = function () {
    var plugin = this;
    var btn_import = document.querySelector('#btn-import-from-tei');
    var btn_add = document.querySelector('#btn-add-from-tei');
    var count_span = $('.found-tei-objects');
    var file_form = $('#import-teidata-file-form');
    var entities_form = $('#import-entities-form');
    var file    = document.querySelector('#uploadFileTEI').files[0];
    var file_input = $('#uploadFileTEI');
    var accepted_mimetypes = [
        'application/xml',
        'text/xml'
    ]

    var reader  = new FileReader();

    // Clear possible further validation results
    file_form.find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
    file_form.find('.invalid-feedback').remove();
    // Reset importables, buttons etc.
    $(count_span).empty();
    $(btn_import).addClass('disabled');
    $(btn_add).addClass('disabled');
    entities_form.empty();
    plugin.importable_entities = [];
    plugin.names_to_import = [];
    var form_values = file_form.serializeArray();
    plugin.context2elementname[context] = form_values.find(ipt => ipt.name == 'tei-import-element').value;
    plugin.id_attribute_name = form_values.find(ipt => ipt.name == 'tei-import-id-attribute').value;
    plugin.reference_attribute_name = form_values.find(ipt => ipt.name == 'tei-import-reference-attribute').value;
    var context2elementname = plugin.context2elementname;

    reader.addEventListener("load", function () {
        console.log('TEI Import: File ' + file.name + ' loaded.');
        file_input.addClass('is-valid');

        var xmlDoc = undefined;
        try {
            xmlDoc = $.parseXML(reader.result);
        } catch (e) {
            // SyntaxError
            var msg = '[' + e.name + ']' + e.message;
            console.log('TEI Import:' + msg);
            // Bootstrap form validation
            file_input
                .after ('<div class="invalid-feedback">[ERROR] There are parsing errors. View JavaScript console for more information.</div>')
                .addClass('is-invalid');
        }
        if (xmlDoc != undefined) {
            var xml = $(xmlDoc);
            // TODO: check if its TEI
            // Get all elements
            var entities = xml.find(context2elementname[context]);
            // Uniquify by reference and name
            var unique_names = [];
            var found_ids = [];
            var found_refs = [];
            var identified_entities = entities.filter(function (i, e) {
                var name = e.textContent;
                var local_id = e.getAttribute(plugin.id_attribute_name);
                var ref = e.getAttribute(plugin.reference_attribute_name);
                // object is identically if it has the same id/ref or the same name

                if (local_id != null ||  ref != null) {
                    if (found_ids.includes(local_id) || found_refs.includes(ref)) {
                        return false;
                    } else {
                        if (local_id != null) { found_ids.push(local_id) }
                        if (ref != null) { found_refs.push(ref) }
                        unique_names.push(name)
                        return true;
                    }
                } else {
                    if (unique_names.includes(name)) {
                        return false;
                    } else {
                        unique_names.push(name)
                        return true;
                    }
                }
            });
            console.log('TEI Import: ' + identified_entities.length + ' / ' + entities.length + ' ' + context2elementname[context] + ' elements with unique name or identifier contained in file.');

            plugin.importable_entities = identified_entities;
            plugin.names_to_import = unique_names;
            plugin.ids_to_import = found_ids;

            // Update import button
            count_span.html(plugin.importable_entities.length);
            if (plugin.importable_entities.length > 0) {
                // Add importable entities to import form with filter buttons
                var chk_button_filter = '<div class="btn-group form-group" role="group">\
                                            <button class="btn btn-sm btn-secondary" id="import-tei-btn-chk-all" type="button">Select All</button>\
                                            <button class="btn btn-sm btn-secondary" id="import-tei-btn-chk-none" type="button">Deselect All</button>\
                                        </div>';
                $(chk_button_filter).appendTo(entities_form);
                var entities_btn_group = $('<div class="form-group"></div>').appendTo(entities_form)
                plugin.importable_entities.each(function (i, e) {
                    var ref_html = '';
                    if (e.attributes[plugin.id_attribute_name] && e.attributes[plugin.id_attribute_name].value != '') {
                        ref_html += ' <span class="badge badge-warning">' + e.attributes[plugin.id_attribute_name].value + '</span>';
                    }
                    if (e.attributes[plugin.reference_attribute_name] && e.attributes[plugin.reference_attribute_name].value.startsWith(config.v.identifierBaseURL)) {
                        ref_html += ' <span class="badge badge-dark">' + e.attributes[plugin.reference_attribute_name].value.substr(config.v.identifierBaseURL.length) + '</span>';
                    }
                    var chk_html = '<div class="form-check form-check-inline">\
                                      <input class="form-check-input" type="checkbox" value="' + e.textContent + '" id="import-entitiy-' + i + '" checked>\
                                      <label class="form-check-label" for="import-entitiy-' + i + '">\
                                        ' + e.textContent + ref_html +'\
                                      </label>\
                                    </div>';
                    $(chk_html).appendTo(entities_btn_group);
                })

                $(btn_import).removeClass('disabled');
                $(btn_add).removeClass('disabled');
                $('#modals').on('click', '#import-tei-btn-chk-all', function(){
                    $('#import-entities-form input[type="checkbox"]').prop('checked', true).trigger('change');
                });
                $('#modals').on('click', '#import-tei-btn-chk-none', function(){
                    $('#import-entities-form input[type="checkbox"]').prop('checked', false).trigger('change');
                });

            }
            $('#modals').on('change', '#import-entities-form input[type="checkbox"]', function (e) {plugin.updateImportables(e)} );
        }
    }, false);

    if (file) {
        if (accepted_mimetypes.includes(file.type)) {
            reader.readAsText(file);
        } else {
            // Wrong filetype: abort
            var msg = '[ERROR] Wrong file type "' + file.type + '" detected. Please choose a XML/TEI file (' + accepted_mimetypes.join(', ') + ').';
            console.log('TEI Import: ' + msg);
            // Bootstrap form validation
            file_input
                .after('<div class="invalid-feedback">' + msg + '</div>')
                .addClass('is-invalid');
        }
    } else {
        // No file choosen yet: abort
        var msg = 'Please select a file first.';
        console.log('TEI Import: ' + msg);
        // Bootstrap form validation
        file_input
            .after('<div class="invalid-feedback">' + msg + '</div>')
            .addClass('is-invalid');
    }
    return plugin;
}


TEIImportPlugin.prototype.updateImportables = function (event){
    var target_chk = event.target;
    if(target_chk.checked){
        if(!this.names_to_import.includes(target_chk.value)){
            this.names_to_import.push(target_chk.value);
        }
    } else {
        if(this.names_to_import.includes(target_chk.value)){
            var idx_ie = this.names_to_import.indexOf(target_chk.value);
            this.names_to_import.splice(idx_ie, 1);
        }
    }
    // update counter on import button
    $('.found-tei-objects').html(this.names_to_import.length);
    // enable/disable import and add button according to amount of importables
    if (this.names_to_import.length > 0) {
        $('#btn-import-from-tei').removeClass('disabled');
        $('#btn-add-from-tei').removeClass('disabled');
    } else {
        $('#btn-import-from-tei').addClass('disabled');
        $('#btn-add-from-tei').addClass('disabled');
    }
    return this;
}


TEIImportPlugin.prototype.importEntities = function (event) {
    // Delete existing objects
    var ids_to_delete = asArray(data_objects[config.a.JSONContainer]).map(obj => obj.id);
    console.log('TEI Import: Deleting ' + ids_to_delete.length + ' data objects.');
    ids_to_delete.forEach(function (id) {
        deleteObject(event.target, id);
    });
    console.log('TEI Import: Existing data objects deleted.');
    // Add all new entities
    this.addEntities(event);
    return this;
}


TEIImportPlugin.prototype.addEntities = function (event) {
    var plugin = this;
    var file_form = $('#import-teidata-file-form');
    var status = file_form.serializeArray().find(ipt => ipt.name == 'tei-import-status').value;
    console.log('TEI Import: Adding ' + plugin.names_to_import.length + ' objects ...');
    this.importable_entities.each(function (i, e) {
        if (plugin.names_to_import.includes(e.textContent)) {
            // Set params for new local object
            var params = {};
            params[config.v.titleElement] = e.textContent;
            params[config.v.statusElement] = status;
            console.log('TEI Import: Imported data is set to the status: "' + status + '".');
            // Check if we already have IDs set, which we can import.
            // They should be in the 'key'-attribute
            if (e.attributes[plugin.id_attribute_name] !== undefined) {
                // TODO: this structure must be configurable and should not be fixed in the code.
                params.id = e.attributes[plugin.id_attribute_name].value;
            }
            // Check if we already have references set, which we can import.
            // They should be in the 'ref'-attribute
            if (e.attributes[plugin.reference_attribute_name] !== undefined && e.attributes[plugin.reference_attribute_name].value.startsWith(config.v.identifierBaseURL)) {
                // TODO: this structure must be configurable and should not be fixed in the code, because this is
                // specific to the exist-db JSON export.
                params[config.v.identifierElement] = {
                    '#text': e.attributes[plugin.reference_attribute_name].value,
                    'preferred': 'YES'
                };
            }
            addObject(event.target, params)
        }
    });
    console.log('TEI Import: Import finished.');
    countObjectsByStatus();
    // Hide the modal dialog, it will be reseted automatically by event hidden.bs.modal
    $('#tei-file-upload-modal').modal('hide');
    return this;
}

var teiiep = new TEIImportPlugin();
