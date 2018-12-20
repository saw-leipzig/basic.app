function ImportExportPlugin() {
    var plugin = this;
    /* ----- Download JSON ----- */
    // Create and register JSON download button
    this.btn_json_down = $('<button class="btn btn-outline-light" id="btn-download-json" type="button">\
                                <span class="fas fa-file-download"></span> Download JSON\
                            </button>');
    this.btn_json_down.on('click', function(e){
        plugin.downloadJSON(data_objects, 'basic-' + context);
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
    })
    basicPluginActions.registerButton(this.btn_json_down);


    /* ----- Upload JSON ----- */
    // Create and register JSON upload button
    this.btn_json_up = $('<button class="btn btn-outline-light" id="btn-upload-json" type="button" data-toggle="modal" data-target="#json-file-upload-modal">\
                                <span class="fas fa-file-upload"></span> Upload JSON\
                            </button>');
    this.btn_json_up.on('click', function(e){
        // Hide plugins
        $('#app-content-plugins-area').collapse('hide');
    })
    basicPluginActions.registerButton(this.btn_json_up);


    var modal_json_file_upload_status_html = '<label class="btn btn-secondary active">\
                <input type="radio" name="json-import-status" value="as_is" autocomplete="off" checked> from file\
            </label>';
    config.app.config.status.available.forEach(function (status) {
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
                                                      <div id="import-jsondata-file-form-statuus-btn-grp" class="btn-group btn-group-sm btn-group-toggle mb-2" data-toggle="buttons">\
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


ImportExportPlugin.prototype.downloadJSON = function(exportObj, exportName) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}


ImportExportPlugin.prototype.getObjectsFromJSON = function() {
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
    import_object = {};
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
                import_object = objects;
            } else {
                console.log('JSON Import/Export: Status will be set to "' + status + '".');
                import_object = objects;
            }
            var num_objects = asArray(import_object[config.a.JSONContainer]).length
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


ImportExportPlugin.prototype.importObjects = function(event) {
    data_objects = {};
    $('#result-container .list-group-item').remove();
    console.log('JSON Import/Export: Existing data objects removed.');
    this.addObjects(event);
}


ImportExportPlugin.prototype.addObjects = function(event) {
    console.log('JSON Import/Export: Adding objects ...');

    var importable_objects = asArray(import_object[config.a.JSONContainer]);
    for (i in importable_objects) {
        addObject(event.target, importable_objects[i]);
    }
    console.log('Addition finished.');
    countObjectsByStatus();
    // Close modal
    $('#json-file-upload-modal').modal('hide');
}


var iep = new ImportExportPlugin();
