// Register default add button
var btn_action_add = $('<button class="btn btn-outline-light btn-add" id="btn-add" data-toggle="modal" data-target="#object-modal" type="button">\
                            <span class="fas fa-plus"></span> Add organisation</button>');
btn_action_add.on('click', function(e){
    // Nothing to do here, modal opens automatically
})
basicPluginActions.registerButton(btn_action_add);


function findAuthorityData (trigger, searchterm, fid) {
    const viaf_url_suggest = 'http://www.viaf.org/viaf/AutoSuggest?query=';
    var cnt = 0;
    // To prevend CORS warnings add '&callback=?' to the URL as suggested here http://api.jquery.com/jQuery.getJSON/
    $.getJSON(viaf_url_suggest + encodeURIComponent(searchterm) + '&callback=?').done(function (result) {
        console.log('Got JSON from querying: ' + searchterm);
        var all_results = result.result;
        if (all_results != null) {
            // filter results by nametype of 'corporate' to get only organisation authority data
            var organisation_results = all_results.filter(function (e) {
                return e.nametype == 'corporate';
            });
            // take only DNB links and count them
            var organisation_gnd_results = organisation_results.filter(function (e) {
                return e.dnb != undefined;
            });
            cnt = [...new Set(organisation_gnd_results.map(e => e.recordID))].length;
        }
        // Add number of results to button as badge
        $(trigger).children('.fas')
            .toggleClass('fa-binoculars fa-sync-alt fa-spin')
            .html(cnt);
        // add buttons for each result
        var references = [];
        for (var key in organisation_gnd_results) {
            if (Number(key) != 'NaN') {
                references.push(organisation_gnd_results[key].dnb.toUpperCase());
            }
        }
        console.log('FindAuthorityData: results (type is corporate and has DNB entry): ' + cnt);
        addReference(trigger, fid, references);
    }).fail(function (jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log('Request Failed: ' + err);
    });
}


function addLinksFromObjectToCollection(obj, collection){
    /* Use SameAs relations to propagate further links.
     * JSON-LD from culturegraph looks like:
     *
     * "sameAs" : [ {
     *      "@id" : "http://d-nb.info/gnd/118674838/about",
     *      "collection" : {
     *          "abbr" : "DNB",
     *          "name" : "Gemeinsame Normdatei (GND) im Katalog der Deutschen Nationalbibliothek",
     *          "publisher" : "Deutsche Nationalbibliothek",
     *          "icon" : "http://www.dnb.de/SiteGlobals/StyleBundles/Bilder/favicon.png?__blob=normal&v=1"
     *      }
     *      }, {...},]
     *
     * We use '@id' as URL and 'collection.abbr' as name for the link
     *
     *  */
    if (Array.isArray(obj.sameAs)) {
       obj.sameAs.forEach(function (d) {
         collection.push({
            'name': d.collection.abbr,
            'url': d['@id']
         });
       });
    }
}


function loadSeealsoResources (cardid, ref_id) {
    /* Try to add further resources via beacon seealso service.
     *
     * https://beacon.findbuch.de/seealso/pnd-aks
     *
     * Example URL: https://beacon.findbuch.de/seealso/pnd-aks?format=seealso&id=100000118
     *
     *  */
    var seealso_url = 'https://beacon.findbuch.de/seealso/pnd-aks?format=seealso&id=' + ref_id.toUpperCase() + '&callback=?';
    // Only request data if not already done!
    // This is important, because prepareCardData is called twice if data wasn't fetched yet
    var fetched = fetched_objects.seealso.find(function (s){ return s.id == ref_id });
    if (fetched == undefined) {
        fetched_objects.seealso.push({id: ref_id, data: []});
        console.log('Request external object: ', seealso_url);
        $.getJSON(seealso_url)
            .done(function (result) {
                fetched_objects.seealso.find(function (s){ return s.id == ref_id }).data = result;
                addFindbuchLinksToCard(cardid, result);
        });
    } else if (fetched.data.length) {
        // we already fetched the result, so let's use them to add the link
        addFindbuchLinksToCard(cardid, fetched.data);
    }
}


function enableModalCardSeealso(selector) {
    $(selector).on('click', '.btn-card-seealso', function () {
        var ref_id = $(this).attr('id').substring($(this).attr('id').indexOf('_') + 1);
        var fetched_obj = fetched_objects.seealso.find(function (e) {
            return e.id === ref_id
        })
        var seealso_names = fetched_obj.data[1];
        var seealso_description = fetched_obj.data[2];
        var seealso_urls = fetched_obj.data[3];
        var links_html_array = [];
        // create HTML-link for each entry
        for (var i = 0; i < seealso_names.length; i++) {
            var link_html = '<a href="' + seealso_urls[i] + '" \
                                class="link-seealso" \
                                title="' + seealso_description[i].replace(/"/g, '&quot;') + '" \
                                target="_blank">' + seealso_names[i] + '</a>';
            links_html_array.push(link_html);
        }
        $('#modal-zoom-text').html(links_html_array.join(', '));
        return false;
    })
}


// Enable seealso button
enableModalCardSeealso('#modal-cards');


function addFindbuchLinksToCard(cardid, result) {
    if(result.length) {
        // append link for FINDBUCH to footer
        var fb_link_html = '<a href="#" \
                            id="card-btn-seealso-' + cardid + '" \
                            class="badge badge-dark btn-card-seealso" \
                            title="Show further ' + result[1].length + ' resources from beacon.findbuch.de in zoom area.">\
                            FINDBUCH (' + result[1].length + ')</a>';

        $('#card-' + cardid).find('div.card-footer').append(fb_link_html);
    }
}
