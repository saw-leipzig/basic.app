function BasicAppPlugin (id, title, icon_classes, container_selector, dataset_dependency) {
    this.id = id;
    this.title = title;
    this.icon_classes = icon_classes;
    this.DOMContainer = $(container_selector);
    this.dataset_dependency = dataset_dependency || 'YES';
}


BasicAppPlugin.prototype.log = function (msg, type, data) {
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


BasicAppPlugin.prototype.renderPluginBase = function () {
    this.plugin = $('<div id="' + this.id + '"></div>');
    this.plugin
        .addClass('app-plugin')
        // add heading
        .append('<h6 class="text-light app-plugin-title"><i class="' + this.icon_classes + '"></i> ' + this.title + '</h6>')
        .append('<div class="app-plugin-content"></div>')
        .appendTo(this.DOMContainer);
    // add class to hide an action section
    if (this.dataset_dependency == 'YES') {
        this.plugin.addClass('plugin-hidden');
    }
    return this;
}


BasicAppPlugin.prototype.renderPluginContent = function (content) {
    if (Array.isArray(content)) {
        this.plugin.find('.app-plugin-content').html('');
        for (i in content) {
            this.plugin.find('.app-plugin-content').append(content[i]);
        }

    } else {
        this.plugin.find('.app-plugin-content').html($(content));
    }
    return this;
}


BasicAppPlugin.prototype.render = function (content) {
    var content = content || null;
    this.renderPluginBase().renderPluginContent(content);
    return this;
}


// if dataset is loaded remove class to show the sections
$('body').on('datasetLoaded',  function (e) {
    $('.plugin-hidden').removeClass('plugin-hidden').show();
})


function ActionButtonPlugin (id, title, icon_classes, container_selector) {
    BasicAppPlugin.call(this, id, title, icon_classes, container_selector);
    this.buttons = [];
}
ActionButtonPlugin.prototype = Object.create(BasicAppPlugin.prototype);
ActionButtonPlugin.prototype.constructor = ActionButtonPlugin;


ActionButtonPlugin.prototype.render = function () {
    var buttongroup = $('<div class="btn-group btn-group-sm d-block d-sm-inline-flex d-xl-block" role="group" aria-label="action-buttons"></div>');
    this.renderPluginBase().renderPluginContent(buttongroup);
    return this;
}


ActionButtonPlugin.prototype.registerButton = function (btn) {
    // btn should be one JQuery element which is either <a> or <button> with class "btn"
    // or a <div> with class "btn-group".
    if (btn.length == 1) {
        var n = btn[0].nodeName.toLowerCase();
        var has_btn_class = btn.hasClass('btn');
        var has_btngroup_class = btn.hasClass('btn-group');
        if (((n == 'a' || n == 'button') && has_btn_class) || (n == 'div' && has_btngroup_class)) {
            this.buttons.push(btn);
            // Add to first button group, which is the plugin button group.
            // Other button groups could exist inside, e.g. as dropdowns.
            this.plugin.find('.btn-group').first().append(btn);
        } else {
            this.log('Wrong parameter for registerButton()', 'ERROR');
        }
    } else {
        this.log('Too many objects for registerButton() given. Expected 1, got ' + btn.length + '.', 'ERROR');
    }
    return this;
}


// Initialize actions plugin
var basicPluginActions = new ActionButtonPlugin('app-plugin-actions', 'Actions', 'fas fa-diagnoses', '#app-content-plugins-actions');
basicPluginActions.render();
