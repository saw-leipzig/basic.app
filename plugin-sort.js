function SimpleSortPlugin () {
    this.prefix = this.constructor.name.toLowerCase();
    ActionButtonPlugin.call(this, this.prefix, 'Sort', 'fas fa-sort', '#app-content-plugins-filter');
}


// Inherit from ActionButtonPlugin
SimpleSortPlugin.prototype = Object.create(ActionButtonPlugin.prototype);
SimpleSortPlugin.prototype.constructor = SimpleSortPlugin;


SimpleSortPlugin.prototype.init = function () {
    var plugin = this;
    this.render();

    // Button: order dropdown
    var btn_order = $('<div id="' + this.prefix + '-btn-sortorder"></div>')
        // Add classes
        .addClass('btn-group btn-group-sm')
        // Add dropdown button
        .append('<button type="button" class="btn btn-outline-light dropdown-toggle text-left text-truncate" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                    <strong>Order</strong>: <em id="' + this.prefix + '-btn-sortorder-current"></em>\
                </button>')
        // Add dropdown menu
        .append('<div class="dropdown-menu" id="' + this.prefix + '-btn-sortorder-options"></div>');

    // Button: sort by name
    var btn_by_name = $('<button class="btn btn-outline-light" id="' + this.prefix + '-btn-by-name" type="button">Name</button>')
        .on('click', function(){
            if (!$(this).hasClass('disabled')) {
                // TODO: Indicate we are working, if sorting takes some time
                plugin.toggleButtonActivity(this);
                plugin.sort(config.v.titleElement);
                plugin.toggleButtonActivity(this);
            }
        });

    // Button: sort by id
    var btn_by_id = $('<button class="btn btn-outline-light" id="' + this.prefix + '-btn-by-id" type="button">ID</button>')
        .on('click', function(){
            if (!$(this).hasClass('disabled')) {
                // TODO: Indicate we are working, if sorting takes some time
                plugin.toggleButtonActivity(this);
                plugin.sort('id');
                plugin.toggleButtonActivity(this);
            }
        });

    // Button: sort by status
    var btn_by_status = $('<button class="btn btn-outline-light" id="' + this.prefix + '-btn-by-status" type="button">Status</button>')
        .on('click', function(){
            if (!$(this).hasClass('disabled')) {
                // TODO: Indicate we are working, if sorting takes some time
                plugin.toggleButtonActivity(this);
                plugin.sort(config.v.statusElement);
                plugin.toggleButtonActivity(this);
            }
        });

    this.registerButton(btn_order)
        .registerButton(btn_by_name)
        .registerButton(btn_by_id)
        .registerButton(btn_by_status)
        .buildOrderButtonDropDown();

    // Dirty workaround to get the plugin in visible state. Usually this is done in
    // plugin-actions.js, triggered by the event "datasetLoaded"
    //this.plugin.removeClass('plugin-hidden');
    this.log('Initialized.');
    return this;
}


SimpleSortPlugin.prototype.buildOrderButtonDropDown = function (current) {
    var plugin = this;
    var options = ['ascending', 'descending'];
    var current = current || 'ascending';
    // display current sortorder
    $('#' + this.prefix + '-btn-sortorder-current').html(current);
    // Rebuild dropdown
    $('#' + this.prefix + '-btn-sortorder-options').html('');
    options.forEach(function(option){
        var btn = $('<button class="dropdown-item" type="button"></button>');
        if (current == option) {
            btn.addClass('disabled');
        }
        btn.append(option)
        .appendTo('#' + plugin.prefix + '-btn-sortorder-options')
        .on('click', function() {
            if (!$(this).hasClass('disabled')) {
                // display current sortorder
                $('#' + plugin.prefix + '-btn-sortorder-current').html(option);
                // enable other disabled buttons
                $(this).parent().find('.disabled').removeClass('disabled');
                // disable current button
                $(this).addClass('disabled');
                // Hide plugins
                $('#app-content-plugins-area').collapse('hide');
            }
        });
    });
    return this;
}


SimpleSortPlugin.prototype.toggleButtonActivity = function (btn) {
    // TODO
    return this;
}


SimpleSortPlugin.prototype.sort = function (attribute) {
    this.log('Started sorting.');
    var order = $('#' + this.prefix + '-btn-sortorder-current').html() // Get current order
    var container = $('#result-container div.list-group');
    var items = container.children('div.list-group-item');
    items.sort(function (a, b) {
        var obj1 = getLocalObjectById(idm.getObjectId(a.id));
        var obj2 = getLocalObjectById(idm.getObjectId(b.id));
        // Default is sort by name
        // Be aware of config dependency here
        var comp1 = obj1[attribute];
        var comp2 = obj2[attribute];
        // Define sort order by multiplying with 1 (asc) or -1 (desc)
        var ord = 1;
        if (order === 'descending') {
            ord = -1;
        }

        if (comp1 < comp2) {
            return -1 * ord;
        }
        if (comp1 > comp2) {
            return 1 * ord;
        }
        // names must be equal
        return 0;
    })
    items.detach().appendTo(container);
    this.log('Finished sorting.');
    return this;
}


// Instantiate and initialize plugin
var ssp = new SimpleSortPlugin();
ssp.init();
