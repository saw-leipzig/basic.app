function CSVImportExportPlugin() {
    var plugin = this;
    /* ----- Upload CSV ----- */
    // Create and register CSV upload button
    this.btn_csv_up = $('<button class="btn btn-outline-light" id="btn-upload-csv" type="button" data-toggle="modal" data-target="#csv-file-upload-modal">\
                                <span class="fas fa-file-csv"></span> Import <span class="text-muted">from CSV</span> <span class="badge badge-light">csv2cmi</span>\
                            </button>');
    this.btn_csv_up.on('click', function(e){
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
    })
    basicPluginActions.registerButton(this.btn_csv_up);


    // Create and register CSV download button
    this.btn_csv_down = $('<button class="btn btn-outline-light" id="btn-download-csv" type="button" data-toggle="modal" data-target="#csv-file-merge-modal">\
                                <span class="fas fa-file-csv"></span> Merge <span class="text-muted">with CSV</span> <span class="badge badge-light">csv2cmi</span>\
                            </button>');
    this.btn_csv_down.on('click', function(e){
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
    })
    basicPluginActions.registerButton(this.btn_csv_down);

    // Build the status buttons
    var modal_csv_file_upload_status_html = '';
    config.status.available.forEach(function (status) {
        if(status == config.status.default){
            modal_csv_file_upload_status_html += '<label class="btn btn-secondary active">\
                    <input type="radio" name="csv-import-status" value="' + status + '" autocomplete="off" checked>' + status + '\
                </label>';
        } else {
            modal_csv_file_upload_status_html += '<label class="btn btn-secondary">\
                    <input type="radio" name="csv-import-status" value="' + status + '" autocomplete="off">' + status + '\
                </label>';
        }
    });
    // Upload modal
    this.modal_csv_file_upload_html = '<div class="modal fade" id="csv-file-upload-modal" tabindex="-1" aria-hidden="true" role="dialog">\
                                      <div class="modal-dialog modal-lg" role="document">\
                                          <div class="modal-content">\
                                              <div class="modal-header">\
                                                  <h5 class="modal-title">Import from CSV (csv2cmi)</h5>\
                                                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                                      <span aria-hidden="true">✖</span>\
                                                  </button>\
                                              </div>\
                                              <div class="modal-body">\
                                                  <p>With the <em>csv2cmi CSV Import</em>-Plugin you can load your local data, stored in a specific comma separated value file (*.csv), into the app. To correctly extract entity data (names and identifier), your document structure has to fulfill the requirements, specified by the tool <em>csv2cmi<em> (more details at <a href="https://github.com/saw-leipzig/csv2cmi" target="_blank">Github repository</a>).</p>\
                                                  <form id="import-csvdata-file-form">\
                                                      <div class="custom-file mb-2">\
                                                        <input type="file" class="custom-file-input" id="uploadFileCSV">\
                                                        <label for="uploadFileCSV" class="custom-file-label" id="uploadFileCSVLabel">CSV-file to load data from</label>\
                                                      </div>\
                                                      <small class="form-text">Select status. <span class="text-muted">The selected status will be set on all imported/added entities.</span></small>\
                                                      <div id="import-teidata-file-form-status-btn-grp" class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons">\
                                                        '+ modal_csv_file_upload_status_html +'\
                                                      </div>\
                                                      <small class="form-text">Select delimiter. <span class="text-muted">This character will be used to seperate multiple values in one cell, e.g. names or identifier. Ensure it\'s not the same character used for cell seperation in your CSV-file.</span></small>\
                                                      <div class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons">\
                                                        <label class="btn btn-secondary active">\
                                                            <input type="radio" name="csv-import-delimiter" value="|" autocomplete="off" checked> |\
                                                        </label>\
                                                        <label class="btn btn-secondary">\
                                                            <input type="radio" name="csv-import-delimiter" value="@" autocomplete="off"> @\
                                                        </label>\
                                                      </div>\
                                                  </form>\
                                                  <form id="import-csvdata-form"></form>\
                                              </div>\
                                              <div class="modal-footer">\
                                                  <button type="button" class="btn btn-primary disabled" id="btn-import-from-csv">Import <span class="badge badge-light found-csv-objects">0</span> objects</button>\
                                                  <button type="button" class="btn btn-primary disabled" id="btn-add-from-csv">Add <span class="badge badge-light found-csv-objects">0</span> objects</button>\
                                              </div>\
                                          </div>\
                                      </div>\
                                  </div>';
    $(this.modal_csv_file_upload_html).appendTo('#modals');


    // Download/merge modal
    this.modal_csv_file_merge_html = '<div class="modal fade" id="csv-file-merge-modal" tabindex="-1" aria-hidden="true" role="dialog">\
                                      <div class="modal-dialog modal-lg" role="document">\
                                          <div class="modal-content">\
                                              <div class="modal-header">\
                                                  <h5 class="modal-title">Merge with local CSV (csv2cmi)</h5>\
                                                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                                      <span aria-hidden="true">✖</span>\
                                                  </button>\
                                              </div>\
                                              <div class="modal-body">\
                                                  <p>With the <em>csv2cmi CSV Merge</em>-Plugin you can merge the app data with your local data, stored in a specific comma separated value file (*.csv). To correctly merge/update entity data (names and identifier), your document structure has to fulfill the requirements, specified by the tool <em>csv2cmi<em> (more details at <a href="https://github.com/saw-leipzig/csv2cmi" target="_blank">Github repository</a>).</p>\
                                                  <form id="merge-csvdata-file-form">\
                                                      <div class="custom-file mb-2">\
                                                        <input type="file" class="custom-file-input" id="mergeFileCSV">\
                                                        <label for="mergeFileCSV" class="custom-file-label" id="mergeFileCSVLabel">Choose CSV-file to update</label>\
                                                      </div>\
                                                  </form>\
                                                  <form id="merge-csvdata-form"></form>\
                                              </div>\
                                              <div class="modal-footer">\
                                                  <button type="button" class="btn btn-primary disabled" id="btn-merge-with-csv">Merge objects and download CSV</button>\
                                              </div>\
                                          </div>\
                                      </div>\
                                  </div>';
    $(this.modal_csv_file_merge_html).appendTo('#modals');


    // register click event listener
    $('#modals').on('click', '#btn-import-from-csv', function (e){
        // Make sure button is not disabled
        if (!$(this).hasClass('disabled')) {
            plugin.importEntities(e);
        }
    });
    $('#modals').on('click', '#btn-add-from-csv', function (e){
        // Make sure button is not disabled
        if (!$(this).hasClass('disabled')) {
            plugin.addEntities(e);
        }
    });
    $('#modals').on('change', '#uploadFileCSV', function (e){
        $('#uploadFileCSVLabel').html(this.files[0].name);
        plugin.getObjectsFromCSV();
    });
    $('#modals').on('change', '#import-csvdata-file-form input[name=csv-import-delimiter]', function (e){
        plugin.getObjectsFromCSV();
    });
    $('#modals').on('change', '#mergeFileCSV', function (e){
        $('#mergeFileCSVLabel').html(this.files[0].name);
        plugin.mergeObjectsWithCSV();
    });
    $('#modals').on('click', '#btn-merge-with-csv', function (e){
        // Make sure button is not disabled
        if (!$(this).hasClass('disabled')) {
            plugin
                .mergeCSV()
                .downloadCSV();
        }
    });
    $('#modals').on('hidden.bs.modal', '#csv-file-upload-modal', function (e){
        $('#csv-file-upload-modal').replaceWith(plugin.modal_csv_file_upload_html);
    });
    $('#modals').on('hidden.bs.modal', '#csv-file-merge-modal', function (e){
        $('#csv-file-merge-modal').replaceWith(plugin.modal_csv_file_merge_html);
    });


    this.importable_entities = [];
    this.names_to_import = [];
    this.context2columnnames = {
        'persons': ['sender', 'addressee'],
        'places': ['senderPlace', 'addresseePlace'],
        'organisations': ['sender', 'addressee']
    };
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
    return this;
}


CSVImportExportPlugin.prototype.getObjectsFromCSV = function() {
    var plugin = this;
    var btn_import = $('#btn-import-from-csv');
    var btn_add = $('#btn-add-from-csv');
    var count_span = $('.found-csv-objects');
    var file_form = $('#import-csvdata-file-form');
    var file_input = $('#uploadFileCSV');
    var entities_form = $('#import-csvdata-form');
    var file = document.querySelector('#uploadFileCSV').files[0];
    var context2columnnames = plugin.context2columnnames;

    // Clear possible further validation results
    file_form.find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
    file_form.find('.invalid-feedback').remove();
    entities_form.empty();
    importable_entities = [];
    count_span.empty();
    btn_import.addClass('disabled');
    btn_add.addClass('disabled');

    if (file) {
        if (file.type == 'text/csv' || file.type == 'application/vnd.ms-excel') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log('CSV Import/Export: File ' + file.name + ' loaded.');
                    if (results.errors.length == 0) {
                        // Ensure we have a valid cmi2csv CSV, that is at least the columns sender, addressee and senderDate exist
                        if (!(results.meta.fields.includes('sender') && results.meta.fields.includes('addressee') && results.meta.fields.includes('senderDate'))) {
                            var msg = '[ERROR] Your CSV file is missing one or all of the required columns: sender, addressee or senderDate.';
                            console.log('CSV Import/Export: ' + msg);
                            // Bootstrap form validation
                            file_input
                                .after('<div class="invalid-feedback">' + msg + '</div>')
                                .addClass('is-invalid');
                            return plugin;
                        }
                        // Bootstrap form validation
                        file_input.addClass('is-valid');
                        // Get entities
                        // Uniquify by reference and name
                        var unique_names = [];
                        var unique_aliases = [];
                        var found_ids = [];
                        // Get delimiter set by user in import form
                        var delimiter = file_form.serializeArray().find(ipt => ipt.name == 'csv-import-delimiter').value;
                        console.log('CSV Import/Export: Using "' + delimiter + '" as delimiter.');
                        // Extract entities from each row
                        results.data.forEach(function (letter) {
                            // Lookup each configured possible column
                            context2columnnames[context].forEach(function (column) {
                                // Ensure there is a column to read from. We presuppose the coexistence of
                                // columns <name> and <name>ID.
                                if (letter[column] != undefined && letter[column + 'ID'] != undefined) {
                                    // There could be multiple entities in one cell, divided by delimiter.
                                    // Therefor split the column content by delimiter to an array and iterate through
                                    // remember the current position to correctly match corresponding name and ID.
                                    var names = letter[column].split(delimiter);
                                    var ids = letter[column + 'ID'].split(delimiter);
                                    names.forEach(function (name, idx) {
                                        var id = ids[idx];
                                        // csv2cmi automatically assigns ID to GND if not given as URL
                                        if (id && id.trim().length > 0 && !id.startsWith('http')) {
                                            id = getUrlFromPlainId(id.trim());
                                        }
                                        var entity = {};
                                        // Ignore characters: [, ], ?
                                        name = name.replace(/[\[\]\?]/g, '');
                                        // normalize space
                                        name = name.replace(/\s{2,}/g, ' ');
                                        // Name and ID are given. Check for duplicate ID
                                        if (name && id && !found_ids.includes(id)) {
                                            entity[config.v.titleElement] = name;
                                            entity[config.v.identifierElement] = id;
                                            importable_entities.push(entity);
                                            unique_names.push(name);
                                            found_ids.push(id);
                                        }
                                        // If ID already imported and name differs add name as alias
                                        else if (name && id && found_ids.includes(id) && !unique_names.includes(name)) {
                                            if (config.v.aliasElement != undefined) {
                                                // Update importable entity with id and add an alias, if not already done
                                                var already_imported_entity = importable_entities.find(function (e) {
                                                    return e[config.v.identifierElement] == id;
                                                });
                                                if (already_imported_entity[config.v.aliasElement] == undefined) {
                                                    // there is no alias yet
                                                    already_imported_entity[config.v.aliasElement] = name;
                                                    unique_aliases.push(name);
                                                } else {
                                                    // Alias(es) already set.
                                                    var old_aliases = asArray(already_imported_entity[config.v.aliasElement]);
                                                    // Add if not already done.
                                                    if (!old_aliases.includes(name)) {
                                                        old_aliases.push(name);
                                                        already_imported_entity[config.v.aliasElement] = old_aliases;
                                                        unique_aliases.push(name);
                                                    }
                                                }
                                            } else {
                                                // If aliases aren't configured, we can't handle this case
                                            }
                                        }
                                        // Only the name is given. Check for duplicate name (names and aliases).
                                        else if (name && !id && !unique_names.includes(name) && !unique_aliases.includes(name)) {
                                            entity[config.v.titleElement] = name;
                                            importable_entities.push(entity);
                                            unique_names.push(name);
                                        }
                                    });
                                }
                            });
                        });
                        plugin.importable_entities = importable_entities;
                        plugin.names_to_import = unique_names;
                        // Update form
                        count_span.html(importable_entities.length);
                        if (importable_entities.length > 0) {
                            // Add importable entities to import form with filter buttons
                            var chk_button_filter = '<div class="btn-group form-group" role="group">\
                                                        <button class="btn btn-sm btn-secondary" id="import-csv-btn-chk-all" type="button">Select All</button>\
                                                        <button class="btn btn-sm btn-secondary" id="import-csv-btn-chk-none" type="button">Deselect All</button>\
                                                    </div>';
                            $(chk_button_filter).appendTo(entities_form);
                            var entities_btn_group = $('<div class="form-group"></div>').appendTo(entities_form);
                            importable_entities.forEach(function (e, i) {
                                var ref_html = '';
                                if (e[config.v.identifierElement] && getPlainIdFromUrl(e[config.v.identifierElement]) !== null) {
                                    ref_html = ' <span class="badge badge-dark">' + getPlainIdFromUrl(e[config.v.identifierElement]) + '</span>';
                                }
                                var chk_html = '<div class="form-check form-check-inline">\
                                                  <input class="form-check-input" type="checkbox" value="' + e[config.v.titleElement] + '" id="import-entitiy-' + i + '" checked>\
                                                  <label class="form-check-label" for="import-entitiy-' + i + '">\
                                                    ' + e[config.v.titleElement] + ref_html +'\
                                                  </label>\
                                                </div>';
                                $(chk_html).appendTo(entities_btn_group);
                            })
                            btn_import.removeClass('disabled');
                            btn_add.removeClass('disabled');
                            $('#modals').on('click', '#import-csv-btn-chk-all', function(){
                                $('#import-csvdata-form input[type="checkbox"]').prop('checked', true).trigger('change');
                            });
                            $('#modals').on('click', '#import-csv-btn-chk-none', function(){
                                $('#import-csvdata-form input[type="checkbox"]').prop('checked', false).trigger('change');
                            });
                        }
                        $('#modals').on('change', '#import-csvdata-form input[type="checkbox"]', function (e) {plugin.updateImportables(e)} );
                    } else {
                        // There were parsing errors.
                        var msg = '[ERROR] There are parsing errors. View JavaScript console for more information.';
                        console.log('CSV Import/Export: ' + msg, results.errors);
                        // Bootstrap form validation
                        file_input
                            .after('<div class="invalid-feedback">' + msg + '</div>')
                            .addClass('is-invalid');
                    }
                }
            });
        } else {
            // Wrong filetype: abort
            var msg = '[ERROR] Wrong file type "' + file.type + '" detected. Please choose a CSV file (text/csv).';
            console.log('CSV Import/Export: ' + msg);
            // Bootstrap form validation
            file_input
                .after('<div class="invalid-feedback">' + msg + '</div>')
                .addClass('is-invalid');
        }
    }
    return plugin;
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
    return this;
}


CSVImportExportPlugin.prototype.addEntities = function(event) {
    var nti = this.names_to_import;
    var file_form = $('#import-csvdata-file-form');
    var status = file_form.serializeArray().find(ipt => ipt.name == 'csv-import-status').value;
    console.log('CSV Import/Export: Adding ' + nti.length + ' objects ...');
    this.importable_entities.forEach(function (e) {
        if (nti.includes(e[config.v.titleElement])) {
            // Set params for new local object
            var params = {};
            params[config.v.titleElement] = e[config.v.titleElement];
            params[config.v.statusElement] = status;
            console.log('CSV Import/Export: Imported data is set to the status: "' + status + '".');
            // Check if we already have references set, which we can import.
            if (e[config.v.identifierElement] !== undefined && getPlainIdFromUrl(e[config.v.identifierElement]) !== null) {
                // TODO: this structure must be configurable and should not be fixed in the code, because this is
                // specific to the exist-db JSON export.
                params[config.v.identifierElement] = {
                    '#text': e[config.v.identifierElement],
                    'preferred': 'YES'
                };
            }
            if (e[config.v.aliasElement] != undefined) {
                params[config.v.aliasElement] = e[config.v.aliasElement];
            }
            addObject(event.target, params)
        }
    });
    console.log('Import finished.');
    countObjectsByStatus();
    // Hide the modal dialog, it will be reseted automatically by event hidden.bs.modal
    $('#csv-file-upload-modal').modal('hide');
    return this;
}


CSVImportExportPlugin.prototype.mergeObjectsWithCSV = function() {
    var plugin = this;
    var btn_merge = $('#btn-merge-with-csv');
    //var count_span = $('.found-csv-objects');
    var file_form = $('#merge-csvdata-file-form');
    var file_input = $('#mergeFileCSV');
    var entities_form = $('#merge-csvdata-form');
    var file = document.querySelector('#mergeFileCSV').files[0];
    var context2columnnames = plugin.context2columnnames;
    var preselected_status = ['safe'];

    // Clear possible further validation results
    file_form.find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
    file_form.find('.invalid-feedback').remove();
    entities_form.empty();
    btn_merge.addClass('disabled');

    if (file) {
        if (file.type == 'text/csv' || file.type == 'application/vnd.ms-excel') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log('CSV Import/Export: File ' + file.name + ' loaded.');
                    if (results.errors.length == 0) {
                        // Ensure we have a valid cmi2csv CSV, that is at least the columns sender, addressee and senderDate exist
                        if (!(results.meta.fields.includes('sender') && results.meta.fields.includes('addressee') && results.meta.fields.includes('senderDate'))) {
                            var msg = '[ERROR] Your CSV file is missing one or all of the required columns: sender, addressee or senderDate.';
                            console.log('CSV Import/Export: ' + msg);
                            // Bootstrap form validation
                            file_input
                                .after('<div class="invalid-feedback">' + msg + '</div>')
                                .addClass('is-invalid');
                            return plugin;
                        }
                        // Bootstrap form validation
                        file_input.addClass('is-valid');
                        // Store data needed for later merging
                        plugin.csv_data = results.data;
                        plugin.csv_filename = file.name;
                        // Use detected delimiter from original file
                        plugin.csv_delimiter = results.meta.delimiter;
                        // Build settings form
                        // METHOD
                        $(entities_form).append('<small class="form-text">Select merging method. <span class="text-muted">Hard mode will replace existing identifier in CSV with the preferred identifier of the object. The soft mode only adds identifier to objects, not having an identifier in CSV.</span></small>');
                        var method_buttons = $('<div class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons"></div>')
                            .append('<label class="btn btn-secondary active">\
                                        <input type="radio" name="csv-merge-method" value="hard" autocomplete="off" checked> Hard\
                                    </label>')
                            .append('<label class="btn btn-secondary">\
                                        <input type="radio" name="csv-merge-method" value="soft" autocomplete="off"> Soft\
                                    </label>')
                            .appendTo(entities_form);
                        // STATUS
                        $(entities_form).append('<small class="form-text">Select statu(u)s to merge. <span class="text-muted">Only objects with the selected status will be merged.</span></small>');
                        var status_buttons = $('<div class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons"></div>')
                            .appendTo(entities_form);
                        config.status.available.forEach(function (status) {
                            if (preselected_status.includes(status)) {
                                status_buttons.append('<label class="btn btn-secondary active">\
                                                        <input type="checkbox" name="csv-status" value="' + status + '" autocomplete="off" checked>\
                                                        ' + status + '\
                                                    </label>')
                            } else {
                                status_buttons.append('<label class="btn btn-secondary">\
                                                        <input type="checkbox" name="csv-status" value="' + status + '" autocomplete="off">\
                                                        ' + status + '\
                                                    </label>')
                            }
                        });
                        // DELIMITER
                        $(entities_form).append('<small class="form-text">Select delimiter. <span class="text-muted">This character will be used to seperate multiple values in one cell, e.g. names or identifier. Ensure it\'s not the same character used for cell seperation in your CSV-file.</span></small>');
                        var method_buttons = $('<div class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons"></div>')
                            .append('<label class="btn btn-secondary active">\
                                        <input type="radio" name="csv-merge-delimiter" value="|" autocomplete="off" checked> |\
                                    </label>')
                            .append('<label class="btn btn-secondary">\
                                        <input type="radio" name="csv-merge-delimiter" value="@" autocomplete="off"> @\
                                    </label>')
                            .appendTo(entities_form);
                        // MODE
                        $(entities_form).append('<small class="form-text">Select mode of identifier format. <span class="text-muted">Plain mode will save the IDs and URI-mode will save URIs.</span></small>');
                        var method_buttons = $('<div class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons"></div>')
                            .append('<label class="btn btn-secondary active">\
                                        <input type="radio" name="csv-merge-mode" value="plain" autocomplete="off" checked> Plain\
                                    </label>')
                            .append('<label class="btn btn-secondary">\
                                        <input type="radio" name="csv-merge-mode" value="uri" autocomplete="off"> URI\
                                    </label>')
                            .appendTo(entities_form);
                        btn_merge.removeClass('disabled');
                    } else {
                        // There were parsing errors.
                        var msg = '[ERROR] There are parsing errors. View JavaScript console for more information.';
                        console.log('CSV Import/Export: ' + msg, results.errors);
                        // Bootstrap form validation
                        file_input
                            .after('<div class="invalid-feedback">' + msg + '</div>')
                            .addClass('is-invalid');
                    }
                }
            });
        } else {
            // Wrong filetype: abort
            var msg = '[ERROR] Wrong file type "' + file.type + '" detected. Please choose a CSV file (text/csv).';
            console.log('CSV Import/Export: ' + msg);
            // Bootstrap form validation
            file_input
                .after('<div class="invalid-feedback">' + msg + '</div>')
                .addClass('is-invalid');
        }
    }
    return plugin;
}


CSVImportExportPlugin.prototype.mergeCSV = function() {
    var plugin = this;
    // Get settings from form
    var entities_form = $('#merge-csvdata-form');
    var settings_array = entities_form.serializeArray();
    var context2columnnames = plugin.context2columnnames;
    var method = '';
    var status = [];
    var delimiter = '';
    var mode = '';
    settings_array.forEach(function (e) {
        if (e.name == 'csv-merge-method') {
            method = e.value;
        } else if (e.name == 'csv-status') {
            status.push(e.value);
        } else if (e.name == 'csv-merge-delimiter') {
            delimiter = e.value;
        } else if (e.name == 'csv-merge-mode') {
            mode = e.value;
        }
    });

    console.log('CSV Import/Export: Merging data ' + method + 'ly ...');
    /* Update csv_data
    Option 1: method
        hard: set/replace the corresponding identifier value in CSV
        soft: add identifier, if there is no one given for the entity, but don't replace one,
              if it's still there
    Option 2: status - Only objects with these status will be used to merge. This allows, e.g.
              only merging objects with a safe status.
    Option 3: delimiter - character used to seperate multiple values in one cell
    Option 4: mode
       plain: store plain IDs
         uri: store URIs
    */
    // Iterate over letters
    this.csv_data.forEach(function (letter, index) {
        // Iterate over columns
        context2columnnames[context].forEach(function (col) {
            // Ensure there is a column to read from.
            if (letter[col] != undefined) {
                // Also ensure there is a corresponding ID-column.
                if (letter[col + 'ID'] == undefined) {
                    // If there is no corresponding ID-column in the original CSV, we add them now
                    letter[col + 'ID'] = ''
                }
                // There could be multiple entities in one cell, divided by delimiter.
                // Therefor split the column content by delimiter to an array and iterate through
                // remember the current position to correctly match corresponding name and ID.
                var names = letter[col].split(delimiter);
                var ids = letter[col + 'ID'].split(delimiter);
                names.forEach(function (name, idx) {
                    var id = ids[idx];
                    // Ignore characters: [, ], ?
                    name = name.replace(/[\[\]\?]/g, '');
                    // normalize space
                    name = name.replace(/\s{2,}/g, ' ');
                    // Don't replace/add anything in 'soft' mode if an ID is already given
                    if (name != undefined && name.trim() != '' && !(method == 'soft' && id && id.trim() != '')) {
                        // Get matching object
                        // Default case is matching with preferred name (titleElement)
                        var obj = getLocalObjectByTitle(name);
                        // If there is no match on titleElement, try to find one with matching alias, if alias is configured
                        if (obj == undefined && config.v.aliasElement != undefined) {
                            obj = getLocalObjectByAlias(name);
                        }
                        // If there is no match on titleElement and aliasElement, try to find one with matching pseudonym, if pseudonym is configured
                        if (obj == undefined && config.v.pseudonymElement != undefined) {
                            obj = getLocalObjectByPseudonym(name);
                        }
                        // Check if object is in correct state
                        if (obj !== undefined && status.includes(obj[config.v.statusElement])) {
                            // Get preferred ID from local object
                            var preferred_id = getPreferredIdentifierFromObject(obj);
                            // if plain mode is choosen, remove base URL from preferred ID
                            if (mode == 'plain' && preferred_id) { preferred_id = getPlainIdFromUrl(preferred_id) }
                            // Check if IDs are different
                            if (preferred_id != null && id != preferred_id) {
                                ids[idx] = preferred_id;
                                var preferred_ids = ids.join(delimiter);
                                plugin.csv_data[index][col + 'ID'] = preferred_ids;
                                console.log('CSV Import/Export: Updated CSV row ' + (index + 2) + ' column ' + col + 'ID with ' + preferred_ids);
                            }
                        }
                    }
                });
            }
        });
    });
    console.log('CSV Import/Export: Merge finished.');
    // Hide the modal dialog, it will be reseted automatically by event hidden.bs.modal
    $('#csv-file-merge-modal').modal('hide');
    return plugin;
}


CSVImportExportPlugin.prototype.downloadCSV = function() {
    var plugin = this;
    var dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(Papa.unparse(plugin.csv_data, {
        quotes: true,
        header: true,
        delimiter: plugin.csv_delimiter
    }));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", plugin.csv_filename);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    return plugin;
}


var csviep = new CSVImportExportPlugin();
