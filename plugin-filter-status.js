var status_colormap = {
    safe: 'success',
    unsafe: 'warning',
    unchecked: 'secondary',
    unavailable: 'danger',
};

// Initialize filter plugin
var basicPluginFilter = new ActionButtonPlugin('app-plugin-filter-generic', 'Filter', 'fas fa-sliders-h', '#app-content-plugins-filter');
basicPluginFilter.render();

// Register filter buttons
config.app.config.status.available.forEach(function (status) {
    // Filter button
    var filter_btn_span = $('<span id="badge-filter-' + status +'">0</span>')
        .addClass('badge' + (status_colormap[status] ? ' badge-' + status_colormap[status] : ''));
    var filter_btn = $('<button id="btn-filter-' + status +'" type="button">' + status +' </button>')
        .addClass('btn btn-outline-light btn-filter')
        .append(filter_btn_span);
    basicPluginFilter.registerButton(filter_btn);
});


// Initialize filter button
enableButtonFilter('.btn-filter');
// Initialize Listeners
$('body').on('filteredStatus objectAdd statusChange objectDelete basicAppConfigLoaded datasetLoaded', function (e) {
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
        $(this).trigger('filteredStatus');
    });
}


// Function is counting all data filter by status
function countObjectsByStatus () {
    var counts = {};
    config.app.config.status.available.forEach(function (status) {counts[status] = 0});
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
