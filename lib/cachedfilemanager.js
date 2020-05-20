const path = require("path");
const fs = require("fs").promises;
const os = require("os");

class CachedFileManager {
    constructor(cachePathName){
        this.cachePathName = cachePathName;
    }

    async setup(){
        const cacheDir = path.join(os.tmpdir(), "sherlock-cache");
        try{
            await fs.mkdir(cacheDir);
        }catch(e){
            if(e.code !== "EEXIST") throw e;
        }

        this.cachePath = path.join(cacheDir, this.cachePathName);
    }

    async isValid(maxCacheSeconds){
        let stats;
        try{
            stats = await fs.stat(this.cachePath);
        }catch(e){
            if(e.code !== "ENOENT") throw e;
        }

        const isValid = stats && (new Date() - stats.birthtime) / 1000 < maxCacheSeconds;
        if(isValid){
            console.log(`cache hit: ${this.cachePathName} was ${(new Date - stats.birthtime) / 1000} seconds old out of ${maxCacheSeconds}`);
        }else{
            console.log(`cache miss: ${this.cachePathName} ${stats ? `was ${(new Date - stats.birthtime) / 1000} seconds old out of ${maxCacheSeconds}` : "was not in cache"}`);
        }
        return isValid;
    }
}

module.exports = CachedFileManager;
