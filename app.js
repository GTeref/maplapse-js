document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();

    const sidebar = document.getElementById('sidebar')
    const menuButton = document.getElementById('menu-button')
    const sidebarToggle = document.getElementById('sidebar-toggle')
    const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon')
    const timeSlider = document.getElementById('time-slider')
    const yearDisplay = document.getElementById('year-display')
    const datasetInputs = document.querySelectorAll('input[name="dataset"]')

    const raceOptions = document.getElementById('race-options')
    const raceSelect = document.getElementById('race-select')
    const hispSelect = document.getElementById('hispanic-select')

    const mapPlaceholder = document.getElementById('map-placeholder')

    let state={
        sidebarOpen: true,
        selectedDataset: null,
        currentYear: 2024,
        mapData: null,
        selectedRace: '1',
        selectedHispanic: '0'
    }

    raceSelect.disabled = true;
    hispSelect.disabled = true;

    menuButton.addEventListener('click', toggleSidebar)
    sidebarToggle.addEventListener('click', toggleSidebar)
    timeSlider.addEventListener('input', handleTimeChange)

    datasetInputs.forEach(input => {
        input.addEventListener('change', handleDatasetChange)
    })

    raceSelect.addEventListener('change', handleRaceChange)
    hispSelect.addEventListener('change', handleHispanicChange)

    //toggleRaceOptions()

    function toggleSidebar() {
        state.sidebarOpen = !state.sidebarOpen
        sidebar.classList.toggle('closed', !state.sidebarOpen)
        sidebarToggleIcon.setAttribute('icon-name', state.sidebarOpen ? 'chevron-left' : 'chevron-right')
        lucide.createIcons()
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
        toggleRaceOptions()

        const isRaceDataset = state.selectedDataset === 'Race and Ethnicity'
        raceSelect.disabled = !isRaceDataset
        hispSelect.disabled = !isRaceDataset

        if (state.selectedDataset) {
            mapPlaceholder.style.display = 'none'
            fetchAndUpdateMap()
        } else {
            mapPlaceholder.style.display = 'block'
            Plotly.purge('map')
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

    async function fetchAndUpdateMap() {
        if (!state.selectedDataset) {
            console.log("no dataset selected; map will not render")
            return
        }

        console.log('Current state:', {
            dataset: state.selectedDataset,
            race: state.selectedRace,
            hispanic: state.selectedHispanic,
            year: state.currentYear
        });

        // fetch data from the dropdown menus to feed into url
        const hispParam = state.selectedDataset === 'Race and Ethnicity' ? `&HISP=${state.selectedHispanic}` : '';
        const raceParam = state.selectedDataset === 'Race and Ethnicity' ? `&RACE=${state.selectedRace}` : '';

        const nameField = state.currentYear <= 2018 ? 'GEONAME' : 'NAME'

        let requestURL = `https://api.census.gov/data/${state.currentYear}/pep/charagegroups?get=${nameField},POP${raceParam}${hispParam}&for=state:*`

        const response = await fetch(requestURL)
        console.log("Fetching from:", requestURL)
        const json = await response.json();
        const rows = json.slice(1).map(row => ({
            state: row[4],
            NAME: row[0],
            POP: row[1],
            RACE: row[2],
            HISP: row[3]
        }));

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
            autocolorscale: true
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

        let title = `${state.currentYear} US Population`;
        if (state.selectedDataset === 'Race and Ethnicity') {
            title += ` - ${raceLabels[state.selectedRace]} (${hispanicLabels[state.selectedHispanic]})`;
        }

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



