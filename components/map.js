import * as db from "../util/db.mjs";
import * as lg from "../util/legend.mjs";
import * as gj from "../util/geojson.mjs";
import { StateMap } from "./state-map.js";

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
        let data;
        const cachedData = await db.getCache(cacheKey);
        if (cachedData) {
            console.log('Using cached data for', cacheKey);
            data=cachedData
        } else {
            try{
                data=await this.fetchCensusData()
                await db.setCache(cacheKey, data)

            } catch (error) {
                console.error('Error fetching data:', error);
                return;
            }
        }

        try {
            // const data=await this.fetchCensusData()
            // await db.setCache(cacheKey, data)

            if (this.app.geographyLevel==='state'){
                if (!this.stateMap) this.stateMap=new StateMap(this.app);
                await this.stateMap.render(data);
                console.log('Rendered state-level map');
            }
        } catch (error) {
            console.error('Error fetching or rendering data:', error);
        }
    }



    generateCacheKey() {
        return `${this.app.geographyLevel}_${this.app.selectedDataset}_${this.app.currentYear}_${this.app.selectedRace}_${this.app.selectedHispanic}_${this.app.selectedLanguage}`;
    }

    async fetchCensusData() {
        const hispParam = this.app.selectedDataset === 'race-ethnicity' ? `&HISP=${this.app.selectedHispanic}` : '';
        const raceParam = this.app.selectedDataset === 'race-ethnicity' ? `&RACE=${this.app.selectedRace}` : '';
        const langParam=this.app.selectedDataset==='language-proficiency' ? `&LAN7=${this.app.selectedLanguage}`: ''
        const isCountyLevel = this.app.geographyLevel === 'county';
        let requestURL;
        if (this.app.selectedDataset==='race-ethnicity') {
            const nameField = this.app.currentYear <= 2018 ? 'GEONAME' : 'NAME'
            const geoLevel=isCountyLevel ? 'county' : 'state'
            requestURL= `https://api.census.gov/data/${this.app.currentYear}/pep/charagegroups?get=${nameField},POP${raceParam}${hispParam}&for=${geoLevel}:*`
        } else if (this.app.selectedDataset==='language-proficiency') {
            const geoLevel=isCountyLevel ? 'county' : 'state'
            requestURL = `https://api.census.gov/data/2013/language?get=EST,LANLABEL,NAME&for=${geoLevel}:*${langParam}`
        }

        const response = await fetch(requestURL)
        console.log("Fetching from:", requestURL)
        const json = await response.json();
        return json;
    }

    updateMapStyle(newStyle) {
        this.countyMap?.updateStyle(newStyle);
        this.stateMap?.updateStyle(newStyle);
        // lg.updateLegendTheme(newStyle);
    }

    //prefetch data function?
}