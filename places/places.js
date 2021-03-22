// Register default add button
var btn_action_add = $('<button class="btn btn-outline-light btn-add" id="btn-add" data-toggle="modal" data-target="#object-modal" type="button">\
                            <span class="fas fa-plus"></span> Add place</button>');
btn_action_add.on('click', function(e){
    // Nothing to do here, modal opens automatically
})
basicPluginActions.registerButton(btn_action_add);


// Load JSON data for the authoritydata identifier
function findAuthorityData (trigger, searchterm, fid) {
    var geo_url_suggest = config.a.geo_url_suggest;
    var cnt = 0;
    var params = [];
    // params = ['key1=value1', 'key2=value2', ...]
    for (k in config.a.geo_url_params) {
        if (Array.isArray(config.a.geo_url_params[k])) {
            config.a.geo_url_params[k].forEach(function (i) {
                params.push(encodeURIComponent(k) + '=' + encodeURIComponent(i));
            })
        } else {
            params.push(encodeURIComponent(k) + '=' + encodeURIComponent(config.a.geo_url_params[k]));
        }
    }
    // To prevend CORS warnings add '&callback=?' to the URL as suggested here http://api.jquery.com/jQuery.getJSON/
    $.getJSON(geo_url_suggest + encodeURIComponent(searchterm) + '&' + params.join('&')).done(function (result) {
        console.log('Got JSON from querying: ' + searchterm);
        var all_results = result.geonames;
        if (all_results != null) {
            cnt = all_results.length;
        }
        // Add number of results to button as badge
        $(trigger).children('.fas')
            .toggleClass('fa-binoculars fa-sync-alt fa-spin')
            .html(cnt);
        // add buttons for each result
        var references = [];
        for (var key in all_results) {
            if (Number(key) != 'NaN') {
                //console.log(person_gnd_results[key]);
                references.push(all_results[key].geonameId);
            }
        }
        console.log('FindAuthorityData: results (type is place and has GEO entry): ' + cnt);
        addReference(trigger, fid, references);
    }).fail(function (jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log('Request Failed: ' + err);
    });
}


function addLinksFromObjectToCollection(obj, collection){
    // Add geoname object link
    collection.push({
        'name': config.v.identifierAbbreviation,
        'url': getUrlFromPlainId(obj.geonameId)
    });
    // May add Wikipedia link
    if (obj.wikipediaURL) {
        var wiki_url = obj.wikipediaURL;
        if (!wiki_url.startsWith('http')) {
            wiki_url = 'https://' + wiki_url;
        }
        collection.push({
            'name': 'Wikipedia',
            'url': wiki_url
        });
    }
}


function loadSeealsoResources (cardid, ref_id) {
    // Not available for places
}

