// Build plugin dataset dropdown
var plugin_ls_datasets = $('<div id="ls-datasets-dropdown"></div>')
    // Add classes
    .addClass('btn-group btn-group-sm d-block')
    // Add dropdown button
    .append('<button type="button" class="btn btn-outline-light btn-block dropdown-toggle text-left text-truncate" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                <strong>Current Dataset</strong>: <em id="ls-dataset-current"></em>\
            </button>')
    // Add dropdown menu
    .append('<div class="dropdown-menu" id="ls-datasets"></div>');


// Build plugin input group
var plugin_ls_dataset_name = $('<div class="input-group input-group-sm mt-2"></div>')
    // Add input
    .append('<input id="ls-dataset-ipt-name" type="text" class="form-control" placeholder="New dataset name" aria-label="New dataset name"/>')
    .append('<div class="input-group-append"></div>');


// Build dataset information
var plugin_ls_dataset_info = $('<div id="ls-dataset-info"></div>')
    .addClass('row mt-2 text-secondary')
    .append('<div class="col-md-12">Last modified: <em id="ls-dataset-info-last" class="text-light"></em></div>')
    .append('<div class="col-md-12">Objects: <em id="ls-dataset-info-count" class="text-light"></em></div>');


// Add plugin section
var basicPluginLocalStorage = new BasicAppPlugin('app-plugin-ls', 'Local Storage Configuration', 'fas fa-database', '#app-content-plugins-configuration', 'NO');
basicPluginLocalStorage.render([plugin_ls_datasets, plugin_ls_dataset_info, plugin_ls_dataset_name]);


// Build button add dataset name
var ls_dataset_btn_add = $('<button id="ls-dataset-btn-add" title="Add new local dataset." type="button"></button>')
    // Add classes
    .addClass('btn btn-outline-light')
    // Add plus icon
    .append('<span class="fas fa-plus"></span>')
    .appendTo('#app-plugin-ls .input-group-append')
    .on('click', function () {
        // Reset data objects, to start with a clean dataset
        data_objects = {};
        // Reset frontend also
        $('#result-container .list-group-item').remove();
        // Set new dataset and store localy
        basicLSA.setDataset($('#ls-dataset-ipt-name').val()).save();
        // Rebuild dropdown menu
        buildDatasetDropdownMenu(basicLSA.getAvailableDatasets(), $('#ls-dataset-ipt-name').val());
    });


function updateFrontendDatasetInformation (timestamp, count) {
    var lm = new Date();
    lm.setTime(timestamp);
    $('#ls-dataset-info-last').html(lm);
    $('#ls-dataset-info-count').html(count);
}


function buildDatasetDropdownMenu (dss, current) {
    if (dss != undefined) {
        var current = current || null;
        if (current) {
            // display current dataset
            $('#ls-dataset-current').html(current);
        }
        $('#ls-datasets').html('');
        dss.forEach(function(ds){
            var btn = $('<button class="dropdown-item" type="button"></button>');
            if (current == ds) {
                btn.addClass('disabled');
            }
            btn.append(ds)
            .appendTo('#ls-datasets')
            .on('click', function() {
                if (!$(this).hasClass('disabled')) {
                    // display current dataset
                    $('#ls-dataset-current').html(ds);
                    // enable other disabled buttons
                    $(this).parent().find('.disabled').removeClass('disabled');
                    // disable current button
                    $(this).addClass('disabled');
                    basicLSA.setDataset($(this).text()).load();
                    // Hide plugins
                    $('#app-content-plugins-area').collapse('hide');
                }
            });
        });
    }
}


/* Local storage adapter */
function LocalStorageAdapter (ctx, ds) {
    this.ctx = ctx || null;
    this.ds = ds || null;
    this.last_updated = Date.now();
    this.ls_key = 'basic.app.data';
    this.ls_key_last = 'basic.app.' + ctx + '.lds';
    this.ls_objects = [];
}


LocalStorageAdapter.prototype.save = function () {
    console.log('Local Storage API: Saving data to local storage...');
    // Only save if context and dataset aren't null
    if (this.ctx != null && this.ds != null) {
        this.last_updated = Date.now();
        var ls_obj = {
            'context': this.ctx,
            'id': this.ds,
            'last_updated': this.last_updated,
            'data_objects': data_objects
        };
        // Add or edit dataset
        var ds = this.ds;
        var ctx = this.ctx;
        var stored_idx = this.ls_objects.findIndex(function (i) {
            return i.context == ctx && i.id == ds;
        });
        if (stored_idx > -1) {
            this.ls_objects[stored_idx] = ls_obj;
        } else {
            this.ls_objects.push(ls_obj);
        }

        localStorage.setItem(this.ls_key, JSON.stringify(this.ls_objects));
        console.log('Local Storage API: Saved ' + asArray(ls_obj.data_objects[config.a.JSONContainer]).length + ' object(s) (context: ' + this.ctx + ', dataset: ' + this.ds + ')');
        // Update frontend info
        updateFrontendDatasetInformation(ls_obj.last_updated, asArray(ls_obj.data_objects[config.a.JSONContainer]).length);
    } else {
        console.log('Local Storage API (ERROR): Context or dataset is null. Nothing saved.');
    }
    return this;
};


LocalStorageAdapter.prototype.init = function () {
    var stored_objects = JSON.parse(localStorage.getItem(this.ls_key));
    if (stored_objects != undefined) {
        this.ls_objects = stored_objects;
        var last_ds = localStorage.getItem(this.ls_key_last);
        if(last_ds != null){
            this.setDataset(last_ds).load();
        }
        // Add existing datasets to dropdown
        buildDatasetDropdownMenu(this.getAvailableDatasets(), last_ds);
    }
    console.log('Local Storage API: Initialized');
    return this;
}


LocalStorageAdapter.prototype.load = function () {
    console.log('Local Storage API: Loading data from local storage...');
    // Only load if context and dataset aren't null
    if (this.ctx != null && this.ds != null) {
        var ds = this.ds;
        var ctx = this.ctx;
        var stored_objects = JSON.parse(localStorage.getItem(this.ls_key));
        this.ls_objects = stored_objects;
        var stored_obj = stored_objects.find(function (i) {
            return i.context == ctx && i.id == ds;
        });
        data_objects = stored_obj.data_objects;
        this.last_updated = stored_obj.last_updated;
        // TODO: Clear results if already exist
        $('#result-container .list-group-item').remove();
        // Create result list representation for each entry with global createNewHTMLObject()
        var objects_array = asArray(data_objects[config.a.JSONContainer]);
        objects_array.forEach(function (obj) {createNewHTMLObject(obj)});
        console.log('Local Storage API: ' + objects_array.length + ' object(s) loaded (context: ' + ctx + ', dataset: ' + ds + ')');
        // Update frontend info
        updateFrontendDatasetInformation(this.last_updated, objects_array.length);
    } else {
        console.log('Local Storage API (ERROR): Context or dataset is null. Nothing loaded.');
    }
    return this;
};


LocalStorageAdapter.prototype.getAvailableDatasets = function () {
    var ctx = this.ctx;
    if (ctx != null) {
        var stored_objects = JSON.parse(localStorage.getItem(this.ls_key));
        if (stored_objects != null) {
            var context_objects = stored_objects.filter(function (o) {
                return o.context == ctx;
            });
            var context_ids = context_objects.map(function (o) {
                return o.id;
            });
            if (context_ids[0] != undefined) {
                return context_ids;
            }
        }
    }
}


LocalStorageAdapter.prototype.setDataset = function (ds) {
    this.ds = ds;
    // Save current dataset name
    localStorage.setItem(this.ls_key_last, ds);
    console.log('Local Storage API: Current dataset: ' + ds);
    $('body').trigger('datasetLoaded');
    return this;
}


/* Instantiate LSA */
var basicLSA = new LocalStorageAdapter(context);


// Add listener for all API related events
$('body').on('objectAdd objectDelete objectUpdate statusChange preferredReferenceChange referenceUpdate cardReferenceDelete cardPreferredReferenceChange cardSwitch mapPreferredReferenceChange', function (e, data) {
    basicLSA.save();
});
$('body').on('basicAppConfigLoaded', function () {
    /* Init plugin */
    basicLSA.init();
})
