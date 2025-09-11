import * as db from "../util/db.mjs";

window.mapApp() = () => ({

    //state
    sidebarOpen: true,
    region: '',
    geographyLevel: '',
    selectedDataset: null,
    currentYear: 2019,
    mapData: null,
    selectedRace: '1',
    selectedHispanic: '0',
    selectedLanguage: '2',
    mapStyle: 'osm',
    cache:{},

    mapController: null,
    sidebarController: null,

    //initialize app
    async init(){
        // initialize DB on app start
        try {
            await initDB();
            console.log('IndexedDB initialized successfully');
        } catch (error) {
            console.error('Failed to initialize IndexedDB:', error);
        }

        lucide.createIcons()

        // add map and sidebar controller later


    }

    setupWatchers(){
        this.$watch('selectedDataset', ()=> )
    
    //event handlers
    onDatasetChange(){
        if (this.selectedDataset){
            this.mapController?.fetchAndUpdateMap()
            
        }
    }

})