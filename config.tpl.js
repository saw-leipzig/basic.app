var config = {
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
            "descriptionElement": "alternateName",
            "statusElement": "status",
            "identifierElement": "identifier",
            "identifierAbbreviation": "DNB",
            "identifierBaseURL": "http://d-nb.info/gnd/",
            "aliasElement": "alternateName",
            "pseudonymElement": "pseudonym"
        },
        "places": {
            "titleElement": "name",
            "descriptionElement": "alternateName",
            "statusElement": "status",
            "identifierElement": "identifier",
            "identifierAbbreviation": "GEO",
            "identifierBaseURL": "http://www.geonames.org/",
            "aliasElement": "alternateName"
        },
        "organisations":{
            "titleElement": "name",
            "descriptionElement": "alternateName",
            "statusElement": "status",
            "identifierElement": "identifier",
            "identifierAbbreviation": "DNB",
            "identifierBaseURL": "http://d-nb.info/gnd/",
            "aliasElement": "alternateName"
        }

    },
    "status": {
        "available": [
            "safe",
            "unsafe",
            "unavailable",
            "unchecked",
            "duplicates",
            "needs-correction"
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
                "localJSONPath": "pseudonym",
                "multiple": true
            }, {
                "displayName": "Alternate Names",
                "JSONPath": "variantName",
                "localJSONPath": "alternateName",
                "multiple": true
            }, {
                "displayName": "Gender",
                "JSONPath": "gender.label",
                "localJSONPath": "gender"
            }, {
                "displayName": "Date of Birth",
                "JSONPath": "dateOfBirth",
                "localJSONPath": "birthDate"
            }, {
                "displayName": "Place of Birth",
                "JSONPath": "placeOfBirth.preferredName",
                "localJSONPath": "birthPlace"
            }, {
                "displayName": "Date of Death",
                "JSONPath": "dateOfDeath",
                "localJSONPath": "deathDate"
            }, {
                "displayName": "Place of Death",
                "JSONPath": "placeOfDeath.preferredName",
                "localJSONPath": "deathPlace"
            }, {
                "displayName": "Period of Activity",
                "JSONPath": "periodOfActivity",
                "localJSONPath": "periodOfActivity"
            }, {
                "displayName": "Place of Activity",
                "JSONPath": "placeOfActivity.preferredName",
                "localJSONPath": "placeOfActivity"
            }, {
                "displayName": "Profession",
                "JSONPath": "professionOrOccupation.preferredName",
                "localJSONPath": "hasOccupation",
                "multiple": true
            }, {
                "displayName": "Affiliation",
                "JSONPath": "affiliation.preferredName",
                "localJSONPath": "affiliation",
                "multiple": true
            }, {
                "displayName": "Further Information",
                "JSONPath": "biographicalOrHistoricalInformation",
                "localJSONPath": "description"
            }, {
                "displayName": "Date of Baptism",
                "localJSONPath": "baptismDate"
            }, {
                "displayName": "Place of Burial",
                "localJSONPath": "burialPlace"
            }
        ],
        "places":[ {
                "displayName": "Name",
                "JSONPath": "name",
                "localJSONPath": "name"
            },{
                "displayName": "Alternate Names",
                "JSONPath": "alternateNames.name",
                "localJSONPath": "alternateName",
                "multiple": true
            },{
                "displayName": "Latitude",
                "JSONPath": "lat",
                "localJSONPath": "latitude"
            },{
                "displayName": "Longitude",
                "JSONPath": "lng",
                "localJSONPath": "longitude"
            },{
                "displayName": "Class of Place",
                "JSONPath": "fclName"
            },{
                "displayName": "Code of Place",
                "JSONPath": "fcode"
            },{
                "displayName": "Country",
                "JSONPath": "countryName",
                "localJSONPath": "addressCountry"
            },{
                "displayName": "Code of Continent",
                "JSONPath": "continentCode",
                "localJSONPath": "continentCode"
            }
        ],
        "organisations":[ {
                "displayName": "Name",
                "JSONPath": "preferredName",
                "localJSONPath": "name"
            },{
                "displayName": "Alternate Names",
                "JSONPath": "variantName",
                "localJSONPath": "alternateName",
                "multiple": true
            },{
                "displayName": "Location",
                "JSONPath": "placeOfBusiness.preferredName",
                "localJSONPath": "location"
            },{
                "displayName": "Associated Place",
                "JSONPath": "associatedPlace.preferredName"
            },{
                "displayName": "Type of Organization",
                "JSONPath": "isA.preferredName",
                "localJSONPath": "additionalType",
                "multiple": true
            },{
                "displayName": "Predecessor",
                "JSONPath": "predecessor.preferredName",
                "localJSONPath": "predecessor"
            },{
                "displayName": "Successor",
                "JSONPath": "successor.preferredName",
                "localJSONPath": "successor"
            }
        ]
    },
    "map": {
        "baseTileURL": "https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
        "baseTileAttribution": "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a>",
        "baseTileMaxZoom": 18
    }
};
