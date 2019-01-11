var plugin_filter_title_ipt_id = 'filter-title-ipt-regex';

// Build filter input field
var plugin_search_input = $('<div class="input-group input-group-sm mt-2"></div>')
    // Add input
    .append('<input id="' + plugin_filter_title_ipt_id + '" type="text" class="form-control" placeholder="Start typing to filter results" aria-label="Start typing to filter results"/>')
    .append('<div class="input-group-append"></div>');

// Build dataset information
var plugin_ls_dataset_info = $('<div id="ls-dataset-info"></div>')
    .addClass('row mt-2 text-secondary small')
    .append('<div class="col-md-12">Showing <span id="plugin-filter-title-info-current">X</span> of <span id="plugin-filter-title-info-total">Y</span> objects</div>')

// Initialize filter plugin
var basicPluginSearch = new BasicAppPlugin('app-plugin-filter-title', 'Filter by title', 'fas fa-search', '#app-content-plugins-filter');
basicPluginSearch.render([plugin_ls_dataset_info, plugin_search_input]);


var plugin_filter_title_btn_reset = $('<button id="filter-title-btn-reset" title="Reset filter." type="button"></button>')
    // Add classes
    .addClass('btn btn-outline-light disabled')
    // Add plus icon
    .append('<span class="fas fa-times"></span>')
    .appendTo('#app-plugin-filter-title .input-group-append')
    .on('click', function () {
        console.log('reset the filter');
        if(!$(this).hasClass('disabled')){
            $('#' + plugin_filter_title_ipt_id).val('');
            $(this).addClass('disabled');
            $(this).trigger('pluginFilterTitleReset');
        }
    });


// Initialize filter button
enableSearchInput('#' + plugin_filter_title_ipt_id);
// Initialize Listeners
$('body').on('objectAdd statusChange objectDelete basicAppConfigLoaded datasetLoaded pluginFilterTitleReset', function (e) {
    filterByTitle($('#' + plugin_filter_title_ipt_id).val());
})


function filterByTitle(search_query) {
    if(search_query.length >= 1) {
        $('.list-group-item').each(function(){
            var re = new RegExp(search_query, 'i');
            if ($(this).children('h5').text().match(re) == null){
                $(this).addClass('filtered-title');
            } else {
                $(this).removeClass('filtered-title');
            }
        });
        $('#filter-title-btn-reset').removeClass('disabled');
    } else {
        $('.list-group-item').removeClass('filtered-title');
        $('#filter-title-btn-reset').addClass('disabled');
    }
    // Update filter information
    $('#plugin-filter-title-info-total').html($('.list-group-item').length);
    $('#plugin-filter-title-info-current').html($('.list-group-item').length - $('.filtered-title').length);
}


// while writing filter for titles
function enableSearchInput (selector){
    $(selector).on('keyup', function(){
        var search_query = $(this).val();
        filterByTitle(search_query);
    });
}
