import * as lg from "../util/legend.mjs";
import * as gj from "../util/geojson.mjs";

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
            style: this.getMapStyle(this.app.mapStyle),
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
}