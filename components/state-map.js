import * as lg from "../util/legend.mjs";
import * as gj from "../util/geojson.mjs";
import * as ms from "../util/style.mjs";

export class StateMap {
    constructor(app) {
        this.app = app;
        this.map = null;
        this.mapInitialized=false;
        this.currentSourceId=null;
        this.currentLayerId=null;
        this.stateGeojson=null;
    }

    async initMap(){
        if (this.mapInitialized) return;

        const mapContainer=document.getElementById('map');
        this.map = new maplibregl.Map({
            container: mapContainer,
            style: ms.mapStyles[this.app.mapStyle],
            center: [-98.5795, 39.8283], // Center of the US
            zoom: 3,
            projection:'mercator'
        });

        await new Promise((resolve) => {
            this.map.on('load', () => {
                this.mapInitialized = true;
                resolve();
            });
        });
    }

    async render(data)  {
        await this.initMap();

        const geojson=await gj.fetchStateGeoJSON();

        const processedData=this.processStateData(data, geojson);

        ms.removeExistingLayers.call(this);

        const sourceId='states';
        this.currentSourceId=sourceId;
        this.map.addSource(sourceId, {
            type: 'geojson',
            data: processedData.geojson
        });


        const colorExpression=lg.createSteppedColorExpression(processedData.popByState, processedData.minPop, processedData.maxPop, this.app.selectedDataset==='language-proficiency')

        //this vibe coded variant probably works better, need to rewrtite legend.mjs
        // const colorExpression = createSteppedColorExpression(
        //     ['get', 'population'],
        //     processedData.colorStops,
        //     '#f0f0f0'
        // );

        const layerId='state-fill';
        this.currentLayerId=layerId;
        this.map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            layout: {},
            paint: {
                'fill-color': colorExpression,
                'fill-opacity': 0.7,
            }
        });

        this.map.addLayer({
            id: 'states-border',
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': '#000',
                'line-width': 1,
                'line-opacity': 0.5
            }
        })

        ms.setupMapInteractions.call(this, layerId);
        lg.createLegend(processedData.minPop, processedData.maxPop, this.app.selectedDataset==='language-proficiency', 'state', this.app, lg.labels);



    }

    //rewrite to support generalized datasets later
    processStateData(data, geojson) {
        
        const isLanguageData = this.app.selectedDataset === 'language-proficiency';
        const rows = data.slice(1).map(row => {
            if (this.app.selectedDataset ==='race-ethnicity') {
                return {
                    state: row[4].padStart(2, '0'),
                    NAME: row[0],
                    POP: Number(row[1]),
                    RACE: row[2],
                    HISP: row[3]
                }
            } else {
                return {
                    state: row[4].padStart(2, '0'),
                    NAME: row[2],
                    POP: Number(row[0]),
                    LANG: row[1]
                }
            }
            
        });

        const popByState={}
        rows.forEach(row=> {
            popByState[row.state]=row.POP
        })

        const values=Object.values(popByState).filter(val => val > 0) //not sure if filter is acc necessary
        const minPop=Math.min(...values)    
        const maxPop=Math.max(...values)

        // const colorStops=lg.createSteppedColorExpression(popByState, minPop, maxPop, isLanguageData)

        geojson.features.forEach(feature => {
            if (feature.id) {
                feature.properties.FIPS = feature.id.padStart(2, '0');
            }
            //merge pop data to geojson features
            const stateFips=feature.properties.FIPS;
            if (popByState[stateFips]) {
                feature.properties.population=popByState[stateFips];
                const stateRow=rows.find(row => row.state===stateFips);
                if (stateRow) {
                    feature.properties.NAME=stateRow.NAME;
                }
            } else {
                feature.properties.population=0;
                feature.properties.NAME=feature.properties.NAME || "Unknown";
            }

        });

        //what are we returning
        return {
            geojson: geojson,
            popByState: popByState,
            minPop: minPop,
            maxPop: maxPop,
            featureCount: geojson.features.length
        };
    }

    destroy() {
        if (this.map) {
            this.map.remove();
            this.mapInitialized = false;
        }
    }
}