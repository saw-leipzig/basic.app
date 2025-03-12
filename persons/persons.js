// Register default add button
var btn_action_add = $('<button class="btn btn-outline-light btn-add" id="btn-add" data-toggle="modal" data-target="#object-modal" type="button">\
                            <span class="fas fa-plus"></span> Add person</button>');
btn_action_add.on('click', function(e){
    // Nothing to do here, modal opens automatically
})
basicPluginActions.registerButton(btn_action_add);


function findAuthorityData (trigger, searchterm, fid) {
    // Search parameter: only differentiated persons
    const lobidSearchUrl = 'https://lobid.org/gnd/search?format=json&filter=type:DifferentiatedPerson&q=';
    let cnt = 0;
    $.getJSON(lobidSearchUrl + encodeURIComponent(searchterm)).done(function (result) {
        console.log('Got JSON from querying: ' + searchterm);
        cnt = result.totalItems
        // Add number of results to button as badge
        $(trigger).children('.fas')
            .toggleClass('fa-binoculars fa-sync-alt fa-spin')
            .html(cnt);
        // Use 'gndIdentifier' attribute for reference collection
        const references = result.member.map(item => item.gndIdentifier);
        console.log('FindAuthorityData: results (type is person and has DNB entry): ' + cnt);
        // add buttons for each result using 'gndIdentifier'
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
     * DISABLED AS THE SERVICE ISN'T AVAILABLE ANYMORE
     *
     *  */
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
