document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();

    const sidebar = document.getElementById('sidebar')
    const menuButton = document.getElementById('menu-button')
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

    const MAPBOX_TOKEN='pk.eyJ1IjoiZ3RlcmVmIiwiYSI6ImNsdmU0Zmk3dzA1d3cycHA2b2R2MnZlengifQ.-P6AWaRKH710if95HmVTEA' // we should hide this lol

    let state={
        sidebarOpen: true,
        region: '',
        geographyLevel: '',
        selectedDataset: null,
        currentYear: 2019,
        mapData: null,
        selectedRace: '1',
        selectedHispanic: '0',
        selectedLanguage: '2'
    }

    // dataset configurations
    const datasetConfig={
        US:{
            state:[
                {value: 'race-ethnicity', label: 'Race and Ethnicity', options: 'race-options'},
                {value: 'language-proficiency', label: 'Language Proficiency', options: 'language-options'}
            ],
            county:[
                {value: 'race-ethnicity', label: 'Race and Ethnicity', options: 'race-options'}
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

    //toggleRaceOptions()

    function toggleSidebar() {
        state.sidebarOpen = !state.sidebarOpen
        sidebar.classList.toggle('closed', !state.sidebarOpen)
        sidebarToggleIcon.setAttribute('icon-name', state.sidebarOpen ? 'chevron-left' : 'chevron-right')
        lucide.createIcons()
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
        state.currentYear = parseInt(e.target.value)
        yearDisplay.textContent = state.currentYear
        if (state.selectedDataset) {
            fetchAndUpdateMap()
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

        mapPlaceholder.textContent='Select a region to get started'
        mapPlaceholder.style.display='block'
    }

    function resetDatasetSelections() {
        datasetSelect.value=''
        datasetSelect.disabled=true
        showElement(datasetGroup,false)
        showElement(datasetOptions,false)
        timeSlider.disabled=true

        if (state.region && !state.geographyLevel){
            mapPlaceholder.textContent='Select a geography level'
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

        // fetch data from the dropdown menus to feed into url
        const hispParam = state.selectedDataset === 'race-ethnicity' ? `&HISP=${state.selectedHispanic}` : '';
        const raceParam = state.selectedDataset === 'race-ethnicity' ? `&RACE=${state.selectedRace}` : '';
        const langParam=state.selectedDataset==='language-proficiency' ? `&LAN7=${state.selectedLanguage}`: ''

        let requestURL;
        if (state.selectedDataset==='race-ethnicity') {
            const nameField = state.currentYear <= 2018 ? 'GEONAME' : 'NAME'
            requestURL= `https://api.census.gov/data/${state.currentYear}/pep/charagegroups?get=${nameField},POP${raceParam}${hispParam}&for=state:*`
        } else if (state.selectedDataset==='language-proficiency') {
            requestURL = `https://api.census.gov/data/2013/language?get=EST,LANLABEL,NAME&for=state:*${langParam}`
        }
        

        const response = await fetch(requestURL)
        console.log("Fetching from:", requestURL)
        const json = await response.json();
        const rows = json.slice(1).map(row => {
            if (state.selectedDataset ==='race-ethnicity') {
                return {
                    state: row[4],
                    NAME: row[0],
                    POP: row[1],
                    RACE: row[2],
                    HISP: row[3]
                }
            } else {
                return {
                    state: row[4],
                    NAME: row[2],
                    POP: row[0],
                    LANG: row[1]
                }
            }
            
        });

        function unpack(rows, key) {
            return rows.map(row => row[key]);
        }

        // US Census represents states with codes instead of abbreviations (01, 02 instead of AK, AS), so we need to map each code to its state first
        const codeToState = {
            "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
            "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
            "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
            "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
            "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
            "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
            "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
            "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
            "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
            "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
            "56": "WY"
        }

        console.log("Locations:", unpack(rows, 'state').map(code => codeToState[code.padStart(2, '0')]));
        console.log("Population (z):", unpack(rows, 'POP').map(Number));

        var plotData = [{
            type: 'choropleth',
            locationmode: 'USA-states',
            locations: unpack(rows, 'state').map(code => codeToState[code]),
            z: unpack(rows, 'POP').map(Number),
            text: unpack(rows, 'NAME'),
            colorscale: state.selectedDataset === 'language-proficiency' ? [
                [0, 'rgb(240, 247, 255)'],  // light blue
                [1, 'rgb(31, 119, 180)']    // dark blue
            ] : [
                [0, 'rgb(255, 245, 240)'],  // light red
                [1, 'rgb(103, 0, 13)']      // dark red
            ]
            //autocolorscale: true
            // locations: ['CA', 'TX', 'NY'], // Example states
            // z: [10000000, 20000000, 15000000], // Example population values
            // text: ['California', 'Texas', 'New York'],
            // autocolorscale: true
        }];

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

        let title = state.selectedDataset === 'race-ethnicity' 
        ? `${state.currentYear} US Population - ${raceLabels[state.selectedRace]} (${hispanicLabels[state.selectedHispanic]})`
        : `2013 US Population - ${languageLabels[state.selectedLanguage]}`;

        var layout = {
            title: title,
            geo: {
                scope: 'usa',
                countrycolor: 'rgb(255, 255, 255)',
                showland: true,
                landcolor: 'rgb(217, 217, 217)',
                showlakes: true,
                lakecolor: 'rgb(255, 255, 255)',
                subunitcolor: 'rgb(255, 255, 255)',
                // lonaxis: {}, 
                // lataxis: {}
            }
            };

        //const mapDiv = DOM.element('div');
        Plotly.newPlot('map', plotData, layout, {showLink: false});
        //return mapDiv;
    }

    //fetchAndUpdateMap()

    window.addEventListener('resize', () => { if (state.selectedDataset) { Plotly.Plots.resize('map') } })

});



