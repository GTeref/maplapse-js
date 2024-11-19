lucide.createIcons()

let state={
    sidebarOpen: true,
    selectedDataset: 'Race and Ethnicity',
    currentYear: 2024,
    mapData: null
}

const sidebar = document.getElementById('sidebar')
const menuButton = document.getElementById('menu-button')
const sidebarToggle = document.getElementById('sidebar-toggle')
const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon')
const timeSlider = document.getElementById('time-slider')
const yearDisplay = document.getElementById('year-display')
const datasetInputs = document.querySelectorAll('input[name="dataset"]')

menuButton.addEventListener('click', toggleSidebar)
sidebarToggle.addEventListener('click', toggleSidebar)
timeSlider.addEventListener('input', handleTimeChange)

datasetInputs.forEach(input => {
    input.addEventListener('change', handleDatasetChange)
})

function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen
    sidebar.classList.toggle('closed', !state.sidebarOpen)
    sidebarToggleIcon.setAttribute('data-lucide', state.sidebarOpen ? 'chevron-left' : 'chevron-right')
    lucide.createIcons()
}

function handleTimeChange(e) {
    state.currentYear = parseInt(e.target.value)
    yearDisplay.textContent = state.currentYear
    fetchAndUpdateMap()
}

function handleDatasetChange(e) {
    state.selectedDataset = e.target.value
    fetchAndUpdateMap()
}

async function fetchAndUpdateMap() {
    const response = await fetch('https://api.census.gov/data/2019/pep/charagegroups?get=NAME,POP&RACE=1&for=state:*')
    const json = await response.json();
    const rows = json.slice(1).map(row => ({
        state: row[3].padStart(2, '0'),
        NAME: row[0],
        POP: row[1],
        RACE: row[2]
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
        locations: unpack(rows, 'state').map(code => codeToState[code.padStart(2, '0')]),
        z: unpack(rows, 'POP').map(Number),
        text: unpack(rows, 'NAME'),
        autocolorscale: true
        // locations: ['CA', 'TX', 'NY'], // Example states
        // z: [10000000, 20000000, 15000000], // Example population values
        // text: ['California', 'Texas', 'New York'],
        // autocolorscale: true
    }];

    var layout = {
        title: '2019 US Population by Selected Ethnicity',
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

fetchAndUpdateMap()

window.addEventListener('resize', () => { Plotly.Plots.resize('map') })
