/**** GLOBAL VARIABLES *****/
var map = null;
var arrayOfLatLng = [];


// Add button to input-group after list-item is created
$('#result-container').on('listItemCreated', function (e) {
    var list_item = $(e.target);
    var fid = list_item.attr('id');
    var btn_group = list_item.find('.input-group .input-group-append');
    var btn_map_view = $('<button id="btn-map_'+ fid + '" type="button"></button>')
        //class="btn btn-map btn-outline-secondary">
        .append('<span class="fas fa-map"></span>')
        .attr('aria-label', 'Show map view of data set.')
        .attr('data-toggle','modal')
        .attr('data-target', '#map-modal')
        .attr('title', 'Open map view')
        .addClass('btn btn-map btn-outline-secondary')
        .appendTo(btn_group);
})

var map_modal_html = '<div class="modal fade" id="map-modal" tabindex="-1" aria-labelledby="map-modal-label" aria-hidden="true" role="dialog">\
                            <div class="modal-dialog modal-lg" role="document">\
                                <div class="modal-content">\
                                    <div class="modal-header">\
                                        <h5 class="modal-title" id="map-modal-label">Map</h5>\
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                            <span aria-hidden="true">✖</span>\
                                        </button>\
                                    </div>\
                                    <div class="modal-body"></div>\
                                    <div class="modal-footer">\
                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>';
var map_modal = $(map_modal_html).appendTo('#modals');


function contentForMarkers(data){
    var pop_html = '';
    // add definition items for each attribution
    deepFind(data, 'JSONPath').forEach(function (i) {
        if(i.value){
            pop_html = pop_html + '<dt>' + i.key + '</dt><dd>' + i.value + '</dd>';
        }
    });
    // add items to definition list
    pop_html = '<dl>' + pop_html + '</dl>';
    // if there is a wikipedia link, add it to the stack
    if (data.wikipediaURL) {
        pop_html = pop_html + '<a class="d-block" href="https://' + data.wikipediaURL + '" target="_blank">Wikipedia</a>';
    }
    return pop_html
}


// write the button in different colours if preferred
function markerButtonSetPreferred(selector, greenIcon, greyIcon){
    if($(selector).hasClass('active')){
        $(selector).on('click', function () {
            var ids = $(this).attr('id').substring($(this).attr('id').indexOf('-') + 1);
            var fid = ids.substring(0, ids.indexOf('_'));
            var ref_id = ids.substring(ids.indexOf('_') + 1);
            // 1. update local object
            togglePreferredRef2Data(idm.getObjectId(fid), ref_id);
            //Fire event mapPreferredReferenceChange
            $(this).trigger('mapPreferredReferenceChange');
            // 3. update frontend
            map.eachLayer(function (layer) {
                if (layer._popup) {
                    if (layer._myId === ids) {
                        layer.setIcon(greenIcon);
                        layer.closePopup();
                    } else if (layer._myId != undefined && layer._myId !== ids) {
                        layer.setIcon(greyIcon);
                    }
                }
            });
            // 3.1 update result list buttons
            $('#' + fid + ' label.btn.active').removeClass('active');
            $('#lbl-' + ids).addClass('active');

        });
    }
}


/* ---  Logging Events --- */
$('body').on('mapPreferredReferenceChange',  function(e, data){
    console.log('Fired ' + e.type);
})


function createMap (cluster) {
    // Initialize the Map
    map = new L.map('map', {
        trackResize: true
    });
    // Create base map
    var tiles = L.tileLayer(config.map.baseTileURL, {
        maxZoom: config.map.baseTileMaxZoom,
        attribution: config.map.baseTileAttribution
    }).addTo(map);
    // Invalide the Size to properly showing the map
    map.invalidateSize()
    // write markers (cluster) to map
    map.addLayer(cluster);
}


// get marker for every fetched object
function getMarker (fid, obj, cluster) {
     // Get local_object for preferred
     var ref_id = obj.id;
     var lat = obj.data['lat'];
     var lng = obj.data['lng'];
     // Get local object with ID
     var local_object = getLocalObjectById(idm.getObjectId(fid));
     // Is current object set as preferred ?
     if (Array.isArray(local_object[config.v.identifierElement])) {
         var pref_ref_object = local_object[config.v.identifierElement].find(function (e) {
             return e.preferred === 'YES'
         });
         if (pref_ref_object != undefined && getPlainIdFromUrl(pref_ref_object['#text']) === ref_id) {
             pref_ref = 'YES';
         } else {
             pref_ref = 'NO'
         }
     } else {
         var pref_ref = local_object[config.v.identifierElement].preferred;
     }

    // Matched marker with all fetched data and changing color if preferred
    var icon_options = {
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize:[25, 41],
        iconAnchor:[12, 41],
        popupAnchor:[1, -34],
        shadowSize:[41, 41]
    }
    var greyIcon = new L.Icon(icon_options);
    icon_options.iconUrl = 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
    var greenIcon = new L.Icon(icon_options);

    if (lat !== undefined && lng !== undefined) {
        // If map isn't created yet, do so
        if (map === null) {
            createMap(cluster);
        }
        var marker_id = fid + '_' + ref_id;
        var marker = new L.Marker([lat, lng]);
        marker._myId = marker_id;
        marker.bindPopup();
        arrayOfLatLng.push(marker.getLatLng());
        if (pref_ref == 'NO') {
            marker.setIcon(greyIcon);
        } else {
            marker.setIcon(greenIcon);
        }
        marker.on('popupopen', function (e) {
             // Is current object set as preferred ?
             if (Array.isArray(local_object[config.v.identifierElement])) {
                 var pref_ref_object = local_object[config.v.identifierElement].find(function (e) {
                     return e.preferred === 'YES'
                 });
                 if (pref_ref_object != undefined && getPlainIdFromUrl(pref_ref_object[ '#text']) === ref_id) {
                     pref_ref = 'YES';
                 } else {
                     pref_ref = 'NO'
                 }
             } else {
                 var pref_ref = local_object[config.v.identifierElement].preferred;
             }
            // create popup content
            var pop_html = contentForMarkers(obj.data);
            var btn_html = $('<button type="button" \
                                          class="btn btn-success btn-sm" \
                                          id="mapMarkerPref-'+ fid + '_' + ref_id + '" \
                                          data-geo-id="'+ ref_id +'">\
                                          Set ' + ref_id + ' preferred\
                                       </button>');
            if (pref_ref == 'NO') {
                btn_html.addClass('active');
            } else {
                btn_html.addClass('disabled');

            }
            e.popup.setContent(pop_html + btn_html[0].outerHTML);
            markerButtonSetPreferred('#mapMarkerPref-' + fid + '_' + ref_id, greenIcon, greyIcon)
            var px = map.project(e.popup._latlng); // find the pixel location on the map where the popup anchor is
            px.y -= e.popup._container.clientHeight/2 // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
            map.panTo(map.unproject(px),{animate: true}); // pan to new center
        });

        marker.on('dblclick', function (e) {
            map.setView(e.latlng, 10);
        })

        cluster.addLayer(marker);
        var markerBounds = L.latLngBounds(arrayOfLatLng);
        map.fitBounds(markerBounds);
    } else {
        console.log('No Latitude or Longitude Data exist!');
    }
}


// Fetch objects via AJAX JSON call for every reference ID if not exist
function fetchObject(fid, ref_id, cluster){
    // Object wasn't loaded jet, do so
    // diplay loading state, e.g. spinner icon
    //$(label_obj).toggleClass('btn-loading');
    // compose the Cultegraph Link with the GND - ID
    var geo_json_url = config.a.authorityDataBaseURL + ref_id;
    console.log('Request external object: ', geo_json_url);
    $.getJSON(geo_json_url)
    .done(function (result) {
        // Cache object if not already done
        var fetched_obj = fetched_objects.objects.find(function (e) {
            return e.id === ref_id
        })
        if (fetched_obj === undefined) {
            fetched_objects.objects.push({
                "id": ref_id, "data": result
            });
            console.log('Added object ' + ref_id + ' to fetched objects.');
        }
        getMarker(fid, {"id": ref_id, "data": result}, cluster);
    })
    .fail(function (result) {
        console.log('Request failed: ' + geo_json_url);
    });
}


function enableModalMapReset (selector, fid) {
    $(selector).one('hidden.bs.modal', function () {
        // Remove the map after Modal is closed - because of container conflict
        if (map !== null) {
            map.off;
            map.remove();
            L.tileLayer.remove;
            map = null;
        }
        // Highlight result item from which the modal was triggered
        if (fid != undefined) {
            $('#' + fid)
                .addClass('last-focussed-item')
                .bind('animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd', function () {
                    $(this).removeClass('last-focussed-item');
                });
        }
    });
}


/* Build map layer and get marker via fetched objects */
$('#modals').on('shown.bs.modal', '#map-modal', function (event) {
    var button = $(event.relatedTarget) // Button that triggered the modal
    var recipient = button.attr('id') // Extract info from data-* attributes
    var fid = recipient.substring(recipient.indexOf('_') + 1);
    var oid = idm.getObjectId(fid);
    // parenting list group element
    var list_group_item = $('#' + fid);
    // Name of our reference place
    var place_name = list_group_item.find('h5').text();
    // Related authority data
    var related_entries = list_group_item.find('.btn-group-ads>label');

    // Write Map
    var modal = $('#map-modal');

    // Rebuild the Container for Map
    var modal_width = $('#map-modal .modal-body').width();
    var modal_height = window.innerHeight * 0.7;
    var container = L.DomUtil.get('map');
    if (container != undefined) {
        container._leaflet_id = null;
        modal.find('.modal-body').empty();
    }
    modal.find('.modal-body').append('<div id="map" style="height: ' + modal_height + 'px;"></div>');
    var markers = new L.MarkerClusterGroup();
    // get fetched Obejcts and write marker
    related_entries.each(function () {
        var ref_id = $(this).attr('data-ref-id');
        var fetched_obj = fetched_objects.objects.find(function (e) {
            return e.id === ref_id
        })

        if (fetched_obj){
            getMarker(fid, fetched_obj, markers);
        } else {
            fetchObject(fid, ref_id, markers);
        }
    });
    // Write the title
    modal = $(this);
    modal.find('.modal-title').text('Autority Data Map: ' + place_name).append(' <small>(local ID: ' + oid + ')</small>');
    // clear former collected geodata
    arrayOfLatLng = [];
    // Enable modal resetting
    enableModalMapReset('#map-modal', fid);
});
