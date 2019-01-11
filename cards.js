/* Cards */
function getIdsFromCard (card) {
    var ids = card.attr('id').substring('card-'.length);
    var element_id = ids.substring(0, ids.indexOf('_'));
    var ref_id = ids.substring(ids.indexOf('_') + 1);
    return {
        element_id: element_id,
        ref_id: ref_id
    }
}


function deleteCard (trigger) {
    var card = trigger.parents('.card-reference');
    // Get ids
    var ids = getIdsFromCard(card);
    // Update data and result list
    deleteIdentifier(ids.element_id, ids.ref_id);
    //Fire event cardDelete
    $(trigger).trigger('cardReferenceDelete');
    // Delete card in DOM
    card.remove();
}


function getCardHTML (cardid, title, attributes, links, classes) {
    // Card header, with buttons for preferred, moving and delete
    var header_buttons = [];
    // If links is empty, it should be the reference data set
    if (links.length) {
        header_buttons.push('<button type="button" class="btn btn-secondary btn-card-left"><i class="fas fa-angle-left"></i></button>');
        // preferred button
        var classes_pref = 'btn btn-secondary btn-card-preferred';
        if (classes.indexOf('bg-info') >= 0) {
            classes_pref = 'btn btn-secondary btn-card-preferred active disabled';
        }
        header_buttons.push('<button type="button" class="' + classes_pref + '">' + title + '</button>');
        header_buttons.push('<button type="button" class="btn btn-secondary btn-card-delete"><i class="fas fa-times"></i></button>');
        header_buttons.push('<button type="button" class="btn btn-secondary btn-card-right"><i class="fas fa-angle-right"></i></button>');
    } else {
        header_buttons.push('<button type="button" class="btn btn-secondary disabled">' + title + '</button>');
    }
    var button_group = '<div class="btn-group btn-group-sm btn-group-card-header" role="group">' + header_buttons.join('') + '</div>';
    var card_header = '<div class="card-header">' + button_group + '</div>';
    //var card_body = '<div class="card-body"><h5 class="card-title">' + obj.fullname + '</h5></div>';
    var card_body = '';
    // Put resource links in card footer
    link_items = '';
    links.forEach(function (link) {
        link_items = link_items + '<a href="' + link.url + '" class="badge badge-light" target="_blank" title="Open ' + link.url + ' in new tab.">' + link.name + '</a>';
    });
    var card_footer = '<div class="card-footer">' + link_items + '</div>';
    // Create attribute list
    var list_items = '';
    attributes.forEach(function (attribute_object) {
        var attribute = attribute_object.value;
        var attribute_classes = ['list-group-item', 'text-truncate', 'modal-card-zoom'];
        var attribute_content = '-';
        if (attribute === undefined || attribute == 0) {
            attribute_classes.push('list-group-item-secondary');
        } else {
            attribute_content = attribute;
        }
        list_items = list_items + '<li class="' + attribute_classes.join(' ') + '" data-content-label="' + attribute_object.key + '"><small>' + attribute_content + '</small></li>';
    });
    var card_attr_list = '<ul class="list-group list-group-flush text-dark">' + list_items + '</ul>';
    var card = '<div id="card-' + cardid + '" class="card ' + classes.join(" ") + '">' + card_header + card_body + card_attr_list + card_footer + '</div>';
    return card;
}


function prepareCardData(local_object, obj, id) {
    var cardid = local_object.id + '_' + id;
    var ret = {
        cardid: cardid,
        id: id,
        attributes: [],
        links: [],
        additional_classes: ['card-reference']
    };
    // Highlight preferred dataset
    if (Array.isArray(local_object[config.v.identifierElement])) {
        var pref_ref_object = local_object[config.v.identifierElement].find(function (e) {
            // TODO: API constrainet: preferred
            return e.preferred === 'YES'
        });
        // TODO: API constrainet: #text
        if (pref_ref_object != undefined && pref_ref_object[ '#text'] === config.v.identifierBaseURL + id) {
            pref_ref = 'YES';
        } else {
            pref_ref = 'NO'
        }
    } else {
        var pref_ref = local_object[config.v.identifierElement].preferred;
    }
    if (pref_ref === 'YES') {
        ret.additional_classes.push('text-white');
        ret.additional_classes.push('bg-info');
    }
    // Card states: title and classes
    if (obj === undefined) {
        ret.id = 'Loading...';
        ret.additional_classes.push('card-loading');
    } else if (obj === null) {
        ret.id = 'Error';
        ret.additional_classes.push('card-error');
    }

    // Create links
    if (obj !== undefined && obj !== null) {
        addLinksFromObjectToCollection(obj, ret.links);
    } else {
        // if there is no fetched object, we still have a identifier and could therefor
        // create a base link
        ret.links.push({
            'name': config.v.identifierAbbreviation,
            'url': config.v.identifierBaseURL + id
        });
    }

    // Return data if we already have some, ID only otherwise
    if (obj !== undefined && obj !== null) {
        // Get configured attributes
        ret.attributes = deepFind(obj, 'JSONPath');
    } else {
        var x = config.app.config.mapping[context].length;
        for (var i = 0; i < x; i++) {
            ret.attributes.push({key: undefined, value: undefined});
        }
    }
    return ret;
}


function constructCompareModalCards(selector){
    $(selector).on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget) // Button that triggered the modal
        var recipient = button.attr('id') // Extract info from data-* attributes
        var data_id = recipient.substring(recipient.indexOf('_') + 1);
        var list_group_item = button.parents('.list-group-item');
        // parenting list group element
        var title = list_group_item.find('h5').text();
        // Name of our reference object
        var related_entries = list_group_item.find('.btn-group-ads>label');
        // Related authority data
        var local_object = getLocalObjectById(data_id);
        var modal = $(this);
        modal.find('.modal-title').text('Authority Data Comparison: ' + title);
        // Clear card deck
        modal.find('#modal-cards').empty();
        // Create first card with reference data
        modal.find('#modal-cards').append(getCardHTMLFromDataID(data_id, local_object));
        // Add state button to footer
        //modal.find('.modal-footer').prepend($('#' + data_id + ' div.input-group-prepend:not(.btn-group)').children().clone());
        // Create card for each related entry
        related_entries.each(function () {
            addCard(modal.find('#modal-cards'), $(this).attr('data-ref-id'), local_object);
        })
    })
}


/* ---  Logging Events --- */
$('body').on('cardReferenceDelete cardPreferredReferenceChange cardSwitch',  function(e, data){
    console.log('Fired ' + e.type);
})


function enableModalCardZoom(selector) {
    var delegate_selector = '.text-truncate';
    $(selector)
        .on('mouseover', delegate_selector, function() {
            if ($('.modal-card-zoom-fixed').length == 0) {
                $('#modal-zoom-text').html('<strong>' + $(this).attr('data-content-label') + ':</strong> ' + $(this).text());
            }
        })
        .on('mouseout', delegate_selector, function () {
            if ($('.modal-card-zoom-fixed').length == 0) {
                $('#modal-zoom-text').html('');
            }
        })
        .on('click', delegate_selector, function() {
            if ($(this).hasClass('modal-card-zoom-fixed')) {
                $('.modal-card-zoom-fixed').removeClass('modal-card-zoom-fixed');
            } else {
                $('.modal-card-zoom-fixed').removeClass('modal-card-zoom-fixed');
                $(this).addClass('modal-card-zoom-fixed');
            }
            $('#modal-zoom-text').html('<strong>' + $(this).attr('data-content-label') + ':</strong> ' + $(this).text());
        });
}


function enableModalCardPreferredToggling(selector) {
    $(selector)
        .on('click', '.btn-card-preferred', function () {
            if (!$(this).hasClass('active')) {
                var card = $(this).parents('.card');
                var ids = getIdsFromCard(card);
                // 1. update local object, backend and frontend (list)
                togglePreferred(ids.element_id, ids.ref_id);
                // 2. update cards
                // remove classes on preferred object
                $('.card.bg-info.text-white').removeClass('bg-info text-white');
                $('.card .active.disabled').removeClass('active disabled');
                // toggle classes on card
                card.toggleClass('bg-info text-white');
                // toggle active class on button
                $(this).toggleClass('active disabled');
                //Fire event cardPreferredReferenceChange
                $(this).trigger('cardPreferredReferenceChange');
            }
        });
}


function enableModalcardSwitch(selector) {
    $(selector)
        // right shift
        .on('click', '.btn-card-right', function () {
            shiftCard($(this), 'right')
            //Fire event cardSwitch
            $(this).trigger('cardSwitch');
        })
        // left shift
        .on('click', '.btn-card-left', function () {
            shiftCard($(this), 'left')
            //Fire event cardSwitch
            $(this).trigger('cardSwitch');
        });
}


function enableModalCardDelete(selector) {
    $(selector)
        .on('click', '.btn-card-delete', function () {
            deleteCard($(this));
        });
}


function enableModalCardEvents(selector) {
    // Enable zoom
    enableModalCardZoom(selector);
    // Enable toggling preferred state
    enableModalCardPreferredToggling(selector);
    // Enable shifting
    enableModalcardSwitch(selector);
    // Enable delete
    enableModalCardDelete(selector);
}


constructCompareModalCards('#compare-modal');
enableModalCardEvents('#modal-cards');


function addCard (container, id, local_object) {
    var fetched_obj = fetched_objects.objects.find(function (e) {
        return e.id === id
    })
    if (fetched_obj !== undefined) {
        var obj = fetched_obj.data;
    } else {
        // Error case
        var obj = undefined;
        // Object wasn't loaded jet, do so
        // diplay loading state, e.g. spinner icon
        var use_corsanywhere = config.app.config.use_corsanywhere;
        var corsanywhere_url = '';
        if (use_corsanywhere) {
            corsanywhere_url = 'https://cors-anywhere.herokuapp.com/';
        }
        // compose API GET-URL for object with ID
        var source_url = corsanywhere_url + config.a.authorityDataBaseURL + id.toUpperCase();
        console.log('Request external object: ', source_url);
        $.getJSON(source_url)
            .done(function (result) {
                // Geonames API doesn't use HTTP-Codes, so check if we got an status objects
                if (result.status != undefined) {
                    var obj = null;
                    /* Example result:
                        {"status": {
                          "message": "For input string: \"1111-1\"",
                          "value": 14
                        }}
                     */
                    var err = 'Request failed: ' + result.status.message + ", " + result.status.value;
                    console.log(err);
                } else {
                    // Cache object if not already done
                    var fetched_obj = fetched_objects.objects.find(function (e) {
                        return e.id === id
                    })
                    if (fetched_obj === undefined) {
                        fetched_objects.objects.push({
                            "id": id, "data": result
                        });
                        console.log('Added object ' + id + ' to fetched objects.');
                    }

                    obj = result;
                }
                // Update Card
                var prepared = prepareCardData(local_object, obj, id)
                $('#card-' + prepared.cardid).replaceWith(getCardHTML(prepared.cardid, prepared.id, prepared.attributes, prepared.links, prepared.additional_classes));
                // Load additional data from seealso webservice
                loadSeealsoResources(prepared.cardid, prepared.id);
            })
            .fail(function (result) {
                console.log('Request failed: ' + source_url);
                var obj = null;
                // Update Card
                var prepared = prepareCardData(local_object, obj, id)
                $('#card-' + prepared.cardid).replaceWith(getCardHTML(prepared.cardid, prepared.id, prepared.attributes, prepared.links, prepared.additional_classes));
            });
    }
    var prepared = prepareCardData(local_object, obj, id)
    // Add card to container (DOM)
    container.append(getCardHTML(prepared.cardid, prepared.id, prepared.attributes, prepared.links, prepared.additional_classes));
    // Load additional data from seealso webservice
    loadSeealsoResources(prepared.cardid, id);
}


function getCardHTMLFromDataID (id, local_object) {
    var attributes = deepFind(local_object, 'localJSONPath');
    //TODO: API constraint: id
    var cardid = local_object.id + '_' + id;
    return getCardHTML(cardid, 'Own data', attributes, [], ['text-white', ' bg-dark']);
}


/* Card functions: setPreferred, delete, shift */
function shiftCard (trigger, direction) {
    // Get card
    var card = trigger.parents('.card');
    // Get ids
    var ids = getIdsFromCard(card);
    // Get all reference/identifier cards
    var cards = $('.card-reference');
    var card_to_shift = card;
    var card_to_shift_idx = cards.index(card_to_shift);
    if (direction == 'right' && card_to_shift_idx < cards.length - 1) {
        var card_to_swap_with = card_to_shift.next();
        // swapping cards
        card_to_swap_with.replaceWith(card_to_shift);
        card_to_swap_with.insertBefore(card_to_shift);
        // shift identifier in data and list view
        shiftIdentifier(ids.element_id, ids.ref_id, direction);
    } else if (direction == 'left' && card_to_shift_idx > 0) {
        var card_to_swap_with = card_to_shift.prev();
        // swapping cards
        card_to_swap_with.replaceWith(card_to_shift);
        card_to_swap_with.insertAfter(card_to_shift);
        // shift identifier in data and list view
        shiftIdentifier(ids.element_id, ids.ref_id, direction);
    }
}
