function JSONImportExportPlugin() {
    this.prefix = this.constructor.name.toLowerCase();

    var plugin = this;
    /* ----- Download JSON ----- */
    // Create and register JSON download button
    var btn_json_down = $('<button class="btn btn-outline-light" id="' + this.prefix + '-btn-download" type="button" data-toggle="modal" data-target="#' + this.prefix + '-modal-download">\
                                <span class="fas fa-file-download"></span> Backup <span class="text-muted">as JSON</span>\
                            </button>');
    btn_json_down.on('click', function(e){
        plugin.updateDownloadableObjectsCounter();
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
    })
    basicPluginActions.registerButton(btn_json_down);

    // Create download options modal
    var modal_down_doc = 'All data managed by the tool can be downloaded as a plain text file, containing those data in <em>JavaScript Simple Object Notation</em> (JSON). The backuped data could be imported or added to all equally configured instances of the tool. Please note, that only the current context, e.g. <em>persons</em>, is used, so, if you need backup of your other contexts, e.g. <em>places</em>, as well, you have to do it seperatly.';
    var modal_html = '<div class="modal fade" id="' + this.prefix + '-modal-download" tabindex="-1" aria-hidden="true" role="dialog">\
                                      <div class="modal-dialog modal-lg" role="document">\
                                          <div class="modal-content">\
                                              <div class="modal-header">\
                                                  <h5 class="modal-title">Backup data</h5>\
                                                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                                      <span aria-hidden="true">✖</span>\
                                                  </button>\
                                              </div>\
                                              <div class="modal-body">\
                                                  <p>' + modal_down_doc + '</p>\
                                                  <form id="' + this.prefix + '-settings-form"></form>\
                                              </div>\
                                              <div class="modal-footer">\
                                                <button type="button" class="btn btn-primary" id="' + this.prefix + '-btn-backup">\
                                                    Download selected data</button>\
                                              </div>\
                                          </div>\
                                      </div>\
                                  </div>';
    $(modal_html).appendTo('#modals')
    // Create settings form
    // METHOD [all|visible]
    var method_description = $('<small class="form-text">Select backup method. <span class="text-muted">You can either download all data or just those data according to visible (not hidden by an active filter) objects.</span></small>');
    var method_buttons = $('<div class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons"></div>')
        .append('<label class="btn btn-secondary active">\
                    <input type="radio" name="json-backup-method" value="all" autocomplete="off" checked> All objects <span class="badge badge-light found-objects">0</span>\
                </label>')
        .append('<label class="btn btn-secondary">\
                    <input type="radio" name="json-backup-method" value="visible" autocomplete="off"> Visible objects only <span class="badge badge-light found-visible-objects">0</span>\
                </label>')
    $('#' + this.prefix + '-settings-form').append(method_description, method_buttons);


    /* ----- Upload JSON ----- */
    // Create and register JSON upload button
    this.btn_json_up = $('<button class="btn btn-outline-light" id="btn-upload-json" type="button" data-toggle="modal" data-target="#json-file-upload-modal">\
                                <span class="fas fa-file-upload"></span> Restore <span class="text-muted">from JSON</span>\
                            </button>');
    this.btn_json_up.on('click', function(e){
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
    })
    basicPluginActions.registerButton(this.btn_json_up);


    var modal_json_file_upload_status_html = '<label class="btn btn-secondary active">\
                <input type="radio" name="json-import-status" value="as_is" autocomplete="off" checked> from file\
            </label>';
    config.status.available.forEach(function (status) {
        modal_json_file_upload_status_html += '<label class="btn btn-secondary">\
                <input type="radio" name="json-import-status" value="' + status + '" autocomplete="off">' + status + '\
            </label>';
    });
    this.modal_json_file_upload_html = '<div class="modal fade" id="json-file-upload-modal" tabindex="-1" aria-hidden="true" role="dialog">\
                                      <div class="modal-dialog modal-lg" role="document">\
                                          <div class="modal-content">\
                                              <div class="modal-header">\
                                                  <h5 class="modal-title">Upload JSON</h5>\
                                                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                                      <span aria-hidden="true">✖</span>\
                                                  </button>\
                                              </div>\
                                              <div class="modal-body">\
                                                  <form id="import-jsondata-file-form">\
                                                      <div class="custom-file mb-2">\
                                                        <input type="file" class="custom-file-input" id="uploadFileJSON">\
                                                        <label for="uploadFileJSON" class="custom-file-label" id="uploadFileJSONLabel">JSON-file to load data from</label>\
                                                      </div>\
                                                      <small class="form-text">Choose method to set status. <span class="text-muted">"From file" will leave status of objects as set in the file, while any other explicitly set status will force each objects status to the chosen status.</span></small>\
                                                      <div id="import-jsondata-file-form-status-btn-grp" class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons">\
                                                        '+ modal_json_file_upload_status_html +'\
                                                      </div>\
                                                  </form>\
                                                  <form id="import-jsondata-form"></form>\
                                              </div>\
                                              <div class="modal-footer">\
                                                  <button type="button" class="btn btn-primary disabled" id="btn-import-from-json">Import <span class="badge badge-light found-json-objects">0</span> objects</button>\
                                                  <button type="button" class="btn btn-primary disabled" id="btn-add-from-json">Add <span class="badge badge-light found-json-objects">0</span> objects</button>\
                                              </div>\
                                          </div>\
                                      </div>\
                                  </div>';
    $(this.modal_json_file_upload_html).appendTo('#modals');


    // register click event listener
    $('#modals').on('click', '#' + this.prefix + '-btn-backup', function (){
        if (!$(this).hasClass('disabled')) {
            plugin.backup();
        }
    });
    $('#modals').on('click', '#btn-import-from-json', function (e){
        if (!$(this).hasClass('disabled')) {
            plugin.importObjects(e);
        }
    });
    $('#modals').on('click', '#btn-add-from-json', function (e){
        if (!$(this).hasClass('disabled')) {
            plugin.addObjects(e);
        }
    });
    $('#modals').on('change', '#uploadFileJSON', function (e){
        $('#uploadFileJSONLabel').html(this.files[0].name);
        plugin.getObjectsFromJSON();
    });
    $('#modals').on('change', '#import-jsondata-file-form input[name=json-import-status]', function (e){
        plugin.getObjectsFromJSON();
    });
    $('#modals').on('hidden.bs.modal', '#json-file-upload-modal', function (e){
        $('#json-file-upload-modal').replaceWith(plugin.modal_json_file_upload_html);
    });


    this.import_object = {};
}


JSONImportExportPlugin.prototype.updateDownloadableObjectsCounter = function() {
    cnt_all = data_objects[config.a.JSONContainer].length;
    cnt_vis = $('#result-container div.list-group-item').filter('*:not([class*="filtered-"])').length

    $('#' + this.prefix + '-settings-form span.badge.found-objects').html(cnt_all);
    $('#' + this.prefix + '-settings-form span.badge.found-visible-objects').html(cnt_vis);
    return this;
}


JSONImportExportPlugin.prototype.backup = function() {
    // Get selected method
    var settings_form = $('#' + this.prefix + '-settings-form');
    var settings_array = settings_form.serializeArray();
    var method = '';
    settings_array.forEach(function (e) {
        if (e.name == 'json-backup-method') {
            method = e.value;
        }
    });
    if (method == 'visible') {
        // Get all visible (not filtered) items
        var visible_items = $('#result-container div.list-group-item').filter('*:not([class*="filtered-"])');
        // Create new data container with visible objects only
        var visible_objects = {};
        visible_objects[config.a.JSONContainer] = [];
        visible_items.each(function () {
            visible_objects[config.a.JSONContainer].push(getLocalObjectById(idm.getObjectId(this.id)));
        });
        this.downloadJSON(visible_objects, 'basic-' + context + '-filtered');
    } else {
        // Default case is all is
        this.downloadJSON(data_objects, 'basic-' + context);
    }
    // Hide the modal dialog
    $('#' + this.prefix + '-modal-download').modal('hide');
    return this;
}


JSONImportExportPlugin.prototype.downloadJSON = function(exportObj, exportName) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    return this;
}


JSONImportExportPlugin.prototype.getObjectsFromJSON = function() {
    var plugin = this;
    var btn_import = $('#btn-import-from-json');
    var btn_add = $('#btn-add-from-json');
    var count_span = $('.found-json-objects');
    var objects_form = $('#import-objects-form');
    var file_form = $('#import-jsondata-file-form');
    var file_input = $('#uploadFileJSON');
    var file = document.querySelector('#uploadFileJSON').files[0];
    var accepted_mimetypes = [
        'application/json',
        'application/javascript',
        'application/x-javascript',
        'text/javascript',
        'text/x-javascript',
        'text/x-json'
    ]
    var reader  = new FileReader();

    // Clear possible further validation results
    file_form.find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
    file_form.find('.invalid-feedback').remove();
    // Reset importables, form, etc.
    plugin.import_object = {};
    objects_form.empty();
    count_span.empty();
    btn_import.addClass('disabled');
    btn_add.addClass('disabled');

    reader.addEventListener("load", function () {
        console.log('JSON Import/Export: File ' + file.name + ' loaded.');
        // Bootstrap form validation
        file_input.addClass('is-valid');
        try {
            // Get all objects
            var objects = JSON.parse(reader.result);
            // Check if status should be replaced, and do so if wanted
            // Get delimiter set by user in import form
            var status = file_form.serializeArray().find(ipt => ipt.name == 'json-import-status').value;
            if (status != undefined && status != 'as_is') {
                var importable_objects = asArray(objects[config.a.JSONContainer]);
                importable_objects.forEach(function (obj, idx) {
                    asArray(objects[config.a.JSONContainer])[idx][config.v.statusElement] = status;
                });
                plugin.import_object = objects;
            } else {
                console.log('JSON Import/Export: Status will be set to "' + status + '".');
                plugin.import_object = objects;
            }
            var num_objects = asArray(plugin.import_object[config.a.JSONContainer]).length
            // Update import button
            count_span.html(num_objects);
            if (num_objects > 0) {
                btn_import.removeClass('disabled');
                btn_add.removeClass('disabled');
            }
        } catch (e) {
            // SyntaxError
            var msg = '[' + e.name + '] ' + e.message;
            console.log('JSON Import/Export: ' + msg);
            // Bootstrap form validation
            file_input
                .after('<div class="invalid-feedback">' + msg + '</div>')
                .addClass('is-invalid');
        }
    }, false);

    if (file) {
        if (accepted_mimetypes.includes(file.type)) {
            reader.readAsText(file);
        } else {
            // Wrong filetype: abort
            var msg = '[ERROR] Wrong file type "' + file.type + '" detected. Please choose a JSON file (' + accepted_mimetypes.join(', ') + ').';
            console.log('JSON Import/Export: ' + msg);
            // Bootstrap form validation
            file_input
                .after('<div class="invalid-feedback">' + msg + '</div>')
                .addClass('is-invalid');
        }
    }
}


JSONImportExportPlugin.prototype.importObjects = function(event) {
    // Delete existing objects
    var ids_to_delete = asArray(data_objects[config.a.JSONContainer]).map(obj => obj.id);
    console.log('JSON Import/Export: Deleting ' + ids_to_delete.length + ' data objects.');
    ids_to_delete.forEach(function (id) {
        deleteObject(event.target, id);
    });
    console.log('JSON Import/Export: Existing data objects deleted.');
    // Add all new entities
    this.addObjects(event);
    return this;
}


JSONImportExportPlugin.prototype.addObjects = function(event) {
    console.log('JSON Import/Export: Adding objects ...');

    var importable_objects = asArray(this.import_object[config.a.JSONContainer]);
    for (i in importable_objects) {
        addObject(event.target, importable_objects[i]);
    }
    console.log('Addition finished.');
    countObjectsByStatus();
    // Close modal
    $('#json-file-upload-modal').modal('hide');
    return this;
}


var iep = new JSONImportExportPlugin();
