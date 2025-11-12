import * as db from "../util/db.mjs";
import * as lg from "../util/legend.mjs";
import * as ms from "../util/style.mjs";
import * as ju from "../util/json-utils.mjs";

export class CustomChoroplethController {
    
    constructor(app) {
        this.app = app;
        this.map = null;
        this.mapInitialized = false;
        this.currentSourceId = null;
        this.currentLayerId = null;

        this.STD_FORMAT={
            table:{
                idField: 'id',
                valueField: 'value'
            },
            geojson:{
                type: 'FeatureCollection',
                idField: 'id'
            }
        }
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

    // standardizeData(rawData, type) {
    //     if (type === 'table') {
    //         return this.standardizeTableData(rawData);
    //     } else if (type === 'geojson') {
    //         return this.standardizeGeoJsonData(rawData);
    //     }
    //     throw new Error(`Unknown data type: ${type}`);
    // }

    // standardizeTableData(rawData) {
    //     // Handle common JSON structures dynamically
    //     let dataArray = [];
    //     let detectedIdField=null;
    //     let detectedValueField=null;
        
    //     //1. extract array
    //     if (Array.isArray(rawData)) {
    //         // Check if it's an array of arrays (e.g., tabular data like Census API)
    //         if (rawData.length > 0 && Array.isArray(rawData[0])) {
    //             // Assume first row is headers
    //             const headers = rawData[0];
    //             dataArray = rawData.slice(1).map(row => {
    //                 const obj = {};
    //                 headers.forEach((header, index) => {
    //                     obj[header] = row[index];
    //                 });
    //                 return obj;
    //             });
    //             console.log('Converted array-of-arrays to array of objects using headers:', headers);
    //         } else {
    //             // Already an array of objects or primitives
    //             dataArray = rawData;
    //         }
    //     } else if (typeof rawData === 'object' && rawData !== null) {
    //         // Check for common nested keys
    //         const possibleKeys = ['data', 'results', 'items', 'records', 'features']; // Add more if needed, but keep dynamic
    //         for (const key of possibleKeys) {
    //             if (Array.isArray(rawData[key])) {
    //                 dataArray = rawData[key];
    //                 console.log(`Extracted data from nested key: ${key}`);
    //                 break;
    //             }
    //         }
    //         if (dataArray.length === 0) {
    //             // If no array found, treat the object as a single record or warn
    //             dataArray = [rawData];
    //             console.warn('Table data is not an array; treating as single record. Verify field mappings.');
    //         }
    //     }

    //     //2. auto-detect value and id fields
    //     if (dataArray.length > 0) {
    //         const sample = dataArray[0];
    //         const fields = Object.keys(sample);

    //         //there has to be a way to do these more dynamically....user input maybe?
    //         const idPatterns = ['id', 'ID', 'fips', 'FIPS', 'geoid', 'GEOID', 'code', 'state', 'county'];
    //         detectedIdField = this.findFieldByPatterns(fields, idPatterns) || 
    //                         this.app.customData.tableIdField ||
    //                         fields[0];
            
    //         // Detect numeric value field
    //         const numericFields = fields.filter(field => {
    //             const val = sample[field];
    //             return !isNaN(parseFloat(val)) && isFinite(val);
    //         });
            
    //         const valuePatterns = ['value', 'population', 'pop', 'count', 'total', 'amount', 'POP', 'EST'];
    //         detectedValueField = this.findFieldByPatterns(numericFields, valuePatterns) ||
    //                             this.app.customData.tableNumericField ||
    //                             numericFields[0];
            
    //         console.log(`Auto-detected ID field: '${detectedIdField}'`);
    //         console.log(`Auto-detected value field: '${detectedValueField}'`);
    //     }

    //     //3. transform to std format
    //     const standardized=dataArray.map(row=> {
    //         const id = this.coerceToString(row[detectedIdField]);
    //         const value= parseFloat(row[detectedValueField]);
    //         return {
    //             // when would std_format ever be useful?
    //             // [this.STD_FORMAT.table.idField]: id,
    //             // [this.STD_FORMAT.table.valueField]: isNaN(value) ? null : value
    //             id: id,
    //             value: isNaN(value) ? null : value,
    //             _original: row
    //         };
    //     }).filter(row => row.id !== null && row.id !== undefined);

    //     this.detectedFields = {
    //         table: { idField: detectedIdField, valueField: detectedValueField }
    //     };
        
    //     return standardized;
    //     // else {
    //     //     throw new Error('Table data must be an array or object with an array property.');
    //     // }
        
    //     // Ensure each item is an object and validate presence of user-specified fields
    //     // const { tableIdField, tableNumericField } = this.app.customData;
    //     // dataArray = dataArray.filter(item => typeof item === 'object' && item !== null);
        
    //     // // Optional: Log or warn about missing fields
    //     // const missingFields = dataArray.some(item => !(tableIdField in item) || !(tableNumericField in item));
    //     // if (missingFields) {
    //     //     console.warn(`Some records are missing specified fields (${tableIdField} or ${tableNumericField}). They will be skipped.`);
    //     // }
        
    //     // return dataArray;
    // }

    // standardizeGeoJsonData(rawData) {
    //     // Basic GeoJSON validation (GeoJSON spec: must have 'type' and 'features')
    //     if (!rawData || typeof rawData !== 'object' || rawData.type !== 'FeatureCollection' || !Array.isArray(rawData.features)) {
    //         throw new Error('Invalid GeoJSON: Must be a FeatureCollection with a features array.');
    //     }
        
    //     // Ensure features are valid and have properties
    //     rawData.features = rawData.features.filter(feature => 
    //         feature && feature.type === 'Feature' && typeof feature.properties === 'object'
    //     );
        
    //     // Optional: Warn about missing geometry or user-specified ID field
    //     const { geometryIdField } = this.app.customData;
    //     const missingIds = rawData.features.some(f => !(geometryIdField in f.properties));
    //     if (missingIds) {
    //         console.warn(`Some features are missing the specified ID field (${geometryIdField}). They will not join properly.`);
    //     }
        
    //     return rawData;
    // }

    // //find field matching common patterns
    // findFieldByPatterns(fields, patterns) {
    //     for (const pattern of patterns) {
    //         const match = fields.find(f => 
    //             f.toLowerCase() === pattern.toLowerCase() ||
    //             f.toLowerCase().includes(pattern.toLowerCase())
    //         );
    //         if (match) return match;
    //     }
    //     return null;
    // }

    // //coerce vals to string
    // coerceToString(value) {
    //     if (value === null || value === undefined) return null;
        
    //     if (typeof value === 'number') {
    //         return value.toString();
    //     }
    //     return String(value).trim();
    // }

    async processData() {
        
        try{
            //fetch data from URLs
            const [rawTableData, rawGeoData] = await Promise.all([
                fetch(this.app.customData.tableUrl).then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch table data: ${res.statusText}`);
                    return res.json();
                }),
                fetch(this.app.customData.geometryUrl).then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch geometry data: ${res.statusText}`);
                    return res.json();
                })
            ]);

            const tableArray = ju.extractDataArray(rawTableData);
            const geoJson = ju.extractGeometry(rawGeoData);

            //autodetect later

            const normalizedTable = ju.normalizeTable(tableArray, {
                idField: this.app.customData.tableIdField,
                valueField: this.app.customData.tableNumericField
            });
            const normalizedGeo = ju.normalizeGeometry(geoJson, {
                idField: this.app.customData.geometryIdField
            });

            const joinedData = ju.joinData(normalizedTable, normalizedGeo);

            return joinedData
        } catch (error) {
            console.error('Error processing data:', error);
        }
    }

    async generateChoropleth() {
        const { tableUrl, geometryUrl, tableIdField, geometryIdField, tableNumericField } = this.app.customData;
        
        //require ALL fields for now
        if (!tableUrl || !geometryUrl || !tableIdField || !geometryIdField || !tableNumericField) {
            console.warn('Missing required fields for choropleth generation');
            return;
        }

        try {
            const joinedData = await this.processData();

            this.app.customData.processedData=this.extractTableData(joinedData);
            
            // Generate color scheme
            const coloredData = this.applyColorScheme(joinedData);

            // Render on map
            await this.renderChoropleth(coloredData);
            
            console.log('Custom choropleth generated successfully');
            
        } catch (error) {
            console.error('Error generating custom choropleth:', error);
        }
    }

    extractTableData(geojsonData) {
        const nameField = this.app.customData.geometryNameField || this.app.customData.geometryIdField;
        
        return geojsonData.features.map(feature => ({
            id: feature.properties._normalized_id,
            name: feature.properties[nameField],
            value: feature.properties.choropleth_value
        })).sort((a, b) => (b.value || 0) - (a.value || 0)); // Sort by value descending
    }

    // async fetchJsonData(url) {
    //     console.log('Fetching JSON from:', url);
    //     const response = await fetch(url);
        
    //     if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //     }
        
    //     const rawData=await response.json();
    //     const type= url.endsWith('.geojson') || url.includes('geojson') ? 'geojson' : 'table';
    //     return this.standardizeData(rawData, type);
    // }

    // joinDataToGeometry(tableData, geometryData) {
    //     const { tableIdField, geometryIdField, tableNumericField } = this.app.customData;

        
    //     // Create lookup map from table data
    //     const dataLookup = {};
    //     tableData.forEach(row => {
    //         const id = row[tableIdField];
    //         const value = parseFloat(row[tableNumericField]);
    //         if (id && !isNaN(value)) {
    //             dataLookup[id] = value;
    //         }
    //     });

    //     // Join to geometry features
    //     geometryData.features.forEach(feature => {
    //         const geoId = feature.properties[geometryIdField] || feature[geometryIdField];
    //         if (geoId && dataLookup[geoId] !== undefined) {
    //             feature.properties.choropleth_value = dataLookup[geoId];
    //         } else {
    //             feature.properties.choropleth_value = null;
    //         }
    //     });

    //     return geometryData;
    // }

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
        let currentFeatureId = null;

        this.map.on('mouseenter', layerId, (e) => {
            this.map.getCanvas().style.cursor = 'pointer';
            
            if (e.features.length > 0) {
                const feature = e.features[0];
                const props = feature.properties;
                const featureId=props._normalized_id

                const nameField=this.app.customData.geometryNameField || this.app.customData.geometryIdField;
                const displayName=props[nameField] || props._normalized_id || 'Unknown';

                const displayValue = props.choropleth_value !== null && props.choropleth_value !== undefined
                ? props.choropleth_value.toLocaleString()
                : 'No data';

                // Create or update popup
                if (!popup) {
                    popup = new maplibregl.Popup({
                        closeButton: false,
                        closeOnClick: false
                    })
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <div class="map-tooltip">
                            <h3>${displayName}</h3>
                            <p><strong>${this.app.customData.title || this.app.customData.tableNumericField}:</strong> ${displayValue}</p>
                        </div>
                    `)
                    .addTo(this.map);
                    
                    currentFeatureId = featureId;
                } else {
                    // Update popup content if feature changed, otherwise just move it
                    if (currentFeatureId !== featureId) {
                        popup.setHTML(`
                            <div class="map-tooltip">
                                <h3>${displayName}</h3>
                                <p><strong>${this.app.customData.title || this.app.customData.tableNumericField}:</strong> ${displayValue}</p>
                            </div>
                        `);
                        currentFeatureId = featureId;
                    }
                    popup.setLngLat(e.lngLat);
                }
            }
        });

        this.map.on('mouseleave', layerId, () => {
            this.map.getCanvas().style.cursor = '';
            if (popup) {
                popup.remove();
                popup = null;
                currentFeatureId=null;
            }
        });
    }

    getDetectedFields() {
        return this.detectedFields;
    }

    //allow users to override detected fields
    applyUserOverrides(overrides) {
        if (overrides.tableIdField) {
            this.app.customData.tableIdField = overrides.tableIdField;
        }
        if (overrides.tableNumericField) {
            this.app.customData.tableNumericField = overrides.tableNumericField;
        }
        if (overrides.geometryIdField) {
            this.app.customData.geometryIdField = overrides.geometryIdField;
        }
        console.log('Applied user overrides:', overrides);
    }

    //update legend function?
    
}