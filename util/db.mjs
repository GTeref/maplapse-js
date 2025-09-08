const DB_NAME='MapLapseDB'
const DB_VERSION=1
const STORE_NAME='mapData'

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
            const db = event.target.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store=db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' })
                store.createIndex('timestamp', 'timestamp', { unique: false })  
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

// initDB() //initialize DB on load

export { setCache, getCache, initDB }