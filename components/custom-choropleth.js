import * as db from "../util/db.mjs";
import * as lg from "../util/legend.mjs";
import * as ms from "../util/style.mjs";

export class CustomChoroplethController {
    
    constructor(app) {
        this.app = app;
        this.map = null;
        this.mapInitialized = false;
        this.currentSourceId = null;
        this.currentLayerId = null;
    }

    async initMap() {
        if (this.mapInitialized) return;

        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Initialize MapLibre map
        this.map = new maplibregl.Map({
            container: 'map',
            style: ms.mapStyles[this.app.mapStyle],
            center: [-98, 39.5], // US center
            zoom: 4
        });

        await new Promise(resolve => {
            this.map.on('load', resolve);
        });

        this.mapInitialized = true;
        console.log('Custom choropleth map initialized');
    }

    async generateChoropleth() {
        const { tableUrl, geometryUrl, tableIdField, geometryIdField, tableNumericField } = this.app.customData;

        if (!tableUrl || !geometryUrl || !tableIdField || !geometryIdField || !tableNumericField) {
            console.warn('Missing required fields for choropleth generation');
            return;
        }

        try {
            console.log('Fetching data for custom choropleth...');
            
            // Fetch both data sources
            const [tableData, geometryData] = await Promise.all([
                this.fetchJsonData(tableUrl),
                this.fetchJsonData(geometryUrl)
            ]);

            // Process and join the data
            const processedData = this.joinDataToGeometry(tableData, geometryData);
            
            // Generate color scheme
            const coloredData = this.applyColorScheme(processedData);
            
            // Render on map
            await this.renderChoropleth(coloredData);
            
            console.log('Custom choropleth generated successfully');
            
        } catch (error) {
            console.error('Error generating custom choropleth:', error);
        }
    }

    async fetchJsonData(url) {
        console.log('Fetching JSON from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }

    joinDataToGeometry(tableData, geometryData) {
        const { tableIdField, geometryIdField, tableNumericField } = this.app.customData;
        
        // Create lookup map from table data
        const dataLookup = {};
        tableData.forEach(row => {
            const id = row[tableIdField];
            const value = parseFloat(row[tableNumericField]);
            if (id && !isNaN(value)) {
                dataLookup[id] = value;
            }
        });

        // Join to geometry features
        geometryData.features.forEach(feature => {
            const geoId = feature.properties[geometryIdField];
            if (geoId && dataLookup[geoId] !== undefined) {
                feature.properties.choropleth_value = dataLookup[geoId];
            } else {
                feature.properties.choropleth_value = null;
            }
        });

        return geometryData;
    }

    applyColorScheme(geojsonData) {
        const values = geojsonData.features
            .map(f => f.properties.choropleth_value)
            .filter(v => v !== null && !isNaN(v));

        if (values.length === 0) {
            console.warn('No valid numeric values found for choropleth');
            return geojsonData;
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = this.app.customData.binCount;
        
        // Create bins
        const bins = this.createBins(min, max, binCount);
        const colors = this.getColorScheme(this.app.customData.colorScheme, binCount);

        // Apply colors to features
        geojsonData.features.forEach(feature => {
            const value = feature.properties.choropleth_value;
            if (value !== null && !isNaN(value)) {
                const binIndex = this.getBinIndex(value, bins);
                feature.properties.choropleth_color = colors[binIndex];
                feature.properties.choropleth_bin = binIndex;
            } else {
                feature.properties.choropleth_color = '#cccccc'; // No data color
                feature.properties.choropleth_bin = -1;
            }
        });

        // Store for legend
        this.choroplethData = { min, max, bins, colors, binCount };
        
        return geojsonData;
    }

    createBins(min, max, count) {
        const bins = [];
        const step = (max - min) / count;
        
        for (let i = 0; i <= count; i++) {
            bins.push(min + (step * i));
        }
        
        return bins;
    }

    getBinIndex(value, bins) {
        for (let i = 0; i < bins.length - 1; i++) {
            if (value >= bins[i] && value < bins[i + 1]) {
                return i;
            }
        }
        return bins.length - 2; // Last bin for max value
    }

    getColorScheme(scheme, count) {
        const schemes = {
            'Spectral': ['#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6'],
            'Reds': ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26'],
            'Blues': ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd'],
            'Greens': ['#edf8e9', '#c7e9c0', '#a1d99b', '#74c476', '#31a354']
        };

        const baseColors = schemes[scheme] || schemes['Spectral'];
        
        // Interpolate to get exact count needed
        return this.interpolateColors(baseColors, count);
    }

    interpolateColors(colors, count) {
        if (count <= colors.length) {
            return colors.slice(0, count);
        }
        
        const result = [];
        const step = (colors.length - 1) / (count - 1);
        
        for (let i = 0; i < count; i++) {
            const index = Math.floor(i * step);
            result.push(colors[Math.min(index, colors.length - 1)]);
        }
        
        return result;
    }

    async renderChoropleth(geojsonData) {
        await this.initMap();
        
        // Remove existing layers
        if (this.currentLayerId && this.map.getLayer(this.currentLayerId)) {
            this.map.removeLayer(this.currentLayerId);
        }
        if (this.currentSourceId && this.map.getSource(this.currentSourceId)) {
            this.map.removeSource(this.currentSourceId);
        }

        // Add new source and layer
        const sourceId = 'choropleth-source';
        const layerId = 'choropleth-layer';
        
        this.map.addSource(sourceId, {
            type: 'geojson',
            data: geojsonData
        });

        this.map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': ['get', 'choropleth_color'],
                'fill-opacity': 0.8,
                'fill-outline-color': '#ffffff'
            }
        });

        this.currentSourceId = sourceId;
        this.currentLayerId = layerId;

        // Setup interactions
        this.setupInteractions(layerId);
        
        // Update legend
        // this.updateLegend();
        
        // Fit bounds
        const bounds = new maplibregl.LngLatBounds();
        geojsonData.features.forEach(feature => {
            if (feature.geometry.coordinates) {
                // Add bounds calculation based on geometry
                this.addFeatureToBounds(feature, bounds);
            }
        });
        this.map.fitBounds(bounds, { padding: 20 });
    }

    addFeatureToBounds(feature, bounds) {
        // Simple bounds calculation - you might want to make this more robust
        if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach(coord => {
                bounds.extend(coord);
            });
        } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygon => {
                polygon[0].forEach(coord => {
                    bounds.extend(coord);
                });
            });
        }
    }

    setupInteractions(layerId) {
        let popup = null;

        this.map.on('mouseenter', layerId, (e) => {
            this.map.getCanvas().style.cursor = 'pointer';
            
            if (e.features.length > 0) {
                const feature = e.features[0];
                const props = feature.properties;

                if (popup) {
                    popup.remove();
                    popup = null;
                }
                
                popup = new maplibregl.Popup({
                    closeButton: false,
                    closeOnClick: false
                })
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div class="map-tooltip">
                        <h3>${props[this.app.customData.geometryIdField] || 'Unknown'}</h3>
                        <p>${this.app.customData.tableNumericField}: ${props.choropleth_value?.toLocaleString() || 'No data'}</p>
                    </div>
                `)
                .addTo(this.map);
            }
        });

        this.map.on('mouseleave', layerId, () => {
            this.map.getCanvas().style.cursor = '';
            if (popup) {
                popup.remove();
                popup = null;
            }
        });
    }

    //update legend function?
    
}