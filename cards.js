/* Cards */
function getIdsFromCard (card) {
    var ids = card.attr('id').substring('card-'.length);
    var fid = ids.substring(0, ids.indexOf('_'));
    var ref_id = ids.substring(ids.indexOf('_') + 1);
    return {
        fid: fid,
        ref_id: ref_id
    }
}


function deleteCard (trigger) {
    var card = trigger.parents('.card-reference');
    // Get ids
    var ids = getIdsFromCard(card);
    // Update data and result list
    deleteIdentifier(ids.fid, ids.ref_id);
    //Fire event cardDelete
    $(trigger).trigger('cardReferenceDelete');
    // Delete card in DOM
    card.remove();
}


function getCardHTML (cardid, title, attributes, links, classes, status) {
    // Card header, with buttons for preferred, moving and delete
    var header_buttons = [];
    // If status is safe, disable buttons
    var disabled = '';
    if (status == 'safe') {
        disabled = ' disabled';
    }
    // If links is empty, it should be the reference data set
    if (links.length) {
        header_buttons.push('<button type="button" class="btn btn-secondary btn-card-left' + disabled + '"><i class="fas fa-angle-left"></i></button>');
        // preferred button
        var classes_pref = 'btn btn-secondary btn-card-preferred' + disabled;
        if (classes.indexOf('bg-info') >= 0) {
            classes_pref = classes_pref + ' active';
        }
        header_buttons.push('<button type="button" class="' + classes_pref + '">' + title + '</button>');
        header_buttons.push('<button type="button" class="btn btn-secondary btn-card-delete' + disabled + '"><i class="fas fa-times"></i></button>');
        header_buttons.push('<button type="button" class="btn btn-secondary btn-card-right' + disabled + '"><i class="fas fa-angle-right"></i></button>');
    } else {
        header_buttons.push('<button type="button" class="btn btn-secondary disabled">' + title + '</button>');
    }
    var button_group = '<div class="btn-group btn-group-sm btn-group-card-header" role="group">' + header_buttons.join('') + '</div>';
    var card_header = '<div class="card-header">' + button_group + '</div>';
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


function prepareCardData(local_object, obj, ref_id) {
    var cardid = idm.getFrontendId(local_object.id) + '_' + ref_id;
    var ret = {
        cardid: cardid,
        id: ref_id,
        attributes: [],
        links: [],
        additional_classes: ['card-reference'],
        status: local_object[config.v.statusElement]
    };
    // Highlight preferred dataset
    if (Array.isArray(local_object[config.v.identifierElement])) {
        var pref_ref_object = local_object[config.v.identifierElement].find(function (e) {
            // TODO: API constrainet: preferred
            return e.preferred === 'YES'
        });
        // TODO: API constrainet: #text
        if (pref_ref_object != undefined && getPlainIdFromUrl(pref_ref_object[ '#text']) === ref_id) {
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
        // if there is no fetched object, we still have an identifier and could therefor
        // create a base link
        ret.links.push({
            'name': config.v.identifierAbbreviation,
            'url': getUrlFromPlainId(ref_id)
        });
    }

    // Return data if we already have some, ID only otherwise
    if (obj !== undefined && obj !== null) {
        // Get configured attributes
        ret.attributes = deepFind(obj, 'JSONPath');
    } else {
        var x = config.m.length;
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
        var fid = recipient.substring(recipient.indexOf('_') + 1);
        var oid = idm.getObjectId(fid);
        var list_group_item = button.parents('.list-group-item');
        // parenting list group element
        var title = list_group_item.find('h5').text();
        // Name of our reference object
        var related_entries = list_group_item.find('.btn-group-ads>label');
        // Related authority data
        var local_object = getLocalObjectById(oid);
        var modal = $(this);
        modal.find('.modal-title').text('Authority Data Comparison: ' + title);
        // Clear card deck
        modal.find('#modal-cards').empty();
        // Create first card with reference data
        modal.find('#modal-cards').append(getCardHTMLFromDataID(fid, local_object));
        // Add state button to footer
        //modal.find('.modal-footer').prepend($('#' + fid + ' div.input-group-prepend:not(.btn-group)').children().clone());
        // Create card for each related entry
        related_entries.each(function () {
            addCard(modal.find('#modal-cards'), $(this).attr('data-ref-id'), local_object);
        })
        // Enable highlighting after modal closes
        enableModalCardHighlightItem(selector, fid);
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


function enableModalCardValueCopy(selector) {
    var local_attributes = config.m.filter(function (c) {
        return c.localJSONPath != undefined;
    });
    var local_labels = local_attributes.map(function (c) {
        return c.displayName;
    });
    var delegate_selector = '.text-truncate';
    $(selector)
        .on('mouseenter', delegate_selector, function() {
            var data = $(this).text();
            var label = $(this).attr('data-content-label');
            var card = $(this).parents('.card-reference');
            // Apply only to reference cards
            if (card.length) {
                var ids = getIdsFromCard(card);
                var is_safe = getLocalObjectById(idm.getObjectId(ids.fid))[config.v.statusElement] == 'safe';
                // Ignore local data, unconfigured local attributes and empty values
                if (!is_safe && local_labels.includes(label) && data != '-') {
                    var copy_btn = $('<button id="modalCardCopyButton" type="button" class="btn btn-sm btn-outline-secondary" title="Copy value of &quot;' + label + '&quot; to local object."><small class="fas fa-copy"></small></button>');
                    $(this).append(copy_btn);
                    copy_btn
                        .on('click', function (e) {
                            // Prevent fixing the card zoom, triggered by click event
                            e.stopPropagation();
                            // Copy value to local object (update)
                            var attribute_object = local_attributes.find(function (c) {
                                return c.displayName == label;
                            });
                            var local_attribute = attribute_object.localJSONPath;
                            // Use original fetched data instead of displayed value
                            var fetched_obj = fetched_objects.objects.find(function (e) {
                                return e.id === ids.ref_id;
                            })
                            var obj = fetched_obj.data;
                            var params = {};
                            params[local_attribute] = deepFind(obj, 'JSONPath', true).find(function (e) {
                                return e.key == label;
                            }).value;
                            editObject(idm.getObjectId(ids.fid), params);
                            // Update base card attribute
                            var list_item = $('#card-' + ids.fid + '_' + ids.fid).find('li[data-content-label="' + label + '"]');
                            list_item.children('small').html(data);
                            list_item.removeClass('list-group-item-secondary');
                        });
                }
            }
        })
        .on('mouseleave', delegate_selector, function () {
            $('#modalCardCopyButton').remove();
        })
}


function enableModalCardPreferredToggling(selector) {
    $(selector)
        .on('click', '.btn-card-preferred', function () {
            if (!$(this).hasClass('disabled')) {
                var card = $(this).parents('.card');
                var ids = getIdsFromCard(card);
                // 1. update local object, backend and frontend (list)
                togglePreferred(idm.getObjectId(ids.fid), ids.ref_id);
                // 2. update cards
                var card_is_active = $(this).hasClass('active');
                // remove classes on preferred object(s)
                $('.card.bg-info.text-white').removeClass('bg-info text-white');
                $('.card .active').removeClass('active');
                if (!card_is_active) {
                    // toggle classes on card
                    card.toggleClass('bg-info text-white');
                    // toggle active class on button
                    $(this).toggleClass('active');
                }
                //Fire event cardPreferredReferenceChange
                $(this).trigger('cardPreferredReferenceChange');
            }
        });
}


function enableModalcardSwitch(selector) {
    $(selector)
        // right shift
        .on('click', '.btn-card-right', function () {
            if (!$(this).hasClass('disabled')) {
                shiftCard($(this), 'right')
                //Fire event cardSwitch
                $(this).trigger('cardSwitch');
            }
        })
        // left shift
        .on('click', '.btn-card-left', function () {
            if (!$(this).hasClass('disabled')) {
                shiftCard($(this), 'left')
                //Fire event cardSwitch
                $(this).trigger('cardSwitch');
            }
        });
}


function enableModalCardDelete(selector) {
    $(selector)
        .on('click', '.btn-card-delete', function () {
            if (!$(this).hasClass('disabled')) {
                deleteCard($(this));
            }
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
    // Enable value copy
    enableModalCardValueCopy(selector);
}


function enableModalCardHighlightItem (selector, fid) {
    $(selector).one('hidden.bs.modal', function () {
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


// Init after config is loaded
$('body').on('basicAppConfigLoaded', function () {
    constructCompareModalCards('#compare-modal');
    enableModalCardEvents('#modal-cards');
});


function addCard (container, ref_id, local_object) {
    var fetched_obj = fetched_objects.objects.find(function (e) {
        return e.id === ref_id
    })
    if (fetched_obj !== undefined) {
        var obj = fetched_obj.data;
    } else {
        // Error case
        var obj = undefined;
        // Object wasn't loaded yet, do so
        // display loading state, e.g. spinner icon
        // compose API GET-URL for object with ID
        var source_url = config.a.authorityDataBaseURL + ref_id.toUpperCase();
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
                        return e.id === ref_id
                    })
                    if (fetched_obj === undefined) {
                        fetched_objects.objects.push({
                            "id": ref_id, "data": result
                        });
                        console.log('Added object ' + ref_id + ' to fetched objects.');
                    }

                    obj = result;
                }
                // Update Card
                var prepared = prepareCardData(local_object, obj, ref_id)
                $('#card-' + prepared.cardid).replaceWith(getCardHTML(prepared.cardid, prepared.id, prepared.attributes, prepared.links, prepared.additional_classes, prepared.status));
                // Load additional data from seealso webservice
                loadSeealsoResources(prepared.cardid, prepared.id);
            })
            .fail(function (result) {
                console.log('Request failed: ' + source_url);
                var obj = null;
                // Update Card
                var prepared = prepareCardData(local_object, obj, ref_id)
                $('#card-' + prepared.cardid).replaceWith(getCardHTML(prepared.cardid, prepared.id, prepared.attributes, prepared.links, prepared.additional_classes, prepared.status));
            });
    }
    var prepared = prepareCardData(local_object, obj, ref_id)
    // Add card to container (DOM)
    container.append(getCardHTML(prepared.cardid, prepared.id, prepared.attributes, prepared.links, prepared.additional_classes, prepared.status));
    // Load additional data from seealso webservice
    loadSeealsoResources(prepared.cardid, ref_id);
}


function getCardHTMLFromDataID (fid, local_object) {
    var attributes = deepFind(local_object, 'localJSONPath');
    var cardid = idm.getFrontendId(local_object.id) + '_' + fid;
    return getCardHTML(cardid, 'Own data', attributes, [], ['text-white', ' bg-dark'], local_object[config.v.statusElement]);
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
        shiftIdentifier(ids.fid, ids.ref_id, direction);
    } else if (direction == 'left' && card_to_shift_idx > 0) {
        var card_to_swap_with = card_to_shift.prev();
        // swapping cards
        card_to_swap_with.replaceWith(card_to_shift);
        card_to_swap_with.insertAfter(card_to_shift);
        // shift identifier in data and list view
        shiftIdentifier(ids.fid, ids.ref_id, direction);
    }
}
