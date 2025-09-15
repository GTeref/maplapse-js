import * as lg from "../util/legend.mjs";
import * as gj from "../util/geojson.mjs";

export class CountyMap {
    constructor(app) {
        this.app = app;
        this.map = null;
        this.mapInitialized=false;
        this.currentSourceId=null;
        this.currentLayerId=null;
        this.countyGeojson=null;
    }
    
}