function BasicAppPlugin (id, title, icon_classes, container_selector) {
    this.id = id;
    this.title = title;
    this.icon_classes = icon_classes;
    this.DOMContainer = $(container_selector);
}


BasicAppPlugin.prototype.renderPluginBase = function () {
    this.plugin = $('<div id="' + this.id + '"></div>');
    this.plugin
        .addClass('app-plugin')
        // add heading
        .append('<h6 class="text-light app-plugin-title"><i class="' + this.icon_classes + '"></i> ' + this.title + '</h6>')
        .append('<div class="app-plugin-content"></div>')
        .appendTo(this.DOMContainer);
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


function ActionButtonPlugin (id, title, icon_classes, container_selector) {
    BasicAppPlugin.call(this, id, title, icon_classes, container_selector)
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
    // TODO: Check if it is a button and add
    this.buttons.push(btn);
    // Add to button group
    this.plugin.find('.btn-group').append(btn);
    return this;
}


// Initialize actions plugin
var basicPluginActions = new ActionButtonPlugin('app-plugin-actions', 'Actions', 'fas fa-diagnoses', '#app-content-plugins-actions');
basicPluginActions.render();
