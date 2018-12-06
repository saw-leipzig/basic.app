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


    // Create and register CSV download button
    this.btn_csv_down = $('<button class="btn btn-outline-light" id="btn-download-csv" type="button" data-toggle="modal" data-target="#csv-file-merge-modal">\
                                <span class="fas fa-file-download"></span> Merge with CSV\
                            </button>');
    this.btn_csv_down.on('click', function(e){
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
    })
    basicPluginActions.registerButton(this.btn_csv_down);


    // Upload modal
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
                                                  <div class="custom-file mb-2">\
                                                    <label for="uploadFileCSV" class="custom-file-label" id="uploadFileCSVLabel">CSV-file to load data from</label>\
                                                    <input type="file" class="custom-file-input" id="uploadFileCSV">\
                                                  </div>\
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
                                                  <h5 class="modal-title">Merge with local CSV</h5>\
                                                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                                      <span aria-hidden="true">✖</span>\
                                                  </button>\
                                              </div>\
                                              <div class="modal-body">\
                                                  <div class="custom-file mb-2">\
                                                    <label for="mergeFileCSV" class="custom-file-label" id="mergeFileCSVLabel">Choose CSV-file to update</label>\
                                                    <input type="file" class="custom-file-input" id="mergeFileCSV">\
                                                  </div>\
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
        $('#uploadFileCSVLabel').html(this.files[0].name);
        plugin.getObjectsFromCSV();
    });
    $('#modals').on('change', '#mergeFileCSV', function (e){
        $('#mergeFileCSVLabel').html(this.files[0].name);
        plugin.mergeObjectsWithCSV();
    });
    $('#modals').on('click', '#btn-merge-with-csv', function (e){
        plugin
            .mergeCSV()
            .downloadCSV();
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
    var btn_import = document.querySelector('#btn-import-from-csv');
    var btn_add = document.querySelector('#btn-add-from-csv');
    var count_span = $('.found-csv-objects');
    var entities_form = $('#import-csvdata-form');
    var file = document.querySelector('#uploadFileCSV').files[0];
    var context2columnnames = plugin.context2columnnames;

    if (file) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
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
                                } else {
                                    // Alias(es) aready set.
                                    var old_aliases = asArray(already_imported_entity[config.v.aliasElement]);
                                    // Add if not already done.
                                    if (!old_aliases.includes(name)) {
                                        old_aliases.push(name);
                                        already_imported_entity[config.v.aliasElement] = old_aliases;
                                    }
                                }
                            } else {
                                // If aliases aren't configured, we can't handle this case
                            }
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
                    var chk_button_filter = '<div class="btn-group form-group" id="check-buttons" role="group">\
                                                <button class="btn btn-sm btn-secondary" id="import-csv-btn-chk-all" type="button">Select All</button>\
                                                <button class="btn btn-sm btn-secondary" id="import-csv-btn-chk-none" type="button">Deselect All</button>\
                                            </div>';
                    $(chk_button_filter).appendTo(entities_form);
                    var entities_btn_group = $('<div class="form-group"></div>').appendTo(entities_form);
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
                        $(chk_html).appendTo(entities_btn_group);
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
    var btn_merge = document.querySelector('#btn-merge-with-csv');
    //var count_span = $('.found-csv-objects');
    var entities_form = $('#merge-csvdata-form');
    var file = document.querySelector('#mergeFileCSV').files[0];
    var context2columnnames = plugin.context2columnnames;
    var preselected_statuus = ['safe'];

    if (file) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log('CSV Import/Export: File ' + file.name + ' loaded.');
                plugin.csv_data = results.data;
                plugin.csv_filename = file.name;
                // Build settings form
                $(entities_form).append('<small class="form-text">Select merging method. <span class="text-muted">Hard mode will replace existing identifier in CSV with the preferred identifier of the object. The soft mode only adds identifier to objects, not having an identifier in CSV.</span></small>');
                var method_buttons = $('<div class="btn-group btn-group-toggle mb-2" data-toggle="buttons"></div>')
                    .append('<label class="btn btn-secondary active">\
                                <input type="radio" name="csv-merge-method" value="hard" autocomplete="off" checked> Hard\
                            </label>')
                    .append('<label class="btn btn-secondary">\
                                <input type="radio" name="csv-merge-method" value="soft" autocomplete="off"> Soft\
                            </label>')
                    .appendTo(entities_form);
                $(entities_form).append('<small class="form-text">Select statu(u)s to merge. <span class="text-muted">Only objects with the selected status will be merged.</span></small>');
                var status_buttons = $('<div class="btn-group btn-group-toggle mb-2" data-toggle="buttons"></div>')
                    .appendTo(entities_form);
                config.app.config.status.available.forEach(function (status) {
                    if (preselected_statuus.includes(status)) {
                        status_buttons.append('<label class="btn btn-secondary active">\
                                                <input type="checkbox" name="csv-statuus" value="' + status + '" autocomplete="off" checked>\
                                                ' + status + '\
                                            </label>')
                    } else {
                        status_buttons.append('<label class="btn btn-secondary">\
                                                <input type="checkbox" name="csv-statuus" value="' + status + '" autocomplete="off">\
                                                ' + status + '\
                                            </label>')
                    }
                });
                $(btn_merge).removeClass('disabled');
            }
        });
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
    var statuus = [];
    settings_array.forEach(function (e) {
        if (e.name == 'csv-merge-method') {
            method = e.value;
        } else if (e.name == 'csv-statuus') {
            statuus.push(e.value);
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
    */
    // Iterate over letters
    this.csv_data.forEach(function (letter, index) {
        // Iterate over columns
        context2columnnames[context].forEach(function (col) {
            var name = letter[col];
            var id = letter[col + 'ID'];
            // Don't replace/add anything in 'soft' mode if an ID is already given
            if (name != undefined && name.trim() != '' && !(method == 'soft' && id.trim() != '')) {
                // Get matching object
                var obj = getLocalObjectByTitle(name);
                // Check if object is in correct state
                if (obj !== undefined && statuus.includes(obj[config.v.statusElement])) {
                    // Get preferred ID from local object
                    var preferred_id = getPreferredIdentifierFromObject(obj);
                    // Check if IDs are different
                    if (preferred_id != null && id != preferred_id) {
                        plugin.csv_data[index][col + 'ID'] = preferred_id;
                        console.log('CSV Import/Export: Updated CSV row ' + (index + 2) + ' column ' + col + 'ID with ' + preferred_id);
                    }
                }
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
        header: true
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
