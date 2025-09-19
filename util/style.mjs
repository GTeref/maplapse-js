export const mapStyles = {
    // Protomaps
    // light: 'https://protomaps.github.io/basemaps-assets/styles/v2/light.json',
    // dark: 'https://protomaps.github.io/basemaps-assets/styles/v2/dark.json',
    
    // MapLibre demo
    demo: 'https://demotiles.maplibre.org/style.json',
    
    // OSM
    osm: {
        "version": 8,
        "sources": {
            "osm": {
                "type": "raster",
                "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                "tileSize": 256,
                "attribution": "© OpenStreetMap contributors"
            }
        },
        "layers": [{
            "id": "osm",
            "type": "raster",
            "source": "osm"
        }]
    },

    // Carto light
    light: {
        "version": 8,
        "sources": {
            "carto-light": {
                "type": "raster",
                "tiles": [
                    "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                    "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                    "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
                ],
                "tileSize": 256,
                "attribution": "© CARTO, © OpenStreetMap contributors"
            }
        },
        "layers": [{
            "id": "carto-light",
            "type": "raster",
            "source": "carto-light"
        }]
    },
    
    // Carto dark
    dark: {
        "version": 8,
        "sources": {
            "carto-dark": {
                "type": "raster",
                "tiles": [
                    "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
                    "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
                    "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                ],
                "tileSize": 256,
                "attribution": "© CARTO, © OpenStreetMap contributors"
            }
        },
        "layers": [{
            "id": "carto-dark",
            "type": "raster",
            "source": "carto-dark"
        }]
    }
}

function setupMapInteractions(layerId) {
    this.map.on('mouseenter', layerId, (e) => {
        this.map.getCanvas().style.cursor = 'pointer';
        
        if (e.features.length > 0) {
            const feature = e.features[0];
            const props = feature.properties;
            
            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false
            })
            .setLngLat(e.lngLat)
            .setHTML(`
                <div class="map-tooltip">
                    <h3>${props.name}</h3>
                    <p>Population: ${props.population?.toLocaleString() || 'No data'}</p>
                    <p>State Code: ${props.fips}</p>
                </div>
            `)
            .addTo(this.map);
            
            this.currentPopup = popup;
        }
    });

    this.map.on('mouseleave', layerId, () => {
        this.map.getCanvas().style.cursor = '';
        if (this.currentPopup) {
            this.currentPopup.remove();
            this.currentPopup = null;
        }
    });
}

function updateStyle(styleName) {
    if (!this.mapInitialized) return;
    
    this.map.setStyle(this.getMapStyle(styleName));
    
    this.map.once('styledata', () => {
        if (this.currentSourceId && this.app.selectedDataset) {
            this.app.mapController.fetchAndUpdateMap();
        }
    });
}

function removeExistingLayers() {
    if (!this.mapInitialized) return;
    // modify for county layers later
    const layersToRemove = ['state-fill', 'states-border'];
    layersToRemove.forEach(layerId => {
        if (this.map.getLayer(layerId)) {
            this.map.removeLayer(layerId);
        }
    });

    if (this.currentSourceId && this.map.getSource(this.currentSourceId)) {
        this.map.removeSource(this.currentSourceId);
    }
}

export { setupMapInteractions, updateStyle, removeExistingLayers }