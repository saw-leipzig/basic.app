function CSVGenericImportExportPlugin () {
    this.prefix = this.constructor.name.toLowerCase();
    this.csvdata = {};
    this.mapping = {};
    this.importable_entities = [];
    this.importable_indexes = [];
    this.modal_html = '';
    this.mode = '';
    this.filename = '';
    this.preselected_status = [];
    this.allowed_mimetypes = []
}


CSVGenericImportExportPlugin.prototype.log = function (msg, type, data) {
    var type_str = '';
    if (type != undefined) {
        type_str = ' (' + type + ')';
    }
    var entry = this.constructor.name + type_str + ': ' + msg;
    if (data != undefined) {
        console.log(entry, data);
    } else {
        console.log(entry);
    }
    return this;
};


CSVGenericImportExportPlugin.prototype.init = function () {
    var plugin = this;
    // Set initial values
    plugin.allowed_mimetypes = [
        'text/csv'
    ];

    // Render buttons, forms, etc.
    plugin.render();

    // Register event listener
    $('#modals').on('change', '#' + plugin.prefix + '-file', function (){
        $('#' + plugin.prefix + '-file-label').html(this.files[0].name);
        plugin.filename = this.files[0].name;
        plugin.loadCSV();
    });
    $('#modals').on('change', '#' + plugin.prefix + '-modal select', function (){
        var sel = $(this);
        var prop = sel.attr('id').substring(('#' + plugin.prefix).length);
        var val = sel.val();
        // set mapping and show parsed example value
        if (val != '---') {
            plugin.mapping[prop] = val;
            sel.parent().next().html('<small class="text-success">' + plugin.csvdata.data[0][val] + '</small>');
        } else {
            delete plugin.mapping[prop];
            sel.parent().next().empty();
        }
    });
    $('#modals').on('change', '#' + plugin.prefix + '-id, #' + plugin.prefix + '-' + config.v.titleElement + ', #' + plugin.prefix + '-' + config.v.identifierElement + '', function (){
        // If all required attributes are set, let's display the importable entities
        var map_id = $('#' + plugin.prefix + '-id').val();
        var map_title = $('#' + plugin.prefix + '-' + config.v.titleElement).val();
        //var map_reference = $('#' + plugin.prefix + '-' + config.v.identifierElement).val();
        var required_values = [map_id];
        if (plugin.mode == 'import') {
            required_values.push(map_title);
        }
        if (!required_values.includes('---')) {
            // Settings form has to be rendered first, because updateMergables refers to those settings
            plugin.renderSettingsForm();
            switch (plugin.mode) {
                case 'import':
                    plugin.renderEntitiesForm();
                    break;
                case 'merge':
                    plugin.updateMergables();
                    break;
            }
        } else {
            $('#' + plugin.prefix + '-form').empty();
            $('#' + plugin.prefix + '-settings-form').empty();
            plugin.importable_entities = [];
            plugin.importable_indexes = [];
        }
        // Activate buttons
        plugin.updateImportables();
    });
    $('#modals').on('change', '#' + plugin.prefix + '-settings-form-status input', function (e){
        // Make sure button is not disabled
        if (!$(this).hasClass('disabled') && plugin.mode == 'merge') {
            plugin.updateMergables();
        }
    });
    $('#modals').on('click', '#' + plugin.prefix + '-btn-import', function (e){
        // Make sure button is not disabled
        if (!$(this).hasClass('disabled')) {
            plugin.importEntities(e);
        }
    });
    $('#modals').on('click', '#' + plugin.prefix + '-btn-add', function (e){
        // Make sure button is not disabled
        if (!$(this).hasClass('disabled')) {
            plugin.addEntities(e);
        }
    });
    $('#modals').on('click', '#' + plugin.prefix + '-btn-merge', function (){
        // Make sure button is not disabled
        if (!$(this).hasClass('disabled')) {
            plugin.mergeEntities().downloadCSV();
        }
    });
    $('#modals').on('hidden.bs.modal', '#' + plugin.prefix + '-modal', function (e){
        // Remove modal
        $(this).remove();
    });

    plugin.log('Initialized.');
    return plugin;
}


CSVGenericImportExportPlugin.prototype.render = function () {
    var plugin = this;
    // Create and register CSV import button
    var btn_csv = $('<button class="btn btn-outline-light" id="btn-upload-' + this.prefix + '" type="button">\
                        <span class="fas fa-file-csv"></span> Import <span class="text-muted">from CSV</span> <span class="badge badge-light">generic</span>\
                    </button>');
    btn_csv.on('click', function(e){
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
        // Render import modal and open
        var title = '<span class="fas fa-file-csv"></span> Generic CSV Import';
        var doc = 'With the <em>Generic CSV Import</em>-Plugin you can load your local data, stored in a comma separated value file (*.csv), into the app. Each row of your table-like data structure contains one dataset (all data according to one entity). The first row has to contain your column labels. You\'ll need them to map your data model to the configured app data model.';
        plugin.mode = 'import';
        plugin.preselected_status = ['unchecked'];
        plugin
            .renderModal(title, doc)
            .renderModalFooter();
    })
    basicPluginActions.registerButton(btn_csv);

    // Create and register CSV merge button
    var btn_csv_merge = $('<button class="btn btn-outline-light" id="btn-merge-' + this.prefix + '" type="button">\
                        <span class="fas fa-file-csv"></span> Merge <span class="text-muted">with CSV</span> <span class="badge badge-light">generic</span>\
                    </button>');
    btn_csv_merge.on('click', function(e){
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
        // Render merge modal and open
        var title = '<span class="fas fa-file-csv"></span> Generic CSV Merge';
        var doc = 'With the <em>Generic CSV Merge</em>-Plugin you can merge the app data with your local data (based on IDs), stored in a comma separated value file (*.csv) and download the result as (new) CSV-file. Each row of your table-like data structure contains one dataset (all data according to one entity). The first row has to contain your column labels. You\'ll need them to map your data model to the configured app data model.';
        plugin.mode = 'merge';
        plugin.preselected_status = ['safe'];
        plugin
            .renderModal(title, doc)
            .renderModalFooter();
    })
    basicPluginActions.registerButton(btn_csv_merge);

    return this;
}


CSVGenericImportExportPlugin.prototype.renderModal = function (title, documentation) {
    this.modal_html = '<div class="modal fade" id="' + this.prefix + '-modal" tabindex="-1" aria-hidden="true" role="dialog">\
                                      <div class="modal-dialog modal-lg" role="document">\
                                          <div class="modal-content">\
                                              <div class="modal-header">\
                                                  <h5 class="modal-title">' + title + '</h5>\
                                                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                                      <span aria-hidden="true">✖</span>\
                                                  </button>\
                                              </div>\
                                              <div class="modal-body">\
                                                  <p>' + documentation + '</p>\
                                                  <form id="' + this.prefix + '-file-form">\
                                                      <div class="custom-file mb-2">\
                                                        <input type="file" class="custom-file-input" id="' + this.prefix + '-file">\
                                                        <label for="' + this.prefix + '-file" class="custom-file-label" id="' + this.prefix + '-file-label">CSV-file to load data from</label>\
                                                      </div>\
                                                  </form>\
                                                  <form id="' + this.prefix + '-mapping-form"></form>\
                                                  <form id="' + this.prefix + '-form"></form>\
                                                  <form id="' + this.prefix + '-settings-form"></form>\
                                              </div>\
                                              <div class="modal-footer">\
                                              </div>\
                                          </div>\
                                      </div>\
                                  </div>';
    $(this.modal_html)
        .appendTo('#modals')
        .modal('show');

    return this;
}


CSVGenericImportExportPlugin.prototype.renderModalFooter = function () {
    switch (this.mode) {
        case 'import':
            var buttons = '<button type="button" class="btn btn-primary disabled" id="' + this.prefix + '-btn-import">Import <span class="badge badge-light found-csv-objects">0</span> objects</button>\
                           <button type="button" class="btn btn-primary disabled" id="' + this.prefix + '-btn-add">Add <span class="badge badge-light found-csv-objects">0</span> objects</button>\
                           ';
            $('#' + this.prefix + '-modal .modal-footer').append(buttons);
            break;
        case 'merge':
            var buttons = '<button type="button" class="btn btn-primary disabled" id="' + this.prefix + '-btn-merge">Merge <span class="badge badge-light found-csv-objects">0</span> objects</button>\
                           ';
            $('#' + this.prefix + '-modal .modal-footer').append(buttons);
            break;
    }
    return this;
}


CSVGenericImportExportPlugin.prototype.loadCSV = function () {
    var plugin = this;
    var btn_import = $('#' + plugin.prefix + '-btn-import');
    var btn_add = $('#' + plugin.prefix + '-btn-add');
    var btn_merge = $('#' + plugin.prefix + '-btn-merge');
    var count_span = $('#' + plugin.prefix + '-modal .found-csv-objects');
    var file_form = $('#' + this.prefix + '-file-form');
    var file_input = $('#' + this.prefix + '-file');
    var mapping_form = $('#' + this.prefix + '-mapping-form');
    var entities_form = $('#' + this.prefix + '-form');
    var settings_form = $('#' + this.prefix + '-settings-form');
    var file = document.querySelector('#' + this.prefix + '-file').files[0];

    // Clear possible further validation results
    file_form.find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
    file_form.find('.invalid-feedback, .valid-feedback').remove();
    mapping_form.empty();
    entities_form.empty();
    settings_form.empty();
    plugin.mapping = {};
    plugin.importable_entities = [];
    plugin.importable_indexes = [];
    count_span.html('0');
    btn_import.addClass('disabled');
    btn_add.addClass('disabled');
    btn_merge.addClass('disabled');

    if (file) {
        if (plugin.allowed_mimetypes.includes(file.type)) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    plugin.log('File ' + file.name + ' loaded.');
                    if (results.errors.length == 0) {
                        if (results.data.length > 0) {
                            // Save parsed data
                            plugin.csvdata = results;
                            // At least one data row was detected
                            var msg = 'Parsed ' + results.data.length + ' data row(s) from CSV file.';
                            plugin.log(msg);
                            // Bootstrap form validation
                            file_input
                                .after('<div class="valid-feedback">' + msg + '</div>')
                                .addClass('is-valid');
                            // Build mapping interface
                            plugin.renderMappingForm();
                        } else {
                            // There is no data to process. User should choose another file.
                            var msg = 'The file contains no processable data. Please choose a file, which at least has one data row.';
                            plugin.log(msg, 'INFO');
                            // Bootstrap form validation
                            file_input
                                .after('<div class="invalid-feedback">' + msg + '</div>')
                                .addClass('is-invalid');
                        }
                    } else {
                        // There were parsing errors.
                        var msg = 'There are parsing errors. View JavaScript console for more information.';
                        plugin.log(msg, 'ERROR', results.errors);
                        // Bootstrap form validation
                        file_input
                            .after('<div class="invalid-feedback">' + msg + '</div>')
                            .addClass('is-invalid');
                    }
                }
            });
        } else {
            // Wrong filetype: abort
            var msg = 'Wrong file type "' + file.type + '" detected. Please choose a CSV file (text/csv).';
            plugin.log(msg, 'ERROR');
            // Bootstrap form validation
            file_input
                .after('<div class="invalid-feedback">' + msg + '</div>')
                .addClass('is-invalid');
        }
    }
    return plugin;
}


CSVGenericImportExportPlugin.prototype.renderMappingForm = function () {
    var plugin = this;
    var mapping_form = $('#' + plugin.prefix + '-mapping-form');
    var map_form_description_html ='<small class="form-text">Configure value mapping: <span class="text-muted">Please choose your local corresponding label for each attribute you want to import/export (at least the required ones). To give you a little help, the mapping form will show you an example value next to the choosen label, which is extracted from your first data row.</span></small>';
    var required_attributes = ['id'];
    if (plugin.mode == 'import') {
        required_attributes.push(config.v.titleElement);
    }

    mapping_form.append(map_form_description_html);
    required_attributes.forEach(function (a) {
        mapping_form.append('<div class="form-group row">\
                                <label for="' + plugin.prefix + '-' + a + '" class="col-sm-4 col-form-label text-right"><small>' + a + '*</small></label>\
                                <div class="col-sm-4">\
                                    <select id="' + plugin.prefix + '-' + a + '" class="form-control form-control-sm">\
                                    </select>\
                                </div>\
                                <div class="col-sm-4 mapping-example-value text-truncate"></div>\
                            </div>');
    });
    mapping_form.append('<hr/>');
    // As identifier elements are not part of the configurable modal and no required attributes
    // we need to add it manually here
    var id_conf = [{
        displayName: 'Identifier', // Maybe this could be configurable?
        localJSONPath: config.v.identifierElement
    }];
    // Create further mappable selects from config
    var attributes = id_conf.concat(config.m);
    attributes.forEach(function (e) {
        if (e.localJSONPath && !required_attributes.includes(e.localJSONPath)) {
            var select_html = '<div class="form-group row">\
                                    <label for="' + plugin.prefix + '-' + e.localJSONPath + '" class="col-sm-4 col-form-label text-right"><small>' + e.displayName + '</small></label>\
                                    <div class="col-sm-4">\
                                        <select id="' + plugin.prefix + '-' + e.localJSONPath + '" class="form-control form-control-sm">\
                                        </select>\
                                    </div>\
                                    <div class="col-sm-4 mapping-example-value text-truncate"></div>\
                                </div>\
                                ';
            mapping_form.append(select_html);
        }
    });
    // Add select options
    var select_elements = mapping_form.find('select')
    select_elements.append('<option selected>---</option>')
    this.csvdata.meta.fields.forEach(function (field) {
        select_elements.append('<option>' + field + '</option>')
    });
    return this;
}


CSVGenericImportExportPlugin.prototype.renderEntitiesForm = function () {
    var plugin = this;
    var entities_form = $('#' + this.prefix + '-form');
    var btn_import = $('#' + plugin.prefix + '-btn-import');
    var btn_add = $('#' + plugin.prefix + '-btn-add');

    entities_form.empty();
    plugin.importable_indexes = [];
    // Add importable entities to import form with filter buttons
    var chk_button_filter = '<div class="btn-group form-group" role="group">\
                                <button class="btn btn-sm btn-secondary" id="' + plugin.prefix + '-import-csv-btn-chk-all" type="button">Select All</button>\
                                <button class="btn btn-sm btn-secondary" id="' + plugin.prefix + '-import-csv-btn-chk-none" type="button">Deselect All</button>\
                            </div>';
    $(chk_button_filter).appendTo(entities_form);
    var entities_btn_group = $('<div class="form-group"></div>').appendTo(entities_form);
    // Import rows with no empty id and title column only. Filter data accordingly
    plugin.importable_entities = plugin.csvdata.data.filter(function (r) {
        return r[plugin.mapping['id']].trim() != '' && r[plugin.mapping[config.v.titleElement]].trim() != ''
    });
    plugin.importable_entities.forEach(function (e, i) {
        // Add importable index to importable_indexes
        plugin.importable_indexes.push(e[plugin.mapping['id']]);
        // Build entity selection
        var ref_html = '';
        if (e[plugin.mapping['id']].trim()) {
            ref_html += ' <span class="badge badge-warning">' + e[plugin.mapping['id']].trim() + '</span>';
        }
        if (e[plugin.mapping[config.v.identifierElement]]) {
            // It should be possible to import plain IDs. So if there is an ID, not starting with the configured
            // base URL, add them to the importable value
            if (!e[plugin.mapping[config.v.identifierElement]].startsWith(config.v.identifierBaseURL)) {
                e[plugin.mapping[config.v.identifierElement]] = config.v.identifierBaseURL + e[plugin.mapping[config.v.identifierElement]].trim()
            }
            ref_html += ' <span class="badge badge-dark">' + config.v.identifierAbbreviation + ': ' + e[plugin.mapping[config.v.identifierElement]].substr(config.v.identifierBaseURL.length) + '</span>';
        }
        var chk_html = '<div class="form-check form-check-inline">\
                          <input class="form-check-input" type="checkbox" value="' + e[plugin.mapping['id']] + '" id="' + plugin.prefix + '-import-entitiy-' + i + '" checked>\
                          <label class="form-check-label" for="' + plugin.prefix + '-import-entitiy-' + i + '">\
                            ' + e[plugin.mapping[config.v.titleElement]] + ref_html +'\
                          </label>\
                        </div>';
        $(chk_html).appendTo(entities_btn_group);
    })
    // Register event listener
    $('#modals').on('click', '#' + plugin.prefix + '-import-csv-btn-chk-all', function(){
        $('#' + plugin.prefix + '-form input[type="checkbox"]').prop('checked', true).trigger('change');
    });
    $('#modals').on('click', '#' + plugin.prefix + '-import-csv-btn-chk-none', function(){
        $('#' + plugin.prefix + '-form input[type="checkbox"]').prop('checked', false).trigger('change');
    });
    $('#modals').on('change', '#' + plugin.prefix + '-form input[type="checkbox"]', function (e) {plugin.updateImportables(e)} );
    return plugin;
}


CSVGenericImportExportPlugin.prototype.renderSettingsForm = function (event) {
    var plugin = this;
    var settings_form = $('#' + this.prefix + '-settings-form');

    settings_form.empty();

    // METHOD
    var method_description = $('<small class="form-text">Select merging method. <span class="text-muted">Hard mode will replace existing values in CSV with the values of the object. The soft mode only adds values where there is no one and leave existing values in CSV unchanged.</span></small>');
    var method_buttons = $('<div class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons"></div>')
        .append('<label class="btn btn-secondary active">\
                    <input type="radio" name="csv-merge-method" value="hard" autocomplete="off" checked> Hard\
                </label>')
        .append('<label class="btn btn-secondary">\
                    <input type="radio" name="csv-merge-method" value="soft" autocomplete="off"> Soft\
                </label>')
    // STATUS
    var status_description_import = $('<small class="form-text">Select status. <span class="text-muted">The selected status will be set on all imported/added entities.</span></small>');
    var status_description_merge = $('<small class="form-text">Select status to merge. <span class="text-muted">Only objects with the selected status will be merged. Multi-selection is possible.</span></small>');
    var status_buttons = $('<div id="' + plugin.prefix + '-settings-form-status" class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons"></div>')
    var status_buttons_type = 'radio';
    if (plugin.mode == 'merge') {
        status_buttons_type = 'checkbox';
    }
    config.app.config.status.available.forEach(function (status) {
        if (plugin.preselected_status.includes(status)) {
            status_buttons.append('<label class="btn btn-secondary active">\
                                    <input type="' + status_buttons_type + '" name="csv-status" value="' + status + '" autocomplete="off" checked>\
                                    ' + status + '\
                                </label>')
        } else {
            status_buttons.append('<label class="btn btn-secondary">\
                                    <input type="' + status_buttons_type + '" name="csv-status" value="' + status + '" autocomplete="off">\
                                    ' + status + '\
                                </label>')
        }
    });
    // DELIMITER
    var delimiter_description = ('<small class="form-text">Select delimiter. <span class="text-muted">This character will be used to seperate multiple values in one cell, e.g. variant names. Ensure it\'s not the same character used for cell seperation in your CSV-file.</span></small>');
    var delimiter_buttons = $('<div class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons"></div>')
        .append('<label class="btn btn-secondary active">\
                    <input type="radio" name="csv-delimiter" value="|" autocomplete="off" checked> |\
                </label>')
        .append('<label class="btn btn-secondary">\
                    <input type="radio" name="csv-delimiter" value="@" autocomplete="off"> @\
                </label>')
    // MODE
    var mode_description = $('<small class="form-text">Select mode of identifier format. <span class="text-muted">Plain mode will save the IDs and URI-mode will save URIs.</span></small>');
    var mode_buttons = $('<div class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons"></div>')
        .append('<label class="btn btn-secondary active">\
                    <input type="radio" name="csv-merge-mode" value="plain" autocomplete="off" checked> Plain\
                </label>')
        .append('<label class="btn btn-secondary">\
                    <input type="radio" name="csv-merge-mode" value="uri" autocomplete="off"> URI\
                </label>')

    // Render settings according to the current mode
    switch (plugin.mode) {
        case 'import':
            settings_form
                .append(status_description_import)
                .append(status_buttons)
                .append(delimiter_description)
                .append(delimiter_buttons);
            break;
        case 'merge':
            settings_form
                .append(method_description)
                .append(method_buttons)
                .append(status_description_merge)
                .append(status_buttons)
                .append(delimiter_description)
                .append(delimiter_buttons)
                .append(mode_description)
                .append(mode_buttons);
            break;
    }

    return plugin;
}


CSVGenericImportExportPlugin.prototype.updateImportables = function (event) {
    var indexes = this.importable_indexes;
    if (event != undefined) {
        var target_chk = event.target;
        if(target_chk.checked){
            if(!indexes.includes(target_chk.value)){
                indexes.push(target_chk.value);
            }
        } else {
            if(indexes.includes(target_chk.value)){
                var idx_ie = indexes.indexOf(target_chk.value);
                indexes.splice(idx_ie, 1);
            }
        }
    }
    // update counter on import and add button
    $('#' + this.prefix + '-modal .found-csv-objects').html(indexes.length);
    // enable/disable import and add button according to amount of importables
    if (indexes.length > 0) {
        $('#' + this.prefix + '-btn-import').removeClass('disabled');
        $('#' + this.prefix + '-btn-add').removeClass('disabled');
        $('#' + this.prefix + '-btn-merge').removeClass('disabled');
    } else {
        $('#' + this.prefix + '-btn-import').addClass('disabled');
        $('#' + this.prefix + '-btn-add').addClass('disabled');
        $('#' + this.prefix + '-btn-merge').addClass('disabled');
    }
    return this;
}


CSVGenericImportExportPlugin.prototype.updateMergables = function () {
    // Get selected status and count according objects
    var settings_form = $('#' + this.prefix + '-settings-form');
    var settings_array = settings_form.serializeArray();
    var status = [];
    settings_array.forEach(function (e) {
        if (e.name == 'csv-status') {
            status.push(e.value);
        }
    });
    this.importable_indexes = asArray(data_objects[config.a.JSONContainer])
        .filter(function (e) {
            return status.includes(e[config.v.statusElement])
        })
        .map(function (e, i) {
            return i;
        });
    this.updateImportables();
    return this;
}


/*
    importEntities: Delete existing entities and add new ones
 */
CSVGenericImportExportPlugin.prototype.importEntities = function(event) {
    // Delete existing objects
    var ids_to_delete = asArray(data_objects[config.a.JSONContainer]).map(obj => obj.id);
    this.log('Deleting ' + ids_to_delete.length + ' data objects.');
    ids_to_delete.forEach(function (id) {
        deleteObject(event.target, id);
    });
    this.log('Existing data objects deleted.');
    // Add all new entities
    this.addEntities(event);
    return this;
}


CSVGenericImportExportPlugin.prototype.addEntities = function(event) {
    var plugin = this;
    var ii = plugin.importable_indexes;
    var settings_form = $('#' + plugin.prefix + '-settings-form');
    var status = settings_form.serializeArray().find(ipt => ipt.name == 'csv-status').value;
    var delimiter = settings_form.serializeArray().find(ipt => ipt.name == 'csv-delimiter').value;
    plugin.log('Imported data is set to the status: "' + status + '".');
    plugin.log('Adding ' + ii.length + ' objects ...');
    plugin.importable_entities.forEach(function (e) {
        if (ii.includes(e[plugin.mapping['id']])) {
            // Set params for new local object
            var params = {};
            // Set required mapped params: id, title, reference and status
            params['id'] = e[plugin.mapping['id']];
            params[config.v.titleElement] = e[plugin.mapping[config.v.titleElement]];
            // Check if we already have references set, which we can import.
            if (e[plugin.mapping[config.v.identifierElement]] !== undefined && e[plugin.mapping[config.v.identifierElement]].startsWith(config.v.identifierBaseURL)) {
                // TODO: this structure must be configurable and should not be fixed in the code, because this is
                // specific to the exist-db JSON export.
                params[config.v.identifierElement] = {
                    '#text': e[plugin.mapping[config.v.identifierElement]],
                    'preferred': 'YES'
                };
            }
            params[config.v.statusElement] = status;
            // Add all other mapped values
            Object.keys(plugin.mapping).forEach(function (key) {
                if (!['id', config.v.titleElement, config.v.identifierElement, config.v.statusElement].includes(key) && e[plugin.mapping[key]].trim()) {
                    // Check if attribute is configured as multiple. If so, use choosen delimiter.
                    var app_mapping_config = config.m.find(function (o) {
                        return o.localJSONPath == key;
                    });
                    if (app_mapping_config != undefined && app_mapping_config.multiple == true) {
                        // Split values with delimiter and add array
                        params[key] = e[plugin.mapping[key]].trim().split(delimiter);
                    } else {
                        params[key] = e[plugin.mapping[key]].trim();
                    }
                }
            });
            addObject(event.target, params)
        }
    });
    plugin.log('Import finished.');
    // Hide the modal dialog, it will be reseted automatically by event hidden.bs.modal
    $('#' + plugin.prefix + '-modal').modal('hide');
    return plugin;
}


CSVGenericImportExportPlugin.prototype.mergeEntities = function() {
    var plugin = this;
    // Get settings from form
    var updated_rows = updated_cells = 0;
    var settings_form = $('#' + plugin.prefix + '-settings-form');
    var settings_array = settings_form.serializeArray();
    var method = '';
    var status = [];
    var delimiter = '';
    var mode = '';
    settings_array.forEach(function (e) {
        if (e.name == 'csv-merge-method') {
            method = e.value;
        } else if (e.name == 'csv-status') {
            status.push(e.value);
        } else if (e.name == 'csv-delimiter') {
            delimiter = e.value;
        } else if (e.name == 'csv-merge-mode') {
            mode = e.value;
        }
    });
    plugin.log('Merging data ' + method + 'ly ...');

    // Merging local data into CSV data based on IDs
    // Loop through parsed data row
    plugin.csvdata.data.forEach(function (row, index) {
        // Get ID from mapped attribute
        var id = row[plugin.mapping['id']].trim();
        if (id != '') {
            // Get local object with ID
            var obj = getLocalObjectById(id);
            // Check if object is in correct state
            if (obj !== undefined && status.includes(obj[config.v.statusElement])) {
                var updated = [];
                // Loop through all other mapped values
                Object.keys(plugin.mapping).forEach(function (key) {
                    switch (key) {
                        case 'id':
                            // Nothing to do here
                            break;
                        case config.v.identifierElement:
                            // Get preferred ID from local object
                            var preferred_id = getPreferredIdentifierFromObject(obj);
                            // if plain mode is choosen, remove base URL from preferred ID
                            if (mode == 'plain' && preferred_id) {preferred_id = preferred_id.substr(config.v.identifierBaseURL.length)}
                            // React according to choosen method
                            if (preferred_id != null && (method == 'hard' || (method == 'soft' && row[plugin.mapping[key]].trim() == ''))) {
                                plugin.csvdata.data[index][plugin.mapping[key]] = preferred_id;
                                updated.push(plugin.mapping[key]);
                            }
                            break;
                        default:
                            // React according to choosen method
                            if (obj[key] != undefined && (method == 'hard' || (method == 'soft' && row[plugin.mapping[key]].trim() == ''))) {
                                // Check if attribute is configured as multiple. If so, use choosen delimiter.
                                var app_mapping_config = config.m.find(function (o) {
                                    return o.localJSONPath == key;
                                });
                                if (app_mapping_config != undefined && app_mapping_config.multiple == true) {
                                    // Join values with delimiter and update CSV data
                                    plugin.csvdata.data[index][plugin.mapping[key]] = asArray(obj[key]).join(delimiter);
                                } else {
                                    plugin.csvdata.data[index][plugin.mapping[key]] = obj[key];
                                }
                                updated.push(plugin.mapping[key]);
                            }
                    }
                });
                if (updated.length > 0) {
                    updated_rows += 1;
                    updated_cells += updated.length;
                    plugin.log('Updated column(s) ' + updated.join(', ') + ' at CSV row with ID (' + plugin.mapping['id'] + '): ' + id);
                }
            }
        }
    });
    // CSV data is updated. Time to parse and download

    plugin.log('Merged ' +updated_cells + ' attribute(s) of ' + updated_rows + ' object(s).');
    plugin.log('Merge finished.');
    // Hide the modal dialog, it will be reseted automatically by event hidden.bs.modal
    $('#' + plugin.prefix + '-modal').modal('hide');
    return plugin;
}


CSVGenericImportExportPlugin.prototype.downloadCSV = function() {
    var exportObj = this.csvdata.data;
    var parse_config = this.csvdata.meta;
    var exportStr = Papa.unparse(exportObj);

    var dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(exportStr);
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", this.filename);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    return this;
}


var csvgiep = new CSVGenericImportExportPlugin();
// Initialize plugin if config is loaded
$('body').on('basicAppConfigLoaded', function () {
    /* Initialize plugin */
    csvgiep.init();
})
