// legend creation and management functions

function createLegend(minVal,maxVal,isLanguageData,geography,appState,labels){
    const legend=document.getElementById('map-legend')
    const legendTitle=document.querySelector('.legend-title')
    const legendGradient = legend.querySelector('.legend-gradient')
    const legendMin = legend.querySelector('.legend-min')
    const legendMax = legend.querySelector('.legend-max')

    const colorMin = isLanguageData ? 'rgb(240, 247, 255)' : 'rgb(255, 245, 240)'
    const colorMax = isLanguageData ? 'rgb(31, 119, 180)' : 'rgb(103, 0, 13)'

    legendGradient.style.background = `linear-gradient(to right, ${colorMin}, ${colorMax})`

    let title=''
    if(isLanguageData){
        const langLabel=languageLabels[appState.selectedLanguage]
        title=`${langLabel} Population by ${geography}`
    } else {
        const raceLabel=labels.raceLabels[appState.selectedRace]
        const hispLabel=labels.hispanicLabels[appState.selectedHispanic]
        title=`${raceLabel} (${hispLabel}) Population by ${geography}`
    }
    legendTitle.textContent=title

    legendMin.textContent=formatLegendNumbers(minVal)
    legendMax.textContent=formatLegendNumbers(maxVal)

    updateLegendTheme(appState.mapStyle)

    legend.style.display='block'

    
}

function updateLegendTheme(mapStyle){
    const legend=document.getElementById('map-legend')
    const isDarkTheme=mapStyle==='dark'
    legend.classList.toggle('dark-theme', isDarkTheme) //we probably need to have a more robust way to do this

}

function hideLegend(){
    const legend=document.getElementById('map-legend')
    legend.style.display='none'
}

function formatLegendNumbers(num){
    if(num>=1000000){
        return (num/1000000).toFixed(1)+'M'
    } else if(num>=1000){
        return (num/1000).toFixed(0)+'K'
    } else {
        return num.toLocaleString()
    }
}

export { createLegend, hideLegend, formatLegendNumbers, updateLegendTheme }