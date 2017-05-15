import mapboxgl from 'mapbox-gl';
import { EventEmitter as events } from 'events';
import { render as reactDOM } from 'react-dom';
import React from 'react';

import { getChangeset } from './getChangeset';
import { Sidebar } from './sidebar';
import { filterLayers, renderMap, selectFeature, clearFeature } from './map';

import { config } from './config';

export const cmap = new events();

window.cmap = cmap;

export function render(container, changesetId, options) {
    container.style.width = options.width || '1000px';
    container.style.height = options.height || '500px';

    options = options || {};
    options.overpassBase = options.overpassBase || config.overpassBase;
    mapboxgl.accessToken = config.mapboxAccessToken;

    container.classList.add('cmap-loading');
    if (options.data) {
        _render(container, changesetId, options.data);
    } else {
        getChangeset(changesetId, options.overpassBase)
      .then(result => _render(container, changesetId, result))
      .catch(err => {
          errorMessage(err.msg);
      });
    }

    return cmap;
}

function _render(container, changesetId, result) {
    renderHTML(container, changesetId, result);

    container.classList.remove('cmap-loading');

    var featureMap = result.featureMap;

    renderMap(false, result);

    var baseLayerSelector = document.querySelector('.cmap-map-style-section');

    baseLayerSelector.addEventListener('change', function(e) {
        var layer = e.target.value;
        if (layer === 'satellite') {
            renderMap('mapbox://styles/rasagy/cizp6lsah00ct2snu6gi3p16q', result);
        }

        if (layer === 'dark') {
            renderMap('mapbox://styles/mapbox/dark-v9', result);
        }

        if (layer === 'streets') {
            renderMap('mapbox://styles/mapbox/streets-v9', result);
        }
    });

    cmap.on('selectFeature', function(geometryType, featureId) {
        if (geometryType && featureId) {
            selectFeature(featureMap[featureId][0], featureMap);
        }
    });

    cmap.on('clearFeature', function() {
        clearFeature();
    });
}

// Recursively adds html elements
function elt(name, attributes) {
    var node = document.createElement(name);
    if (attributes) {
        for (var attr in attributes)
            if (attributes.hasOwnProperty(attr))
                node.setAttribute(attr, attributes[attr]);
    }
    for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];
        if (typeof child == 'string') child = document.createTextNode(child);
        node.appendChild(child);
    }
    return node;
}

// Sets initial markup for info box and map container
function renderHTML(container, changesetId, result) {
    var info = document.createElement('div');

    container.classList.add('cmap-container');

  // Add `tagsCount` to feature properties
    result.geojson.features.forEach(feature => {
        var tags = feature.properties.tags || {};
        feature.properties.tagsCount = Object.keys(tags).length;
    });

    container.appendChild(info);
    reactDOM(
    <div>
      <div className="cmap-map" />

      <div className="cmap-diff" style={{ display: 'none' }}>
        <div
          className="cmap-diff-tags cmap-scroll-styled"
          style={{ display: 'none' }}
        />
        <div
          className="cmap-diff-metadata cmap-scroll-styled"
          style={{ display: 'none' }}
        />
      </div>
      <Sidebar
        result={result}
        changesetId={changesetId}
        filterLayers={filterLayers}
      />
    </div>,
    info
  );
}

function errorMessage(message) {
    message = message || 'An unexpected error occured';
    document.querySelector('.cmap-info').innerHTML = message;
    document.querySelector('.cmap-sidebar').style.display = 'block';
    document.querySelector('.cmap-layer-selector').style.display = 'none';
    document.querySelector('.cmap-type-selector').style.display = 'none';
}