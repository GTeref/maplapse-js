import * as db from "../util/db.mjs";
import * as lg from "../util/legend.mjs";
import * as gj from "../util/geojson.mjs";

export class MapController {
    constructor(app) {
        this.app = app;
        this.countyMap=null
        this.stateMap=null
        // county geojson parameter?
    }

    async fetchAndUpdateMap() {
        if (!this.app.selectedDataset){
            console.warn('No dataset selected');
            return;
        }

        const isCountyLevel = this.app.geographyLevel === 'county';
        const cacheKey = this.generateCacheKey();

        // Check cache first
        const cachedData = await db.getCache(cacheKey);
        if (cachedData) {
            console.log('Using cached data for', cacheKey);
            return ;
        }

        const data=await this.fetchCensusData()
        await setCache(cacheKey, data)

        return this.renderWithData(data, isCountyLevel);
    }

    async renderWithData(data, isCountyLevel) {
        if (isCountyLevel) {
            countyGeojson=await gj.fetchCountyGeoJSON()
            if (!this.countyMap){
                // new CountyMap object

            }
            //countyMap.render
        } else {
            stateGeojson=await gj.fetchStateGeoJSON()
            if (!this.stateMap){
                // new StateMap object
            }
            //stateMap.render
        }
    }



    generateCacheKey() {
        return `${this.app.selectedDataset}_${this.app.geographyLevel}_${this.app.currentYear}_${this.app.selectedRace}_${this.app.selectedHispanic}_${this.app.selectedLanguage}`;
    }

    async fetchCensusData() {
        const hispParam = this.app.selectedDataset === 'race-ethnicity' ? `&HISP=${state.selectedHispanic}` : '';
        const raceParam = this.app.selectedDataset === 'race-ethnicity' ? `&RACE=${state.selectedRace}` : '';
        const langParam=this.app.selectedDataset==='language-proficiency' ? `&LAN7=${state.selectedLanguage}`: ''
    }
}