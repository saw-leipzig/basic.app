function CSVImportExportPlugin() {
    var plugin = this;
    /* ----- Upload CSV ----- */
    // Create and register CSV upload button
    this.btn_csv_up = $('<button class="btn btn-outline-light" id="btn-upload-csv" type="button" data-toggle="modal" data-target="#csv-file-upload-modal">\
                                <span class="fas fa-file-upload"></span> Import from CSV\
                            </button>');
    this.btn_csv_up.on('click', function(e){
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
    })
    basicPluginActions.registerButton(this.btn_csv_up);


    this.modal_csv_file_upload_html = '<div class="modal fade" id="csv-file-upload-modal" tabindex="-1" aria-hidden="true" role="dialog">\
                                      <div class="modal-dialog modal-lg" role="document">\
                                          <div class="modal-content">\
                                              <div class="modal-header">\
                                                  <h5 class="modal-title">Import from CSV</h5>\
                                                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                                      <span aria-hidden="true">✖</span>\
                                                  </button>\
                                              </div>\
                                              <div class="modal-body">\
                                                  <div class="form-group">\
                                                    <label for="uploadFileCSV">CSV-file to load data from</label>\
                                                    <input type="file" class="form-control-file" id="uploadFileCSV">\
                                                  </div>\
                                                  <form id="import-csvdata-form"></form>\
                                                  <button type="button" class="btn btn-primary disabled" id="btn-import-from-csv">Import <span class="badge badge-light found-csv-objects">0</span> objects</button>\
                                                  <button type="button" class="btn btn-primary disabled" id="btn-add-from-csv">Add <span class="badge badge-light found-csv-objects">0</span> objects</button>\
                                              </div>\
                                          </div>\
                                      </div>\
                                  </div>';
    $(this.modal_csv_file_upload_html).appendTo('#modals');


    // register click event listener
    $('#modals').on('click', '#btn-import-from-csv', function (e){
        if (!$(this).hasClass('disabled')) {
            plugin.importEntities(e);
        }
    });
    $('#modals').on('click', '#btn-add-from-csv', function (e){
        if (!$(this).hasClass('disabled')) {
            plugin.addEntities(e);
        }
    });
    $('#modals').on('change', '#uploadFileCSV', function (e){
        plugin.getObjectsFromCSV();
    });
    $('#modals').on('hidden.bs.modal', '#csv-file-upload-modal', function (e){
        $('#csv-file-upload-modal').replaceWith(plugin.modal_csv_file_upload_html);
    });


    this.importable_entities = [];
    this.names_to_import = [];
}


CSVImportExportPlugin.prototype.updateImportables = function(event) {
    var nti = this.names_to_import;
    var target_chk = event.target;
    if(target_chk.checked){
        if(!nti.includes(target_chk.value)){
            nti.push(target_chk.value);
        }
    } else {
        if(nti.includes(target_chk.value)){
            var idx_ie = nti.indexOf(target_chk.value);
            nti.splice(idx_ie, 1);
        }
    }
    // update counter on import and add button
    $('.found-csv-objects').html(nti.length);
    // enable/disable import and add button according to amount of importables
    if (nti.length > 0) {
        $('#btn-import-from-csv').removeClass('disabled');
        $('#btn-add-from-csv').removeClass('disabled');
    } else {
        $('#btn-import-from-csv').addClass('disabled');
        $('#btn-add-from-csv').addClass('disabled');
    }
}


CSVImportExportPlugin.prototype.getObjectsFromCSV = function() {
    var plugin = this;
    var btn_import = document.querySelector('#btn-import-from-csv');
    var btn_add = document.querySelector('#btn-add-from-csv');
    var count_span = $('.found-csv-objects');
    var entities_form = $('#import-csvdata-form');
    var file    = document.querySelector('#uploadFileCSV').files[0];
    var reader  = new FileReader();
    var context2columnnames = {
        'persons': ['sender', 'addressee'],
        'places': ['senderPlace', 'addresseePlace'],
        'organisations': ['sender', 'addressee']
    };

    if (file) {
        Papa.parse(file, {
            header: true,
            complete: function(results) {
                console.log('CSV Import/Export: File ' + file.name + ' loaded.');
                // Reset importables, form, etc.
                importable_entities = [];
                entities_form.empty();
                count_span.empty();
                $(btn_import).addClass('disabled');
                $(btn_add).addClass('disabled');
                // Get entities
                // Uniquify by reference and name
                var unique_names = [];
                var found_ids = [];
                results.data.forEach(function (letter) {
                    context2columnnames[context].forEach(function (column) {
                        var name = letter[column];
                        var id = letter[column + 'ID'];
                        var entity = {};
                        // Name and ID are given. Check for duplicate ID
                        // TODO: if ID already imported and name differs add name as alias
                        if (name && id && !found_ids.includes(id)) {
                            entity[config.v.titleElement] = name;
                            entity[config.v.identifierElement] = id;
                            importable_entities.push(entity);
                            unique_names.push(name);
                            found_ids.push(id);
                        }
                        // Only the name is given. Check for duplicate name.
                        else if (name && !id && !unique_names.includes(name)) {
                            entity[config.v.titleElement] = name;
                            importable_entities.push(entity);
                            unique_names.push(name);
                        }
                    });
                });
                plugin.importable_entities = importable_entities;
                plugin.names_to_import = unique_names;
                // Update form
                count_span.html(importable_entities.length);
                if (importable_entities.length > 0) {
                    // Add importable entities to import form with filter buttons
                    $('#csv-file-upload-modal .form-group button[type="button"]').remove();
                    var chk_button_filter = '<div class="btn-group mt-2" id="check-buttons" role="group">\
                                                <button class="btn btn-sm btn-secondary" id="import-csv-btn-chk-all" type="button">Select All</button>\
                                                <button class="btn btn-sm btn-secondary" id="import-csv-btn-chk-none" type="button">Deselect All</button>\
                                            </div>';
                    $(chk_button_filter).appendTo('#csv-file-upload-modal .form-group');
                    importable_entities.forEach(function (e, i) {
                        var ref_html = '';
                        if (e[config.v.identifierElement] && e[config.v.identifierElement].startsWith(config.v.identifierBaseURL)) {
                            ref_html = ' <span class="badge badge-dark">' + e[config.v.identifierElement].substr(config.v.identifierBaseURL.length) + '</span>';
                        }
                        var chk_html = '<div class="form-check form-check-inline">\
                                          <input class="form-check-input" type="checkbox" value="' + e[config.v.titleElement] + '" id="import-entitiy-' + i + '" checked>\
                                          <label class="form-check-label" for="import-entitiy-' + i + '">\
                                            ' + e[config.v.titleElement] + ref_html +'\
                                          </label>\
                                        </div>';
                        $(chk_html).appendTo(entities_form);
                    })
                    $(btn_import).removeClass('disabled');
                    $(btn_add).removeClass('disabled');
                    $('#modals').on('click', '#import-csv-btn-chk-all', function(){
                        $('#import-csvdata-form input[type="checkbox"]').prop('checked', true).trigger('change');
                    });
                    $('#modals').on('click', '#import-csv-btn-chk-none', function(){
                        $('#import-csvdata-form input[type="checkbox"]').prop('checked', false).trigger('change');
                    });
                }
                $('#modals').on('change', '#import-csvdata-form input[type="checkbox"]', function (e) {plugin.updateImportables(e)} );
            }
        });
    }
}


/*
    importEntities: Delete existing entities and add new ones
 */
CSVImportExportPlugin.prototype.importEntities = function(event) {
    // Delete existing objects
    var ids_to_delete = asArray(data_objects[config.a.JSONContainer]).map(obj => obj.id);
    console.log('CSV Import/Export: Deleting ' + ids_to_delete.length + ' data objects.');
    ids_to_delete.forEach(function (id) {
        deleteObject(event.target, id);
    });
    console.log('CSV Import/Export: Existing data objects deleted.');
    // Add all new entities
    this.addEntities(event);
}


CSVImportExportPlugin.prototype.addEntities = function(event) {
    var nti = this.names_to_import;
    console.log('CSV Import/Export: Adding objects ' + nti.length + ' ...');
    this.importable_entities.forEach(function (e) {
        if (nti.includes(e[config.v.titleElement])) {
            // Set params for new local object
            var params = {};
            params[config.v.titleElement] = e[config.v.titleElement];
            // Check if we already have references set, which we can import.
            if (e[config.v.identifierElement] !== undefined && e[config.v.identifierElement].startsWith(config.v.identifierBaseURL)) {
                // TODO: this structure must be configurable and should not be fixed in the code, because this is
                // specific to the exist-db JSON export.
                params[config.v.identifierElement] = {
                    '#text': e[config.v.identifierElement],
                    'preferred': 'YES'
                };
            }
            addObject(event.target, params)
        }
    });
    console.log('Import finished.');
    countObjectsByStatus();
    // Hide the modal dialog, it will be reseted automatically by event hidden.bs.modal
    $('#csv-file-upload-modal').modal('hide');
}


var csviep = new CSVImportExportPlugin();
