// Filter button
var plugin_filter_btns = $('<button class="btn btn-outline-light btn-filter" id="btn-filter-safe" type="button">safe <span class="badge badge-success" id="badge-filter-safe">0</span></button>\
                           <button class="btn btn-outline-light btn-filter" id="btn-filter-unsafe" type="button">unsafe <span class="badge badge-warning" id="badge-filter-unsafe">0</span></button>\
                           <button class="btn btn-outline-light btn-filter" id="btn-filter-unchecked" type="button">unchecked <span class="badge badge-secondary" id="badge-filter-unchecked">0</span></button>\
                           <button class="btn btn-outline-light btn-filter" id="btn-filter-unavailable" type="button">unavailable <span class="badge badge-danger" id="badge-filter-unavailable">0</span></button>');
// Initialize filter plugin
var basicPluginFilter = new ActionButtonPlugin('app-plugin-filter-generic', 'Filter', 'fas fa-sliders-h', '#app-content-plugins-filter');
basicPluginFilter.render();
// Register filter buttons
basicPluginFilter.registerButton(plugin_filter_btns);


// Initialize filter button
enableButtonFilter('.btn-filter');
// Initialize Listeners
$('body').on('filterStatus triggerAdd triggerSetStatus triggerDel basicAppConfigLoaded datasetLoaded', function (e) {
    $('.btn-filter').each(function(){
        var idstr = 'btn-filter-';
        var status = $(this).get(0).id.substring(idstr.length);
        if ($(this).hasClass('active')) {
            $('.status-ref-' + status).addClass('filtered-status');
        } else {
            $('.status-ref-' + status).removeClass('filtered-status');
        }
        countObjectsByStatus();    
    });    
})


// click button to filter by status
function enableButtonFilter (selector) {
    $(selector).on('click', function () {
        $(this).toggleClass('active');
        $(this).trigger('filterStatus');
    });
}


// Function is counting all data filter by status
function countObjectsByStatus () {
    var counts = {};
    config.app.config.status.available.forEach(function (status) {counts[status] = 0})
    if(data_objects[config.a.JSONContainer]) {
        asArray(data_objects[config.a.JSONContainer]).forEach(function(e){
            // e.g. {counts: {safe: 1}}
            counts[e[config.v.statusElement]]++;
        })
    }
    config.app.config.status.available.forEach(function (status) {
        document.getElementById('badge-filter-' + status).innerHTML = counts[status];
    })
}
