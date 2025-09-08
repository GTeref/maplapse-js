// db.js imports
import { setCache, getCache, initDB } from "./util/db.mjs"; 
import { createLegend, hideLegend, formatLegendNumbers, updateLegendTheme } from "./util/legend.mjs";

document.addEventListener('DOMContentLoaded', async function() {

    // initialize DB on app start
    try {
        await initDB();
        console.log('IndexedDB initialized successfully');
    } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
    }


    lucide.createIcons();

    const sidebar = document.getElementById('sidebar')
    const menuButton = document.getElementById('menu-button')
    const settingsButton = document.getElementById('settings-button')
    const settingsDropdown = document.getElementById('settings-dropdown')
    const mapStyleSelect = document.getElementById('map-style-select')
    const sidebarToggle = document.getElementById('sidebar-toggle')
    const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon')
    const timeSlider = document.getElementById('time-slider')
    const yearDisplay = document.getElementById('year-display')
    const datasetInputs = document.querySelectorAll('input[name="dataset"]')

    const regionSelect=document.getElementById('region-select')
    const geographySelect=document.getElementById('geography-select')
    const datasetSelect=document.getElementById('dataset-select')
    const geographyGroup=document.getElementById('geography-group')
    const datasetGroup=document.getElementById('dataset-group')

    const datasetOptions=document.getElementById('dataset-options')
    const raceOptions = document.getElementById('race-options')
    const languageOptions=document.getElementById('language-options')
    const raceSelect = document.getElementById('race-select')
    const hispSelect = document.getElementById('hispanic-select')
    const langSelect=document.getElementById('language-select')

    const mapPlaceholder = document.getElementById('map-placeholder')

    // const MAPBOX_TOKEN='pk.eyJ1IjoiZ3RlcmVmIiwiYSI6ImNsdmU0Zmk3dzA1d3cycHA2b2R2MnZlengifQ.-P6AWaRKH710if95HmVTEA' // mapbox public token w/ max 50k free map loads

    //reset all selections on page refresh
    regionSelect.value = '';
    geographySelect.value = '';
    datasetSelect.value = '';
    raceSelect.value = '1';
    hispSelect.value = '0';
    langSelect.value = '2';

    // resetSelections()

    let state={
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
        cache:{} //store data for diff years
    }

    // dataset configurations
    const datasetConfig={
        US:{
            state:[
                {value: 'race-ethnicity', label: 'Race and Ethnicity', options: 'race-options'},
                {value: 'language-proficiency', label: 'Language Proficiency', options: 'language-options'}
            ],
            county:[
                {value: 'race-ethnicity', label: 'Race and Ethnicity', options: 'race-options'},
                {value: 'language-proficiency', label: 'Language Proficiency', options: 'language-options'}
            ]
        },
        Indonesia: {
            state: [
                { value: 'disease', label: 'Disease Distribution' }
            ],
            county: []
        },
        World: {
            state: [
                { value: 'population', label: 'Population Distribution' }
            ]
        }
    }

    raceSelect.disabled = true;
    hispSelect.disabled = true;

    menuButton.addEventListener('click', toggleSidebar)
    settingsButton.addEventListener('click', toggleSettings)
    mapStyleSelect.addEventListener('change', handleMapStyleChange)
    sidebarToggle.addEventListener('click', toggleSidebar)
    timeSlider.addEventListener('input', handleTimeChange)

    regionSelect.addEventListener('change', handleRegionChange);
    geographySelect.addEventListener('change', handleGeographyChange);
    datasetSelect.addEventListener('change', handleDatasetChange);

    // datasetInputs.forEach(input => {
    //     input.addEventListener('change', handleDatasetChange)
    // })

    raceSelect.addEventListener('change', handleRaceChange)
    hispSelect.addEventListener('change', handleHispanicChange)
    langSelect.addEventListener('change', handleLangChange)

    document.addEventListener('click', function(e) {
        if (!settingsButton.contains(e.target) && !settingsDropdown.contains(e.target)) {
            if (state.settingsOpen) {
                toggleSettings()
            }
        }
    })

    //toggleRaceOptions()

    const raceLabels = {
        '1': 'White',
        '2': 'Black or African American',
        '3': 'American Indian and Alaska Native',
        '4': 'Asian',
        '5': 'Native Hawaiian and Other Pacific Islander',
        '6': 'Two or More Races'
    };

    const hispanicLabels = {
        '0': 'Non-Hispanic',
        '1': 'Hispanic'
    };

    const languageLabels = {
        '1': 'Population 5 years and over',
        '2': 'Speak only English',
        '3': 'Speak a language other than English at home',
        '4': 'Spanish and Spanish Creole', // this doesn't work for some reason
        '5': 'Other Indo-European Languages',
        '6': 'Asian and Pacific Island Languages',
        '7': 'All Other Languages'
    };

    const mapStyles = {
        // Protomaps
        // light: 'https://protomaps.github.io/basemaps-assets/styles/v2/light.json',
        // dark: 'https://protomaps.github.io/basemaps-assets/styles/v2/dark.json',
        
        // MapLibre demo
        demo: 'https://demotiles.maplibre.org/style.json',
        
        // OSM
        osm: {
            "version": 8,
            "sources": {
                "osm": {
                    "type": "raster",
                    "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                    "tileSize": 256,
                    "attribution": "© OpenStreetMap contributors"
                }
            },
            "layers": [{
                "id": "osm",
                "type": "raster",
                "source": "osm"
            }]
        },

        // Carto light
        light: {
            "version": 8,
            "sources": {
                "carto-light": {
                    "type": "raster",
                    "tiles": [
                        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
                    ],
                    "tileSize": 256,
                    "attribution": "© CARTO, © OpenStreetMap contributors"
                }
            },
            "layers": [{
                "id": "carto-light",
                "type": "raster",
                "source": "carto-light"
            }]
        },
        
        // Carto dark
        dark: {
            "version": 8,
            "sources": {
                "carto-dark": {
                    "type": "raster",
                    "tiles": [
                        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
                        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
                        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                    ],
                    "tileSize": 256,
                    "attribution": "© CARTO, © OpenStreetMap contributors"
                }
            },
            "layers": [{
                "id": "carto-dark",
                "type": "raster",
                "source": "carto-dark"
            }]
        }
    }

    function toggleSidebar() {
        state.sidebarOpen = !state.sidebarOpen
        sidebar.classList.toggle('closed', !state.sidebarOpen)
        sidebarToggleIcon.setAttribute('icon-name', state.sidebarOpen ? 'chevron-left' : 'chevron-right')
        lucide.createIcons()
    }

    function toggleSettings() {
        state.settingsOpen = !state.settingsOpen
        settingsDropdown.classList.toggle('visible', state.settingsOpen)
    }

    function handleMapStyleChange(e) {
        const newStyle = e.target.value
        state.mapStyle = newStyle
        
        // Update the county map if it exists
        if (window.countyMap && state.geographyLevel === 'county') {
            updateMapStyle(window.countyMap, newStyle)
        } else if (state.geographyLevel === 'state' && window.stateMap) {
            updateMapStyle(window.stateMap, newStyle)
        }

        updateLegendTheme(newStyle)
        
        console.log(`Map style changed to: ${newStyle}`)
    }

    function showElement(element,show=true){
        element.classList.toggle('visible', show)
    }

    function updateDropdownOptions(select,options,enableSelect=true){
        select.innerHTML=options.reduce((html,option)=>{
            return html+ `<option value="${option.value}">${option.label}</option>`
        }, '<option value="">Choose an option...</option>')
        select.disabled=!enableSelect
    }

    function handleRegionChange(e) {
        state.region=e.target.value

        if (state.region){
            showElement(geographyGroup, true)
            geographySelect.disabled=false

            state.geographyLevel=''
            state.selectedDataset=''
            geographySelect.value=''
            datasetSelect.value=''
            showElement(datasetGroup,false)
            showElement(datasetOptions,false)

            mapPlaceholder.textContent='Select a geography level'
        } else{
            resetSelections()
        }
    }

    function handleGeographyChange(e){
        state.geographyLevel=e.target.value

        if (state.geographyLevel){
            showElement(datasetGroup,true)
            datasetSelect.disabled=false

            const datasets=datasetConfig[state.region]?.[state.geographyLevel] || []
            updateDropdownOptions(datasetSelect,datasets)

            state.selectedDataset=''
            showElement(datasetOptions,false)

            mapPlaceholder.textContent='Select a dataset'
        } else{
            resetDatasetSelections()
        }
    }

    function handleTimeChange(e) {
        const newYear = parseInt(e.target.value)
        state.currentYear = newYear
        yearDisplay.textContent = newYear
        if (state.selectedDataset) {
            fetchAndUpdateMap()

            //if we're viewing race data, pre-fetch adjacent years
            if (state.selectedDataset==='race-ethnicity'){
                const nextYear=newYear+1
                if (nextYear<=2019){
                    prefetchData(nextYear)
                }

                const prevYear=newYear-1
                if (prevYear>=2015){
                    prefetchData(prevYear)
                }
            }
        }    
        
    }

    function handleDatasetChange(e) {
        state.selectedDataset = e.target.value
        //toggleRaceOptions()

        raceOptions.classList.remove('visible')
        languageOptions.classList.remove('visible')

        // const raceOptionsDiv=document.getElementById('race-options')
        // const langOptionsDiv=document.getElementById('language-options')

        if (state.selectedDataset){
            showElement(datasetOptions,true)

            // if Race and Ethnicity selected, hide language select dropdown
            if (state.selectedDataset==='race-ethnicity') {
                raceOptions.classList.add('visible')
                languageOptions.classList.remove('visible')
                raceSelect.disabled=false
                hispSelect.disabled=false
                langSelect.disabled=true

                timeSlider.min='2015'
                timeSlider.max='2019'
                timeSlider.value='2019'
                timeSlider.disabled=false
                state.currentYear=2019
                yearDisplay.textContent=2019
            } else if (state.selectedDataset==='language-proficiency') {
                raceOptions.classList.remove('visible')
                languageOptions.classList.add('visible')
                raceSelect.disabled=true
                hispSelect.disabled=true
                langSelect.disabled=false
                
                // i just realized the ACS language dataset only has one year....
                timeSlider.min='2013'
                timeSlider.max='2013'
                timeSlider.value='2013'
                timeSlider.disabled=true
                state.currentYear=2013
                yearDisplay.textContent=2013
            }
            mapPlaceholder.style.display='none'
            fetchAndUpdateMap()
        } else {
            timeSlider.disabled=true
            mapPlaceholder.style.display = 'block'
            //Plotly.purge('map')
        }
        //fetchAndUpdateMap()
    }

    function toggleRaceOptions() {
        const isRaceDataset = state.selectedDataset === 'Race and Ethnicity'
        raceOptions.classList.toggle('visible', isRaceDataset)
    }

    function handleRaceChange(e) {
        state.selectedRace = e.target.value
        fetchAndUpdateMap()
    }

    function handleHispanicChange(e) {
        state.selectedHispanic = e.target.value
        fetchAndUpdateMap()
    }

    function handleLangChange(e) {
        state.selectedLanguage=e.target.value
        fetchAndUpdateMap()
    }

    function resetSelections(){
        state.region=''
        state.geographyLevel=''
        state.selectedDataset=''

        geographySelect.value=''
        geographySelect.disabled=true
        showElement(geographyGroup,false)

        resetDatasetSelections()

        hideLegend()

        mapPlaceholder.textContent='Select a region to get started'
        mapPlaceholder.style.display='block'
    }

    function resetDatasetSelections() {
        datasetSelect.value=''
        datasetSelect.disabled=true
        showElement(datasetGroup,false)
        showElement(datasetOptions,false)
        timeSlider.disabled=true

        hideLegend()

        if (state.region && !state.geographyLevel){
            mapPlaceholder.textContent='Select a geography level'
        }
    }

    async function fetchStateGeoJSON(){
        try{
            const response=await fetch('https://gist.githubusercontent.com/wboykinm/6979292/raw/fe0c968ae6408e63186d09181f8d61299345bbeb/us-states.geojson')
            if (!response.ok) throw new Error('Failed to fetch state data')
            return await response.json()
        }   catch(e){
            console.error('Error fetching state geojson:',error)
            throw error
        }
    }
    
    async function fetchGeoJSON(){
        try{
            const response=await fetch('https://gist.githubusercontent.com/sdwfrost/d1c73f91dd9d175998ed166eb216994a/raw/e89c35f308cee7e2e5a784e1d3afc5d449e9e4bb/counties.geojson')
            if (!response.ok) throw new Error('Failed to fetch county data')
            return await response.json()
        }   catch(e){
            console.error('Error fetching county geojson:',error)
            throw error
        }
    }

    async function fetchAndUpdateMap() {
        if (!state.selectedDataset) {
            console.log("no dataset selected; map will not render")
            return
        }

        const isCountyLevel=state.geographyLevel==='county'

        console.log('Current state:', {
            region:state.region,
            geographyLevel:state.geographyLevel,
            dataset: state.selectedDataset,
            race: state.selectedRace,
            hispanic: state.selectedHispanic,
            language: state.selectedLanguage,
            year: state.currentYear
        });

        const cacheKey=`${state.geographyLevel}_${state.selectedDataset}_${state.currentYear}_${state.selectedRace}_${state.selectedHispanic}_${state.selectedLanguage}`

        //use indexedDB cache
        const cachedData=await getCache(cacheKey)
        if (cachedData){
            console.log('using cached data for', cacheKey)

            if (isCountyLevel){
                if (window.countyMap && window.countyGeojson) {
                    updateCountyMap(cachedData, window.countyGeojson);
                } else {
                    const geojson = await fetchGeoJSON();
                    window.countyGeojson = geojson; //cache the geojson
                    await renderCountyMap(cachedData, geojson);
                }
            }else{
                renderStateMap(cachedData)
            }

            return
        }

        // if (state.cache[cacheKey]){
        //     console.log('using cached data for', cacheKey)
        //     const cachedData=state.cache[cacheKey]

        //     if (isCountyLevel){
        //         if (window.countyMap && window.countyGeojson) {
        //             updateCountyMap(cachedData, window.countyGeojson);
        //         } else {
        //             const geojson = await fetchGeoJSON();
        //             window.countyGeojson = geojson; //cache the geojson
        //             await renderCountyMap(cachedData, geojson);
        //         }
        //     }else{
        //         renderStateMap(cachedData)
        //     }
        //     return
        // }

        // fetch data from the dropdown menus to feed into url
        const hispParam = state.selectedDataset === 'race-ethnicity' ? `&HISP=${state.selectedHispanic}` : '';
        const raceParam = state.selectedDataset === 'race-ethnicity' ? `&RACE=${state.selectedRace}` : '';
        const langParam=state.selectedDataset==='language-proficiency' ? `&LAN7=${state.selectedLanguage}`: ''

        let requestURL;
        if (state.selectedDataset==='race-ethnicity') {
            const nameField = state.currentYear <= 2018 ? 'GEONAME' : 'NAME'
            const geoLevel=isCountyLevel ? 'county' : 'state'
            requestURL= `https://api.census.gov/data/${state.currentYear}/pep/charagegroups?get=${nameField},POP${raceParam}${hispParam}&for=${geoLevel}:*`
        } else if (state.selectedDataset==='language-proficiency') {
            const geoLevel=isCountyLevel ? 'county' : 'state'
            requestURL = `https://api.census.gov/data/2013/language?get=EST,LANLABEL,NAME&for=${geoLevel}:*${langParam}`
        }
        

        const response = await fetch(requestURL)
        console.log("Fetching from:", requestURL)
        const json = await response.json();

        //state.cache[cacheKey]=json
        await setCache(cacheKey, json)

        if (isCountyLevel){
            if (!window.countyGeojson) {
                window.countyGeojson=await fetchGeoJSON()
            }

            if (window.countyMap){
                updateCountyMap(json, window.countyGeojson)
            } else {
                await renderCountyMap(json, window.countyGeojson)
            }
        } else{
            renderStateMap(json)
        }
        
    }

    //prefetch data for specific year
    async function prefetchData(year) {
        // Only pre-fetch if we're not already showing this year
        if (year === state.currentYear) return;
        
        // Create cache key for the year
        const cacheKey = `${state.geographyLevel}_${state.selectedDataset}_${year}_${state.selectedRace}_${state.selectedHispanic}_${state.selectedLanguage}`;
        
        const persistentData=await getCache(cacheKey)
        // Skip if already cached
        //if (state.cache[cacheKey]) return;
        if (persistentData) return;
        
        const isCountyLevel = state.geographyLevel === 'county';
        const hispParam = state.selectedDataset === 'race-ethnicity' ? `&HISP=${state.selectedHispanic}` : '';
        const raceParam = state.selectedDataset === 'race-ethnicity' ? `&RACE=${state.selectedRace}` : '';
        
        const nameField = year <= 2018 ? 'GEONAME' : 'NAME';
        const geoLevel = isCountyLevel ? 'county' : 'state';
        const requestURL = `https://api.census.gov/data/${year}/pep/charagegroups?get=${nameField},POP${raceParam}${hispParam}&for=${geoLevel}:*`;
        
        console.log(`Pre-fetching data for year ${year}`);
        
        try {
            const response = await fetch(requestURL);
            const json = await response.json();
            // state.cache[cacheKey] = json;
            await setCache(cacheKey, json);
            console.log(`Pre-fetched data for ${year}`);
        } catch (error) {
            console.error(`Failed to pre-fetch data for ${year}:`, error);
        }
    }

    async function renderCountyMap(data, geojson){
        const isLanguageData = state.selectedDataset === 'language-proficiency';
        const infoSidebar = document.getElementById('info-sidebar');
        const closeInfoBtn = document.getElementById('close-info');
        const countyTitle = document.getElementById('county-title');
        const countyStats = document.getElementById('county-stats');
        const countyChart = document.getElementById('county-chart');

        if (window.countyMap) {
            window.countyMap.off('click', 'counties-fill')
        }

        if (!closeInfoBtn._hasClickListener) {
            closeInfoBtn.addEventListener('click', () => {
                infoSidebar.classList.remove('visible');
            })
            closeInfoBtn._hasClickListener = true
        }

        

        const rows=data.slice(1).map(row=>{
            if (isLanguageData) {
                return {
                    fips: row[4].padStart(2, '0')+ row[5].padStart(3, '0'),
                    NAME: row[2],
                    POP: Number(row[0]),
                    LABEL:row[1]
                }
            } else {
                return {
                    fips:row[4].padStart(2, '0')+ row[5].padStart(3, '0'),
                    NAME:row[0],
                    POP: Number(row[1])
                }
            }
            
        })

        const popByFips = {}
        rows.forEach(row=> {
            popByFips[row.fips]=row.POP
        })

        const values=Object.values(popByFips)
        const minPop=Math.min(...values)
        const maxPop=Math.max(...values)

        if (window.countyMap) {
            window.countyMap.remove()
        }

        const map=new maplibregl.Map({
            container: 'map',
            // style: 'mapbox://styles/mapbox/light-v10',
            style: mapStyles.osm,
            center: [-98.5795, 39.8283],
            zoom: 3,
            // accessToken: MAPBOX_TOKEN
        })

        window.countyMap = map

        console.log(`Total counties with data: ${rows.length}`);
        console.log(`Sample FIPS codes: ${Object.keys(popByFips).slice(0, 5)}`);
        console.log(`Min pop: ${minPop}, Max pop: ${maxPop}`);

        window.currentPopByFips = popByFips;
        window.currentMinPop = minPop;
        window.currentMaxPop = maxPop;

        let popup=null

        map.on('load', ()=> {
            const countyNames={}
            geojson.features.forEach(feature=>{
                if (feature.properties){
                    feature.properties.FIPS=feature.properties.GEOID
                    if (feature.properties.NAME){
                        countyNames[feature.properties.GEOID]=feature.properties.NAME
                    }
                }
            })

            const colorMin = isLanguageData ? 'rgb(240, 247, 255)' : 'rgb(255, 245, 240)';
            const colorMax = isLanguageData ? 'rgb(31, 119, 180)' : 'rgb(103, 0, 13)';

            map.addSource('counties', {
                type: 'geojson',
                data: geojson
            })

            // geojson.features.forEach(feature => {

            //     if (feature.properties) {
            //         if (feature.properties.FIPS) {
            //             feature.id = feature.properties.FIPS;
            //         } else if (feature.properties.STATE && feature.properties.COUNTY) {
            //             const stateFips = feature.properties.STATE.padStart(2, '0');
            //             const countyFips = feature.properties.COUNTY.padStart(3, '0');
            //             feature.id = stateFips + countyFips;
            //             feature.properties.FIPS = feature.id;
            //         } else if (feature.properties.id) {
            //             feature.id = feature.properties.id;
            //             feature.properties.FIPS = feature.id;
            //         }
            //     }
            // });

            map.addLayer({
                id: 'counties-fill',
                type: 'fill',
                source: 'counties',
                paint: {
                    'fill-color': [
                        'let',
                        'fips', ['to-string', ['get', 'FIPS']],
                        [
                            'case',
                            ['has', ['var', 'fips'], ['literal', popByFips]],
                            [
                                'interpolate',
                                ['linear'],
                                ['/',
                                    ['ln', ['max', 1, ['to-number', ['get', ['var', 'fips'], ['literal', popByFips]]]]],
                                    ['ln', ['max', 1, maxPop]]
                                ],
                                0, colorMin,
                                1, colorMax
                            ],
                            'rgb(200, 200, 200)' 
                        ]
                    ],
                    'fill-opacity': 0.7
                }
            })

            map.addLayer({
                id: 'counties-border',
                type: 'line',
                source: 'counties',
                paint: {
                    'line-color': '#000',
                    'line-width': 0.5,
                    'line-opacity': 0.3
                }
            })

            // fancy hover effect
            map.on('mousemove', 'counties-fill', (e) => {
                map.getCanvas().style.cursor = 'pointer';
            
                if (e.features.length > 0) {
                    const feature = e.features[0];
                    const fips = feature.properties.FIPS;
                    const countyName = feature.properties.NAME;
                    const pop = window.currentPopByFips[fips];//global data
                    
                    if (popup) {
                        popup.remove();
                    }

                    let popupHTML=`<strong>${countyName}</strong><br/>FIPS: ${fips}<br/>`

                    if (state.selectedDataset === 'language-proficiency') {
                        const categoryLabel = languageLabels[state.selectedLanguage];
                        popupHTML += `${categoryLabel}: ${pop ? pop.toLocaleString() : 'No data'}`;
                    } else {
                        const raceLabel = raceLabels[state.selectedRace];
                        const hispLabel = hispanicLabels[state.selectedHispanic];
                        popupHTML += `${raceLabel} (${hispLabel}): ${pop ? pop.toLocaleString() : 'No data'}`;
                    }
                    
                    popup = new maplibregl.Popup({
                        closeButton: false,
                        closeOnClick: false
                    })
                    .setLngLat(e.lngLat)
                    .setHTML(popupHTML)
                    .addTo(map);
                }
            })

            map.on('mouseleave', 'counties-fill', () => {
                map.getCanvas().style.cursor = '';
                if (popup) {
                    popup.remove();
                    popup = null;
                }
            })

            const labels = { raceLabels, hispanicLabels, languageLabels }
            createLegend(minPop, maxPop, isLanguageData, 'county', state, labels)
        })

        map.on('click', 'counties-fill', async (e) => {
            if (e.features.length > 0) {
                const feature = e.features[0];
                const fips = feature.properties.FIPS;
                const countyName = feature.properties.NAME;
                const stateFips = fips.substring(0, 2);
                const countyFips = fips.substring(2);
                
                // Set title
                countyTitle.textContent = countyName;

                //loading state
                countyStats.innerHTML = '<p>Loading county details...</p>';
                countyChart.innerHTML = '<div class="loading-spinner"></div>';

                // Display sidebar
                infoSidebar.classList.add('visible');
                
                // Show county details in sidebar
                await showCountyDetails(fips, countyName, stateFips, countyFips);
                
            }
        });
    }

    // Function to fetch and display detailed county information
    async function showCountyDetails(fips, countyName, stateFips, countyFips) {
        try {
            console.log(`Fetching details for ${countyName} (${fips}) for dataset: ${state.selectedDataset}, year: ${state.currentYear}`);

            const countyStats = document.getElementById('county-stats');
            const countyChart = document.getElementById('county-chart');
            const isLanguageData = state.selectedDataset === 'language-proficiency';
            
            // Fetch additional data based on dataset type
            let demographicData;
            
            if (isLanguageData) {
                // Fetch all language categories for this county
                const langURL = `https://api.census.gov/data/2013/language?get=EST,LANLABEL,NAME&for=county:${countyFips}&in=state:${stateFips}`;
                console.log("Fetching language data from:", langURL);
                const langResponse = await fetch(langURL);
                
                if (!langResponse.ok) {
                    throw new Error(`API error: ${langResponse.status} ${langResponse.statusText}`);
                }
                
                demographicData = await langResponse.json();
            } else {
                // Fetch detailed race/ethnicity breakdown
                const detailURL = `https://api.census.gov/data/${state.currentYear}/pep/charagegroups?get=NAME,POP,RACE,HISP&for=county:${countyFips}&in=state:${stateFips}`;
                console.log("Fetching race/ethnicity data from:", detailURL);
                const detailResponse = await fetch(detailURL);
                
                if (!detailResponse.ok) {
                    throw new Error(`API error: ${detailResponse.status} ${detailResponse.statusText}`);
                }
                
                demographicData = await detailResponse.json();
            }
            
            // Check if data is valid and has rows
            if (!demographicData || !Array.isArray(demographicData) || demographicData.length < 2) {
                throw new Error('Invalid or empty response from Census API');
            }
            
            // Process and display data
            renderCountyStats(demographicData, fips, countyName, isLanguageData);
            renderCountyChart(demographicData, isLanguageData);
        } catch (error) {
            console.error('Error fetching county details:', error);
            countyStats.innerHTML = `
                <p>Error loading county details: ${error.message}</p>
                <p>This may be because the Census API doesn't have detailed data for this county in the selected year.</p>
                <button id="retry-county-details" class="btn">Retry</button>
            `;
            
            document.getElementById('retry-county-details')?.addEventListener('click', () => {
                showCountyDetails(fips, countyName, stateFips, countyFips);
            });
            
            countyChart.innerHTML = '';
        }
    }
    
    // Render county statistics
    function renderCountyStats(data, fips, countyName, isLanguageData) {
        const countyStats = document.getElementById('county-stats');
        // Skip header row
        const details = data.slice(1);
        
        let totalPop = 0;
        const categories = {};
        
        if (isLanguageData) {
            // Process language data
            details.forEach(row => {
                const population = Number(row[0]);
                const label = row[1];
                const lanCode = row[3]; // LAN7 code
                
                if (lanCode === "1") { // Total population 5+ years
                    totalPop = population;
                }
                
                categories[label] = population;
            });
            
            // Build HTML for stats
            let statsHTML = `
                <div class="stat-item">
                    <span class="stat-label">FIPS Code:</span>
                    <span>${fips}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Population (5+ years):</span>
                    <span>${totalPop.toLocaleString()}</span>
                </div>
                <h4>Language Proficiency</h4>
            `;
            
            // Add each language category
            for (const [label, pop] of Object.entries(categories)) {
                if (label !== "Population 5 years and over") {
                    const percentage = totalPop > 0 ? ((pop / totalPop) * 100).toFixed(1) : 0;
                    statsHTML += `
                        <div class="stat-item">
                            <span class="stat-label">${label}:</span>
                            <span>${pop.toLocaleString()} (${percentage}%)</span>
                        </div>
                    `;
                }
            }
            
            countyStats.innerHTML = statsHTML;
        } else {
            // Process race/ethnicity data
            let totalPop = 0;
            const raceEthnicityData = {};
            
            // First pass to get total population
            details.forEach(row => {
                if (row[2] === "0" && row[3] === "0") { // Total population
                    totalPop = Number(row[1]);
                }
            });
            
            // Second pass to calculate percentages
            details.forEach(row => {
                const population = Number(row[1]);
                const raceCode = row[2];
                const hispCode = row[3];
                
                if (raceCode !== "0" || hispCode !== "0") { // Skip total row
                    const raceLabel = raceLabels[raceCode] || 'Unknown';
                    const hispLabel = hispanicLabels[hispCode] || 'Unknown';
                    const label = `${raceLabel} (${hispLabel})`;
                    
                    raceEthnicityData[label] = population;
                }
            });
            
            // Build HTML for stats
            let statsHTML = `
                <div class="stat-item">
                    <span class="stat-label">FIPS Code:</span>
                    <span>${fips}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Population:</span>
                    <span>${totalPop.toLocaleString()}</span>
                </div>
                <h4>Race & Ethnicity Breakdown</h4>
            `;
            
            // Add each race/ethnicity category
            for (const [label, pop] of Object.entries(raceEthnicityData)) {
                const percentage = totalPop > 0 ? ((pop / totalPop) * 100).toFixed(1) : 0;
                statsHTML += `
                    <div class="stat-item">
                        <span class="stat-label">${label}:</span>
                        <span>${pop.toLocaleString()} (${percentage}%)</span>
                    </div>
                `;
            }
            
            countyStats.innerHTML = statsHTML;
        }
    }
    
    // Render chart for county data
    function renderCountyChart(data, isLanguageData) {

        const countyChart = document.getElementById('county-chart');
        // Skip header row
        const details = data.slice(1);
        
        let chartData;
        
        if (isLanguageData) {
            // Process language data for chart
            const categories = [];
            const values = [];
            const colors = ['rgb(31, 119, 180)', 'rgb(255, 127, 14)', 'rgb(44, 160, 44)', 
                        'rgb(214, 39, 40)', 'rgb(148, 103, 189)', 'rgb(140, 86, 75)'];
            
            details.forEach((row, index) => {
                const label = row[1];
                const value = Number(row[0]);
                
                if (label !== "Population 5 years and over" && value > 0) {
                    categories.push(label);
                    values.push(value);
                }
            });
            
            chartData = [{
                values: values,
                labels: categories,
                type: 'pie',
                marker: {
                    colors: colors.slice(0, categories.length)
                },
                textinfo: 'percent',
                hoverinfo: 'label+value+percent'
            }];
        } else {
            // Process race/ethnicity data for chart
            const categories = [];
            const values = [];
            const colors = ['rgb(103, 0, 13)', 'rgb(165, 15, 21)', 'rgb(203, 24, 29)', 
                        'rgb(239, 59, 44)', 'rgb(251, 106, 74)', 'rgb(252, 146, 114)'];
            
            details.forEach(row => {
                const population = Number(row[1]);
                const raceCode = row[2];
                const hispCode = row[3];
                
                if ((raceCode !== "0" || hispCode !== "0") && population > 0) {
                    const raceLabel = raceLabels[raceCode] || 'Unknown';
                    const hispLabel = hispanicLabels[hispCode] || 'Unknown';
                    const label = `${raceLabel} (${hispLabel})`;
                    
                    categories.push(label);
                    values.push(population);
                }
            });
            
            chartData = [{
                values: values,
                labels: categories,
                type: 'pie',
                marker: {
                    colors: colors.slice(0, categories.length)
                },
                textinfo: 'percent',
                hoverinfo: 'label+value+percent'
            }];
        }
        
        const layout = {
            height: 300,
            margin: {l: 0, r: 0, b: 30, t: 30},
            title: isLanguageData ? 'Language Distribution' : 'Race/Ethnicity Distribution'
        };
        
        Plotly.newPlot('county-chart', chartData, layout);
    }

    //update county map w/o re-rendering it
    function updateCountyMap(data, geojson) {
        const isLanguageData = state.selectedDataset === 'language-proficiency';
        const map = window.countyMap;
        
        if (!map) return;

        const infoSidebar = document.getElementById('info-sidebar');
        const countyTitle = document.getElementById('county-title');
        const countyStats = document.getElementById('county-stats');
        const countyChart = document.getElementById('county-chart');

        map.off('click', 'counties-fill')
        
        // Process the data
        const rows = data.slice(1).map(row => {
            if (isLanguageData) {
                return {
                    fips: row[4].padStart(2, '0') + row[5].padStart(3, '0'),
                    NAME: row[2],
                    POP: Number(row[0]),
                    LABEL: row[1]
                };
            } else {
                return {
                    fips: row[4].padStart(2, '0') + row[5].padStart(3, '0'),
                    NAME: row[0],
                    POP: Number(row[1])
                };
            }
        });
    
        const popByFips = {};
        rows.forEach(row => {
            popByFips[row.fips] = row.POP;
        });
    
        const values = Object.values(popByFips).filter(val => val > 0);
        const minPop = Math.min(...values);
        const maxPop = Math.max(...values);
        
        // Update the map source if it exists
        if (map.getSource('counties')) {
            // Update the color property of the layer
            const colorMin = isLanguageData ? 'rgb(240, 247, 255)' : 'rgb(255, 245, 240)';
            const colorMax = isLanguageData ? 'rgb(31, 119, 180)' : 'rgb(103, 0, 13)';
            
            // Store the data for hover popups
            window.currentPopByFips = popByFips;
            window.currentMinPop = minPop;
            window.currentMaxPop = maxPop;
            
            map.setPaintProperty('counties-fill', 'fill-color', [
                'let',
                'fips', ['to-string', ['get', 'FIPS']],
                [
                    'case',
                    ['has', ['var', 'fips'], ['literal', popByFips]],
                    [
                        'interpolate',
                        ['linear'],
                        ['/',
                            ['ln', ['max', 1, ['to-number', ['get', ['var', 'fips'], ['literal', popByFips]]]]],
                            ['ln', ['max', 1, maxPop]]
                        ],
                        0, colorMin,
                        1, colorMax
                    ],
                    'rgb(200, 200, 200)'
                ]
            ]);
            
            console.log(`Updated county map with ${rows.length} data points. Min pop: ${minPop}, Max pop: ${maxPop}`);
        }

        map.on('click', 'counties-fill', async (e) => {
            if (e.features.length > 0) {
                const feature = e.features[0];
                const fips = feature.properties.FIPS;
                const countyName = feature.properties.NAME;
                const stateFips = fips.substring(0, 2);
                const countyFips = fips.substring(2);
                
                // Set title
                countyTitle.textContent = countyName;
                
                // Show loading state immediately
                countyStats.innerHTML = '<p>Loading county details...</p>';
                countyChart.innerHTML = '<div class="loading-spinner"></div>';
                
                // Display sidebar immediately
                infoSidebar.classList.add('visible');
                
                // Then load the details
                await showCountyDetails(fips, countyName, stateFips, countyFips);
            }
        });
    }

    //update map style while preserving data layers
    function updateMapStyle(map, styleName) {
        const style = mapStyles[styleName]
        if (style && map) {
            // Store current layers and sources
            const currentLayers = []
            const currentSources = {}
            
            try {
                // Get current map layers and sources
                if (map.getLayer('counties-fill')) {
                    currentLayers.push({
                        id: 'counties-fill',
                        layer: map.getLayer('counties-fill')
                    })
                }
                if (map.getLayer('counties-border')) {
                    currentLayers.push({
                        id: 'counties-border',
                        layer: map.getLayer('counties-border')
                    })
                }
                if (map.getSource('counties')) {
                    currentSources.counties = map.getSource('counties')._data
                }

                // Set new style
                map.setStyle(style)

                // Wait for style to load, then re-add our layers
                map.once('styledata', () => {
                    // Re-add counties source if it existed
                    if (currentSources.counties) {
                        map.addSource('counties', {
                            type: 'geojson',
                            data: currentSources.counties
                        })

                        // Re-add layers with current data
                        if (window.currentPopByFips) {
                            const isLanguageData = state.selectedDataset === 'language-proficiency'
                            const colorMin = isLanguageData ? 'rgb(240, 247, 255)' : 'rgb(255, 245, 240)'
                            const colorMax = isLanguageData ? 'rgb(31, 119, 180)' : 'rgb(103, 0, 13)'
                            const maxPop = window.currentMaxPop

                            map.addLayer({
                                id: 'counties-fill',
                                type: 'fill',
                                source: 'counties',
                                paint: {
                                    'fill-color': [
                                        'let',
                                        'fips', ['to-string', ['get', 'FIPS']],
                                        [
                                            'case',
                                            ['has', ['var', 'fips'], ['literal', window.currentPopByFips]],
                                            [
                                                'interpolate',
                                                ['linear'],
                                                ['/',
                                                    ['ln', ['max', 1, ['to-number', ['get', ['var', 'fips'], ['literal', window.currentPopByFips]]]]],
                                                    ['ln', ['max', 1, maxPop]]
                                                ],
                                                0, colorMin,
                                                1, colorMax
                                            ],
                                            'rgb(200, 200, 200)'
                                        ]
                                    ],
                                    'fill-opacity': 0.7
                                }
                            })

                            map.addLayer({
                                id: 'counties-border',
                                type: 'line',
                                source: 'counties',
                                paint: {
                                    'line-color': '#000',
                                    'line-width': 0.5,
                                    'line-opacity': 0.3
                                }
                            })

                            // Re-add event listeners
                            addCountyMapEventListeners(map)
                        }
                    }
                })
            } catch (error) {
                console.error('Error updating map style:', error)
            }
        }
    }

    // Extract event listeners into a separate function for reuse
    function addCountyMapEventListeners(map) {
        // Mouse events for hover
        map.on('mousemove', 'counties-fill', (e) => {
            map.getCanvas().style.cursor = 'pointer'
            
            if (e.features.length > 0) {
                const feature = e.features[0]
                const fips = feature.properties.FIPS
                const countyName = feature.properties.NAME
                const pop = window.currentPopByFips[fips]
                
                if (window.currentPopup) {
                    window.currentPopup.remove()
                }

                let popupHTML = `<strong>${countyName}</strong><br/>FIPS: ${fips}<br/>`

                if (state.selectedDataset === 'language-proficiency') {
                    const categoryLabel = languageLabels[state.selectedLanguage]
                    popupHTML += `${categoryLabel}: ${pop ? pop.toLocaleString() : 'No data'}`
                } else {
                    const raceLabel = raceLabels[state.selectedRace]
                    const hispLabel = hispanicLabels[state.selectedHispanic]
                    popupHTML += `${raceLabel} (${hispLabel}): ${pop ? pop.toLocaleString() : 'No data'}`
                }
                
                window.currentPopup = new maplibregl.Popup({
                    closeButton: false,
                    closeOnClick: false
                })
                .setLngLat(e.lngLat)
                .setHTML(popupHTML)
                .addTo(map)
            }
        })

        map.on('mouseleave', 'counties-fill', () => {
            map.getCanvas().style.cursor = ''
            if (window.currentPopup) {
                window.currentPopup.remove()
                window.currentPopup = null
            }
        })

        // Click events for detailed info
        map.on('click', 'counties-fill', async (e) => {
            if (e.features.length > 0) {
                const feature = e.features[0]
                const fips = feature.properties.FIPS
                const countyName = feature.properties.NAME
                const stateFips = fips.substring(0, 2)
                const countyFips = fips.substring(2)
                
                const infoSidebar = document.getElementById('info-sidebar')
                const countyTitle = document.getElementById('county-title')
                const countyStats = document.getElementById('county-stats')
                const countyChart = document.getElementById('county-chart')
                
                countyTitle.textContent = countyName
                countyStats.innerHTML = '<p>Loading county details...</p>'
                countyChart.innerHTML = '<div class="loading-spinner"></div>'
                infoSidebar.classList.add('visible')
                
                await showCountyDetails(fips, countyName, stateFips, countyFips)
            }
        })
    }

    function renderStateMap(json){
        if (window.countyMap) {
            window.countyMap.remove();
            window.countyMap = null;
        }

        const isLanguageData = state.selectedDataset === 'language-proficiency';
        const rows = json.slice(1).map(row => {
            if (state.selectedDataset ==='race-ethnicity') {
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

        if (window.stateMap) {
            window.stateMap.remove()
        }

        const map=new maplibregl.Map({
            container: 'map',
            style: mapStyles[state.mapStyle],
            center: [-98.5795, 39.8283],
            zoom: 3,
        })

        window.stateMap = map

        window.currentStatePopByFips=popByState
        window.currentStateMinPop=minPop
        window.currentStateMaxPop=maxPop

        console.log(`Total states with data: ${rows.length}`);
        console.log(`Min state pop: ${minPop}, Max state pop: ${maxPop}`);

        let popup=null

        map.on('load', async()=> {
            const stateGeojson=await fetchStateGeoJSON()

            //add state FIPS to properties for easier access
            stateGeojson.features.forEach(feature => {
                if (feature.id) {
                    feature.properties.FIPS = feature.id.padStart(2, '0');
                }
            });

            const colorMin = isLanguageData ? 'rgb(240, 247, 255)' : 'rgb(255, 245, 240)';
            const colorMax = isLanguageData ? 'rgb(31, 119, 180)' : 'rgb(103, 0, 13)';

            map.addSource('states', {
                type: 'geojson',
                data: stateGeojson
            })

            map.addLayer({
                id: 'states-fill',
                type: 'fill',
                source: 'states',
                paint: {
                    'fill-color': [
                        'let',
                        'stateFips', ['to-string', ['get', 'FIPS']],
                        [
                            'case',
                            ['has', ['var', 'stateFips'], ['literal', popByState]],
                            [
                                'interpolate',
                                ['linear'],
                                ['/',
                                    ['ln', ['max', 1, ['to-number', ['get', ['var', 'stateFips'], ['literal', popByState]]]]],
                                    ['ln', ['max', 1, maxPop]]
                                ],
                                0, colorMin,
                                1, colorMax
                            ],  
                            'rgb(200, 200, 200)'
                        ]
                    ],
                    'fill-opacity': 0.7
                }
            })

            map.addLayer({
                id: 'states-border',
                type: 'line',
                source: 'states',
                paint: {
                    'line-color': '#000',
                    'line-width': 1,
                    'line-opacity': 0.5
                }
            })

            //render hover popup for states
            map.on('mousemove', 'states-fill', (e) => {
                map.getCanvas().style.cursor = 'pointer';

                if (e.features.length > 0) {
                    const feature = e.features[0];
                    const stateFips = feature.properties.FIPS;
                    const stateName = feature.properties.name;
                    const pop = window.currentStatePopByFips[stateFips];
                    
                    if (popup) {
                        popup.remove();
                    }
    
                    let popupHTML = `<strong>${stateName}</strong><br/>State FIPS: ${stateFips}<br/>`;
    
                    if (state.selectedDataset === 'language-proficiency') {
                        const categoryLabel = languageLabels[state.selectedLanguage];
                        popupHTML += `${categoryLabel}: ${pop ? pop.toLocaleString() : 'No data'}`;
                    } else {
                        const raceLabel = raceLabels[state.selectedRace];
                        const hispLabel = hispanicLabels[state.selectedHispanic];
                        popupHTML += `${raceLabel} (${hispLabel}): ${pop ? pop.toLocaleString() : 'No data'}`;
                    }
                    
                    popup = new maplibregl.Popup({
                        closeButton: false,
                        closeOnClick: false
                    })
                    .setLngLat(e.lngLat)
                    .setHTML(popupHTML)
                    .addTo(map);
                }
            });

            map.on('mouseleave', 'states-fill', () => {
                map.getCanvas().style.cursor = '';
                if (popup) {
                    popup.remove();
                    popup = null;
                }
            });

            const labels = { raceLabels, hispanicLabels, languageLabels }
            createLegend(minPop, maxPop, isLanguageData, 'state', state, labels)

            // add click functionality later...
        })
    }
    



    
window.addEventListener('resize', () => { if (state.selectedDataset) { window.countyMap && window.countyMap.resize(); window.stateMap && window.stateMap.resize(); }    

});

});



