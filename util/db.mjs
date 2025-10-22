const DB_NAME='MapLapseDB'
const DB_VERSION=2
const STORE_NAME='mapData'
const PRESET_STORE_NAME='customPresets'

// use IndexedDB to cache map data locally and persistently across sessions

//initialize database
async function initDB(){
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = (event) => {
            console.error('Database error:', event.target.error)
            reject(request.error)
        }
        request.onsuccess = (event) => resolve(request.result)
        
        request.onupgradeneeded = (event) => {
            //map data store
            const db = event.target.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store=db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' })
                store.createIndex('timestamp', 'timestamp', { unique: false })  
                console.log('Created object store for map data cache')
            }

            //custom presets store
            if (!db.objectStoreNames.contains(PRESET_STORE_NAME)) {
                const presetStore=db.createObjectStore(PRESET_STORE_NAME, { keyPath: 'id' })
                presetStore.createIndex('timestamp', 'timestamp', { unique: false })
                presetStore.createIndex('name', 'name', { unique: true }) //preset names must be unique
                console.log('Created object store for custom presets')
            }
        }
    })
}

//store data
async function setCache(cacheKey, data){
    try {
        const db = await initDB()
        const transaction=db.transaction([STORE_NAME], 'readwrite')
        const store=transaction.objectStore(STORE_NAME)

        const cacheData={
            cacheKey: cacheKey,
            data: data,
            timestamp: Date.now()
        }

        await new Promise((resolve, reject) => {
            const request=store.put(cacheData)
            request.onsuccess=() => resolve()
            request.onerror=() => reject(request.error)
        })
    } catch (e) {
        console.error('setCache error:', e)
        return null;
    }
}

//retrieve data
async function getCache(cacheKey){
    try {
        const db = await initDB()
        const transaction=db.transaction([STORE_NAME], 'readonly')
        const store=transaction.objectStore(STORE_NAME)

        return new Promise((resolve, reject) => {
            const request=store.get(cacheKey)
            request.onsuccess=()=>{
                const result=request.result
                if (result){
                    console.log(`Found cached data for key: ${cacheKey}`)
                    resolve(result.data)
                } else {
                    resolve(null)
                }
            }
            request.onerror=()=>reject(request.error)
        })

    } catch (e) {
        console.error('getCache error:', e)
        return null;
    }
}

//preset functions
async function savePreset(preset){
    try {
        const db = await initDB()
        const transaction=db.transaction([PRESET_STORE_NAME], 'readwrite')
        const store=transaction.objectStore(PRESET_STORE_NAME)

        await new Promise((resolve, reject) => {
            const request=store.put(preset)
            request.onsuccess=()=>resolve()
            request.onerror=()=>reject(request.error)
        })
        console.log('Preset saved:', preset)
    } catch (e) {
        console.error('savePreset error:', e)
        throw e
    }
}

async function getAllPresets(){
    try {
        const db = await initDB()
        const transaction=db.transaction([PRESET_STORE_NAME], 'readonly')
        const store=transaction.objectStore(PRESET_STORE_NAME)

        return new Promise((resolve, reject) => {
            const request=store.getAll()
            request.onsuccess=()=>{
                const presets=request.result || []
                console.log(`Retrieved ${presets.length} presets from IndexedDB`)
                resolve(presets)
            }
            request.onerror=()=>reject(request.error)
        })
    } catch (e) {
        console.error('getAllPresets error:', e)
        throw e
    }
}

async function deletePreset(presetId){
    try {
        const db = await initDB()
        const transaction=db.transaction([PRESET_STORE_NAME], 'readwrite')
        const store=transaction.objectStore(PRESET_STORE_NAME)

        await new Promise((resolve, reject) => {
            const request=store.delete(presetId)
            request.onsuccess=()=>resolve()
            request.onerror=()=>reject(request.error)
        })
        console.log('Preset deleted:', presetId)
    } catch (e) {
        console.error('deletePreset error:', e)
        throw e
    }
}

// initDB() //initialize DB on load

export { setCache, getCache, initDB, savePreset, getAllPresets, deletePreset }