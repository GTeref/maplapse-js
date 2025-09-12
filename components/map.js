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
        return `${this.app.geographyLevel}_${this.app.selectedDataset}_${this.app.currentYear}_${this.app.selectedRace}_${this.app.selectedHispanic}_${this.app.selectedLanguage}`;
    }

    async fetchCensusData() {
        const hispParam = this.app.selectedDataset === 'race-ethnicity' ? `&HISP=${this.app.selectedHispanic}` : '';
        const raceParam = this.app.selectedDataset === 'race-ethnicity' ? `&RACE=${this.app.selectedRace}` : '';
        const langParam=this.app.selectedDataset==='language-proficiency' ? `&LAN7=${this.app.selectedLanguage}`: ''

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
    }

    updateMapStyle(newStyle) {
        this.countyMap?.updateStyle(newStyle);
        this.stateMap?.updateStyle(newStyle);
        lg.updateLegendTheme(newStyle);
    }

    //prefetch data function
}