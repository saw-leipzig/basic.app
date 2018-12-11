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
                                                  <div class="form-group">\
                                                    <label for="uploadFileJSON">JSON-file to load data from</label>\
                                                    <input type="file" class="form-control-file" id="uploadFileJSON">\
                                                  </div>\
                                                  <form id="import-jsondata-form"></form>\
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
    var btn_import = document.querySelector('#btn-import-from-json');
    var btn_add = document.querySelector('#btn-add-from-json');
    var count_span = $('.found-json-objects');
    var objects_form = $('#import-objects-form');
    var file    = document.querySelector('#uploadFileJSON').files[0];
    var reader  = new FileReader();

    reader.addEventListener("load", function () {
        console.log('JSON Import/Export: File ' + file.name + ' loaded.');
        // Reset importables, form, etc.
        import_object = {};
        objects_form.empty();
        count_span.empty();
        $(btn_import).addClass('disabled');
        // Get all objects
        var objects = JSON.parse(reader.result);
        import_object = objects;
        var num_objects = asArray(import_object[config.a.JSONContainer]).length
        // Update import button
        count_span.html(num_objects);
        if (num_objects > 0) {
            $(btn_import).removeClass('disabled');
            $(btn_add).removeClass('disabled');
        }
    }, false);

    if (file) {
        reader.readAsText(file);
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
