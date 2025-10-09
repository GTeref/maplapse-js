export function extractDataArray(raw){
    //array of arrays
    if(Array.isArray(raw)){
        if (raw.length>0 && Array.isArray(raw[0])){
            const [headers,...rows]=raw
            return rows.map(row=>
                Object.fromEntries(headers.map((h,i)=>[h,row[i]]))
            )
        }
        return raw    
    }

    //auto detect only
    const keys=['data', 'results', 'items', 'records', 'features']
    for (const key of keys){
        if (Array.isArray(raw[key])){
            console.log('Extracted data array from key:', key)
            return raw[key]
        }
    }

    //wrap single obj in array
    return [raw];

}

export function extractGeometry(raw){
    if (raw.type==='FeatureCollection'){
        return raw
    }

    if(raw.type==='Feature'){
        return {
            type:'FeatureCollection',
            features:[raw]
        }
    }

    if (raw.geojson) return this.extractGeometry(raw.geojson)
    if (raw.data?.geojson) return this.extractGeometry(raw.data.geojson)
    //throw in others as needed

    throw new Error('Unrecognized geometry format')
}

// detectTableFields(dataArray){
//     const userIdField = this.app.customData.tableIdField;
//     const userValueField = this.app.customData.tableNumericField;
    
//     if (userIdField && userValueField) {
//         return { idField: userIdField, valueField: userValueField };
//     }

//     //rudimentary auto detect

//     if (!dataArray.length) throw new Error('Empty data array');
    
//     const sample = dataArray[0];
//     const fields = Object.keys(sample);
    
//     const idPatterns = ['id', 'fips', 'geoid', 'code', 'state', 'county', 'region'];
//     const valuePatterns = ['value', 'population', 'pop', 'count', 'total', 'amount', 'estimate'];
    
//     const numericFields = fields.filter(f => {
//         const val = sample[f];
//         return !isNaN(parseFloat(val)) && isFinite(val);
//     });
    
//     const detectedId = userIdField || 
//         this.matchField(fields, idPatterns) || 
//         fields[0];
    
//     const detectedValue = userValueField || 
//         this.matchField(numericFields, valuePatterns) || 
//         numericFields[0];
    
//     console.log('Detected table fields:', { idField: detectedId, valueField: detectedValue });
    
//     return { 
//         idField: detectedId, 
//         valueField: detectedValue 
//     };
// }

// detectGeometryFields(geojson) {
//     const userIdField = this.app.customData.geometryIdField;
    
//     if (userIdField) {
//         return { idField: userIdField };
//     }
    
//     // Try to detect from first feature
//     if (geojson.features.length > 0) {
//         const props = geojson.features[0].properties;
//         const fields = Object.keys(props);
        
//         const idPatterns = ['id', 'geoid', 'fips', 'code', 'name'];
//         const detected = this.matchField(fields, idPatterns) || fields[0];
        
//         console.log('Detected geometry ID field:', detected);
//         return { idField: detected };
//     }
    
//     return { idField: 'id' };
// }

// matchField(fields, patterns) {
//     for (const pattern of patterns) {
//         //can prolly use regex as well
//         const match=fields.find(f=>
//             f.toLowerCase()===pattern.toLowerCase() ||
//             f.toLowerCase().includes(pattern.toLowerCase())
//         );
//         if (match) return match;
//     }
//     return null;
// }

export function normalizeTable(dataArray,fields) {

    const normalized = dataArray.map(row=>{
        const id= String(row[fields.idField] || '').trim();
        const rawValue= row[fields.valueField];
        const value= parseFloat(rawValue) //do we need to store original?
        return {
            id: id,
            value: isNaN(value) ? null : value,
            _original: row
        }

    }).filter(r=>r.id);
    console.log(`Normalized ${normalized.length} table rows`);
    return normalized;
}

export function normalizeGeometry(geojson,fields){
    const normalized={...geojson}

    normalized.features=geojson.features.map(f=>({
        ...f,
        properties:{
            ...f.properties,
            _normalized_id: String(f.properties[fields.idField] || f.id || '').trim()
        }
    }))
    console.log(`Normalized ${normalized.features.length} geometry features`);
    return normalized
}

export function joinData(table,geometry) {
    const lookup=new Map(
        table.map(row=>[row.id,row.value])
    )

    geometry.features.forEach(feature => {
        const id=feature.properties._normalized_id
        feature.properties.choropleth_value=lookup.get(id) || 0
    });

    return geometry
}
