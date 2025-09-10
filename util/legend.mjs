// legend creation and management functions

function createLegend(minVal,maxVal,isLanguageData,geography,appState,labels){
    const legend=document.getElementById('map-legend')
    // const legendTitle=document.querySelector('.legend-title')
    // const legendGradient = legend.querySelector('.legend-gradient')
    // const legendMin = legend.querySelector('.legend-min')
    // const legendMax = legend.querySelector('.legend-max')

    legend.innerHTML=''

    const titleDiv=document.createElement('div')
    titleDiv.className='legend-title'
    let title=''
    if(isLanguageData){
        const langLabel=labels.languageLabels[appState.selectedLanguage]
        title=`${langLabel} Population by ${geography}`
    } else {
        const raceLabel=labels.raceLabels[appState.selectedRace]
        const hispLabel=labels.hispanicLabels[appState.selectedHispanic]
        title=`${raceLabel} (${hispLabel}) Population by ${geography}`
    }
    titleDiv.textContent=title
    legend.appendChild(titleDiv)

    const gradientSection=document.createElement('div')
    gradientSection.className='legend-gradient'

    const gradientBar=document.createElement('div')
    gradientBar.className='legend-gradient-bar'

    const colorMin = isLanguageData ? 'rgb(240, 247, 255)' : 'rgb(255, 245, 240)'
    const colorMax = isLanguageData ? 'rgb(31, 119, 180)' : 'rgb(103, 0, 13)'

    gradientBar.style.background = `linear-gradient(to right, ${colorMin}, ${colorMax})`
    gradientBar.style.height = '15px'
    gradientBar.style.borderRadius = '3px'
    gradientBar.style.marginBottom = '5px'

    gradientSection.appendChild(gradientBar)

    const gradientLabels=document.createElement('div')
    gradientLabels.className='legend-gradient-labels'
    gradientLabels.style.cssText='display:flex; justify-content:space-between; font-size:10px; margin-bottom:10px;'

    const minLabel=document.createElement('div')
    minLabel.textContent=formatLegendNumbers(minVal)
    minLabel.style.cssText='background: rgba(255, 255, 255, 0.8); padding: 1px 3px; border-radius: 2px;'

    const maxLabel=document.createElement('div')
    maxLabel.textContent=formatLegendNumbers(maxVal)
    maxLabel.style.cssText='background: rgba(255, 255, 255, 0.8); padding: 1px 3px; border-radius: 2px;'

    gradientLabels.appendChild(minLabel);
    gradientLabels.appendChild(maxLabel);
    gradientSection.appendChild(gradientLabels);

    legend.appendChild(gradientSection)

    createSteppedLegend(legend,minVal,maxVal,isLanguageData)

    updateLegendTheme(appState.mapStyle)

    legend.style.display='block'

    
}

function createSteppedLegend(legendContainer,minVal,maxVal,isLanguageData){
    const breaks=generateColorBreaks(minVal,maxVal)

    const colors = generateSteppedColors(breaks.length - 1, isLanguageData);

    const stepsContainer=document.createElement('div')
    stepsContainer.className='legend-steps-container'
    stepsContainer.style.cssText = 'border-top: 1px solid #eee; padding-top: 8px; margin-top: 5px;';

    const stepsTitle = document.createElement('div');
    stepsTitle.className = 'legend-steps-title';
    stepsTitle.textContent = 'Value Ranges';
    stepsTitle.style.cssText = 'font-size: 10px; font-weight: bold; margin-bottom: 5px; color: #666;';
    stepsContainer.appendChild(stepsTitle);

    for (let i=0;i<breaks.length-1;i++){
        const stepDiv=document.createElement('div')
        stepDiv.className='legend-step'
        stepDiv.style.cssText = 'display: flex; align-items: center; margin-bottom: 3px; font-size: 10px;';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-step-color';
        colorBox.style.cssText = `
            width: 16px; 
            height: 12px; 
            background-color: ${colors[i]}; 
            margin-right: 6px; 
            border: 1px solid #ccc; 
            border-radius: 2px;
            flex-shrink: 0;
        `;

        const label = document.createElement('span');
        label.className = 'legend-step-label';
        label.style.color = '#555';

        if (i === 0) {
            label.textContent = `< ${formatLegendNumbers(breaks[1])}`;
        } else if (i === breaks.length - 2) {
            label.textContent = `≥ ${formatLegendNumbers(breaks[i])}`;
        } else {
            label.textContent = `${formatLegendNumbers(breaks[i])} - ${formatLegendNumbers(breaks[i + 1] - 1)}`;
        }
        
        stepDiv.appendChild(colorBox);
        stepDiv.appendChild(label);


        stepsContainer.appendChild(stepDiv)
    }

    legendContainer.appendChild(stepsContainer)
}

function generateColorBreaks(minVal,maxVal){
    const range=maxVal-minVal

    let breaks

    //linear breaks for smaller ranges
    if (range<=10000){
        breaks=[
            minVal,
            Math.round(minVal + range * 0.2),
            Math.round(minVal + range * 0.4),
            Math.round(minVal + range * 0.6),
            Math.round(minVal + range * 0.8),
            maxVal
        ]
    } else {    
        //predefined breaks
        breaks=[
            0,1000,5000,25000,100000,500000,1000000,5000000,10000000
        ].filter(b => b <= maxVal)

        if (breaks[0] !== minVal) {
            breaks.unshift(minVal);
        }
        if (breaks[breaks.length-1] < maxVal) {
            breaks.push(maxVal);
        }
    }

    return [...new Set(breaks)].sort((a,b)=>a-b) //remove duplicates
}

function generateSteppedColors(numColors,isLanguageData){
    if (isLanguageData){
        const startRGB=[240,247,255] //light blue
        const endRGB=[8,69,148] //dark blue
        return interpolateColors(startRGB,endRGB,numColors)
    } else {
        const startRGB=[255,245,240] //light red
        const endRGB=[165,15,21] //dark red
        return interpolateColors(startRGB,endRGB,numColors)
    }
}

// generate colors based on interpolation factor
function interpolateColors(startRGB, endRGB, steps){
    const colors=[]

    for (let i=0;i<steps;i++){
        const ratio=i/(steps-1)
        const r=Math.round(startRGB[0]+(endRGB[0]-startRGB[0])*ratio)
        const g=Math.round(startRGB[1]+(endRGB[1]-startRGB[1])*ratio)
        const b=Math.round(startRGB[2]+(endRGB[2]-startRGB[2])*ratio)
        colors.push(`rgb(${r},${g},${b})`)
    }
    return colors
}

//maplibre color expression template for interpolated stepped colors that match w legend
function createSteppedColorExpression(popByFips, minPop, maxPop, isLanguageData) {
    const breaks = generateColorBreaks(minPop, maxPop);
    const colors = generateSteppedColors(breaks.length - 1, isLanguageData);
    
    const stepExpression = [
        'step',
        ['to-number', ['get', ['to-string', ['get', 'FIPS']], ['literal', popByFips]]],
        colors[0] // Default color for values below first break
    ];
    
    // Add each break and its corresponding color
    for (let i = 1; i < breaks.length; i++) {
        stepExpression.push(breaks[i]);
        stepExpression.push(colors[i - 1] || colors[colors.length - 1]);
    }
    
    return [
        'case',
        ['has', ['to-string', ['get', 'FIPS']], ['literal', popByFips]],
        stepExpression,
        'rgb(200, 200, 200)' // No data color
    ];
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

export { createLegend, hideLegend, formatLegendNumbers, updateLegendTheme, createSteppedColorExpression }