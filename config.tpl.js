var config = {
    "app": {
        "version": "1.0.7",
        "config": {
            "use_corsanywhere": false,
            "footer": {
                "logoURL": "http://www.example.com",
                "logoFileName": "logo.png",
                "logoAlternativeText": "Open example.com in new window.",
                "text": "ba[sic?] - better authorities [search, identify, connect]"
            },
            "api": {
                "persons": {
                    "JSONContainer": "person",
                    "authorityDataBaseURL": "http://hub.culturegraph.org/entityfacts/"
                },
                "places": {
                    "JSONContainer": "place",
                    "authorityDataBaseURL": "http://api.geonames.org/getJSON?formatted=true&username=demo&style=full&geonameId=",
                    "geo_url_suggest": "http://api.geonames.org/searchJSON?q=",
                    "geo_url_params": {
                        "username": "demo",
                        "maxRows": "10",
                        "featureClass": "P"
                    }
                },
                "organisations": {
                    "JSONContainer" : "organisation",
                    "authorityDataBaseURL": "http://hub.culturegraph.org/entityfacts/"
                }
            },
            "view": {
                "persons": {
                    "titleElement": "name",
                    "descriptionElement": "description",
                    "statusElement": "status",
                    "identifierElement": "ref",
                    "identifierAbbreviation": "DNB",
                    "identifierBaseURL": "http://d-nb.info/gnd/",
                    "aliasElement": "alias"
                },
                "places": {
                    "titleElement": "name",
                    "descriptionElement": "description",
                    "statusElement": "status",
                    "identifierElement": "ref",
                    "identifierAbbreviation": "GEO",
                    "identifierBaseURL": "http://www.geonames.org/",
                    "aliasElement": "alias"
                },
                "organisations":{
                    "titleElement": "name",
                    "descriptionElement": "description",
                    "statusElement": "status",
                    "identifierElement": "ref",
                    "identifierAbbreviation": "DNB",
                    "identifierBaseURL": "http://d-nb.info/gnd/",
                    "aliasElement": "alias"
                }

            },
            "status": {
                "available": [
                    "safe",
                    "unsafe",
                    "unavailable",
                    "unchecked"
                ],
                "default": "unchecked"
            },
            "mapping": {
                "persons":[ {
                        "displayName": "Name",
                        "JSONPath": "preferredName",
                        "localJSONPath": "name"
                    }, {
                        "displayName": "Pseudonym",
                        "JSONPath": "pseudonym.preferredName",
                        "localJSONPath": "pseudonym"
                    }, {
                        "displayName": "Namensvariante",
                        "JSONPath": "variantName",
                        "localJSONPath": "alias",
                        "multiple": true
                    }, {
                        "displayName": "Geschlecht",
                        "JSONPath": "gender.label"
                    }, {
                        "displayName": "Geburtsdatum",
                        "JSONPath": "dateOfBirth",
                        "localJSONPath": "birth_date"
                    }, {
                        "displayName": "Geburtsort",
                        "JSONPath": "placeOfBirth.preferredName",
                        "localJSONPath": "birth_place"
                    }, {
                        "displayName": "Sterbedatum",
                        "JSONPath": "dateOfDeath",
                        "localJSONPath": "death_date"
                    }, {
                        "displayName": "Sterbeort",
                        "JSONPath": "placeOfDeath.preferredName",
                        "localJSONPath": "death_place"
                    }, {
                        "displayName": "Wirkungszeit",
                        "JSONPath": "periodOfActivity"
                    }, {
                        "displayName": "Wirkungsort",
                        "JSONPath": "placeOfActivity.preferredName"
                    }, {
                        "displayName": "Beruf(e)",
                        "JSONPath": "professionOrOccupation.preferredName"
                    }, {
                        "displayName": "Organisation",
                        "JSONPath": "affiliation.preferredName"
                    }, {
                        "displayName": "Weitere Angaben",
                        "JSONPath": "biographicalOrHistoricalInformation"
                    }, {
                        "displayName": "Taufdatum",
                        "localJSONPath": "baptism_date"
                    }
                ],
                "places":[ {
                        "displayName": "Name",
                        "JSONPath": "name",
                        "localJSONPath": "name"
                    },{
                        "displayName": "Namensvariante",
                        "JSONPath": "alternateNames.name",
                        "localJSONPath": "alias",
                        "multiple": true
                    },{
                        "displayName": "Breitengrad",
                        "JSONPath": "lat"
                    },{
                        "displayName": "Längengrad",
                        "JSONPath": "lng"
                    },{
                        "displayName": "Art der Stätte",
                        "JSONPath": "fclName"
                    },{
                        "displayName": "Code der Stätte",
                        "JSONPath": "fcode"
                    },{
                        "displayName": "Land",
                        "JSONPath": "countryName"
                    },{
                        "displayName": "Kontinent",
                        "JSONPath": "continentCode"
                    }
                ],
                "organisations":[ {
                        "displayName": "Name",
                        "JSONPath": "preferredName",
                        "localJSONPath": "name"
                    },{
                        "displayName": "Namensvariante",
                        "JSONPath": "variantName",
                        "localJSONPath": "alias",
                        "multiple": true
                    },{
                        "displayName": "Ort",
                        "JSONPath": "placeOfBusiness.preferredName"
                    },{
                        "displayName": "Wirkungsraum",
                        "JSONPath": "associatedPlace.preferredName"
                    },{
                        "displayName": "Art der Organisation",
                        "JSONPath": "isA.preferredName"
                    },{
                        "displayName": "Vorgänger Organisation",
                        "JSONPath": "predecessor.preferredName"
                    },{
                        "displayName": "Nachfolger Organisation",
                        "JSONPath": "successor.preferredName"
                    }
                ]
            },
            "map": {
                "baseTileURL": "https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
                "baseTileAttribution": "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a>",
                "baseTileMaxZoom": 18
            }
        }
    }
};
