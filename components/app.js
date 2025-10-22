import * as db from "../util/db.mjs";
import { MapController } from "./map.js";
import { CustomChoroplethController } from "./custom-choropleth.js";

window.mapApp = () => { 
    console.log('App initialized');
    
    return {

        //state
        sidebarOpen: true,
        region: '',
        geographyLevel: '',
        selectedDataset: null,
        currentYear: 2019,
        mapData: null,
        selectedRace: '2',
        selectedHispanic: '0',
        selectedLanguage: '2',
        mapStyle: 'osm',
        cache:{},
        settingsOpen: false,

        appMode: 'census',
        
        customData: {
            tableUrl: '',
            geometryUrl: '',
            tableIdField: '',
            geometryIdField: '',
            geometryNameField: '',
            tableNumericField: '',
            colorScheme: 'Spectral',
            binCount: 10,
            title: '',
            isLoading: false,
            error: null,
            mapRendered: false,

            //timelapse settings
            timelapseEnabled: false,
            startYear: 2015,
            endYear: 2019,
            currentTimelapseYear: 2015,
            isPlaying: false,
            playbackSpeed: 1000
        },

        //preset management
        customPresets:[],
        showPresetSaveModal:false,
        presetName:'',

        mapController: null,
        sidebarController: null,

        //initialize app
        async init(){
            // initialize DB on app start
            try {
                await db.initDB();
                console.log('IndexedDB initialized successfully');
            } catch (error) {
                console.error('Failed to initialize IndexedDB:', error);
            }

            lucide.createIcons()

            // add map and sidebar controller later
            this.mapController = new MapController(this);
            this.setupWatchers();

            await this.loadCustomPresets();
        },

        async loadCustomPresets(){
            try{
                this.customPresets = await db.getAllPresets();
                console.log('Loaded custom presets:', this.customPresets);
            } catch (error) {
                console.error('Failed to load custom presets:', error);
            }
        },

        async savePreset(){
            if (!this.presetName.trim()){
                alert('Preset name cannot be empty');
                return;
            }

            try{
                const preset={
                    id: Date.now(),
                    name: this.presetName.trim(),
                    timestamp: new Date().toISOString(),
                    config: {
                        tableUrl: this.customData.tableUrl,
                        geometryUrl: this.customData.geometryUrl,
                        tableIdField: this.customData.tableIdField,
                        geometryIdField: this.customData.geometryIdField,
                        geometryNameField: this.customData.geometryNameField,
                        tableNumericField: this.customData.tableNumericField,
                        colorScheme: this.customData.colorScheme,
                        binCount: this.customData.binCount,
                        title: this.customData.title
                    }
                };
                await db.savePreset(preset);
                this.loadCustomPresets();
                this.showPresetSaveModal = false;
                this.presetName = '';
                console.log('Preset saved successfully');
            } catch (error) {
                console.error('Failed to save preset:', error);
            }
        },

        async loadPreset(preset){
            Object.assign(this.customData, preset.config);
            console.log('Preset loaded:', preset);
            await this.generateCustomChoropleth();
        },

        async deletePreset(presetId){
            if (!confirm('Are you sure you want to delete this preset?')){
                return;
            }

            try{
                await db.deletePreset(presetId);
                this.loadCustomPresets();
                console.log('Preset deleted successfully');
            } catch (error) {
                console.error('Failed to delete preset:', error);
            }
        },

        formatDate(isoString) {
            const date = new Date(isoString);
            return date.toLocaleDateString() + ' ' + 
                   date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        },

        setupWatchers(){
            this.$watch('region', (value) => {
                console.log('Region watcher triggered:', value);
                if (!value) {
                    this.geographyLevel = '';
                    this.selectedDataset = null;
                }
            });
            
            this.$watch('geographyLevel', (value) => {
                console.log('Geography watcher triggered:', value);
                if (!value) {
                    this.selectedDataset = null;
                }
            });
            this.$watch('showPresetSaveModal', (value) => {
                if (value) {
                    this.$nextTick(() => {
                        const input = this.$refs.presetInput;
                        if (input) input.focus();
                    });
                }
            });
            this.$watch('selectedDataset', ()=> this.onDatasetChange())
            this.$watch('currentYear', ()=> this.onYearChange())
            this.$watch('selectedRace', ()=> this.onRaceChange())
            this.$watch('selectedHispanic', ()=> this.onHispanicChange())
            this.$watch('selectedLanguage', ()=> this.onLanguageChange())
            this.$watch('mapStyle', ()=> this.onMapStyleChange())
        },
        
        //event handlers
        onDatasetChange(){
            if (this.selectedDataset){
                this.mapController?.fetchAndUpdateMap()
                
            }

            
        },

        onYearChange(){
            if (this.selectedDataset){
                this.mapController?.fetchAndUpdateMap()
                //prefetch adjacent years if race-ethnicity
            }


        },

        onRaceChange(){
            if (this.selectedDataset == 'race-ethnicity'){
                this.mapController?.fetchAndUpdateMap()
            }
        },

        onHispanicChange(){
            if (this.selectedDataset == 'race-ethnicity'){
                this.mapController?.fetchAndUpdateMap()
            }
        },

        onLanguageChange(){
            if (this.selectedDataset == 'language-proficiency'){
                this.mapController?.fetchAndUpdateMap()
            }
        },

        onMapStyleChange(){
            this.mapController?.updateMapStyle(this.mapStyle)
        },

        //ui actions
        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
        },  

        toggleSettings() {
            this.settingsOpen = !this.settingsOpen;
        },

        //mode switching
        switchToCustomMode() {
            this.appMode = 'custom';
            this.clearMap();
        },

        switchToCensusMode() {
            this.appMode = 'census';
            this.clearMap();
        },

        clearMap() {
            this.stateMap?.destroy();
            this.countyMap?.destroy();
            this.customChoroplethController?.destroy();
        },

        //getters for computed properties
        get showDatasetOptions() {
            return this.selectedDataset !== null;  
        },

        get showRaceOptions() {
            return this.selectedDataset === 'race-ethnicity';
        },

        get showLanguageOptions() {
            return this.selectedDataset === 'language-proficiency';
        },

        //custom mode getters
        get showCensusControls() {
            return this.appMode === 'census';
        },

        get showCustomControls() {
            return this.appMode === 'custom';
        },

        get timeSliderConfig() {
            if (this.selectedDataset === 'race-ethnicity') {
                return { min: 2015, max: 2019, disabled: false}

            } else if (this.selectedDataset === 'language-proficiency') {
                return { min: 2013, max: 2013, disabled: true}
            }
            return { min: 2015, max: 2019, disabled: true};

        },
        
        async generateCustomChoropleth() {
            console.log('Generating custom choropleth...');
            
            this.customData.isLoading = true;
            this.customData.error = null;
            
            try {
                if (!this.customChoroplethController) {
                    this.customChoroplethController = new CustomChoroplethController(this);
                }
                
                await this.customChoroplethController.generateChoropleth();
                console.log('Custom choropleth generated successfully');
            } catch (error) {
                console.error('Error generating custom choropleth:', error);
                this.customData.error = error.message; // Bind this to UI for display
            } finally {
                this.customData.isLoading = false;
            }

        },

    }
}
    