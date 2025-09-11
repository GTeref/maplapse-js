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

async function fetchCountyGeoJSON(){
    try{
        const response=await fetch('https://gist.githubusercontent.com/sdwfrost/d1c73f91dd9d175998ed166eb216994a/raw/e89c35f308cee7e2e5a784e1d3afc5d449e9e4bb/counties.geojson')
        if (!response.ok) throw new Error('Failed to fetch county data')
        return await response.json()
    }   catch(e){
        console.error('Error fetching county geojson:',error)
        throw error
    }
}

export { fetchCountyGeoJSON, fetchStateGeoJSON }