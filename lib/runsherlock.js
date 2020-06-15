const {spawn} = require("child_process");
const fs = require("fs").promises;
const parse = require("csv-parse/lib/sync");
const path = require("path");
const os = require("os");
if(process.env.NODE_ENV !== "production" || true) require("./checkmodulesinstalled");
const CachedFileManager = require("./cachedfilemanager");
const sites = require("./getsherlockmodules")();
const sortedSites = Object.entries(sites).sort((site1, site2) => site1[1].rank - site2[1].rank);

const awaitExit = listener => {
    let hasResloved = false;
    return new Promise(resolve => {
        listener.on("exit", (...args) => {
            if(!hasResloved){
                hasResloved = true;
                resolve(...args);
            }
        });
    });
};

module.exports = async (username, timeout, real, page, pageSize, maxCacheSeconds) => {
    const outDir = real ? path.join(os.tmpdir(), "out" + Math.random() * 10**17) : path.join(__dirname, "..", "testresources");
    try{
        await fs.mkdir(outDir);
    }catch(e){
        if(e.code !== "EEXIST") throw e;
    }

    const cachePathName = `${username}.${page}.${pageSize}.${timeout}.csv`;
    const cachedFile = new CachedFileManager(cachePathName);
    await cachedFile.setup();

    const pageSites = sortedSites.map(site => site[0]).slice(pageSize * page, pageSize * (page + 1));
    if (pageSites.length < 1 || pageSites.length > pageSize) {
        const err = new Error("Page out of bounds!");
        err.code = "EOUTOFBOUNDS";
        throw err;
    }

    if(await cachedFile.isValid(maxCacheSeconds)){
        // nothing to do, the file's already cached
    }else {
        const csvFilePath = path.join(outDir, username + ".csv");

        // prepare the args to sherlock
        const baseArgs = [path.join(__dirname, "../sherlock/sherlock"), "--csv", "--rank", "--timeout", timeout.toString()];
        const sitesToSearch = pageSites.filter(site => site !== "Otzovik").map(site => ["--site", site]).flat();

        const args = baseArgs.concat(sitesToSearch).concat(username);

        // run sherlock
        const child = spawn(real ? "python3" : "echo", args, {cwd: outDir});
        child.on("error", console.error);

        // wait for the program to end
        await awaitExit(child);

        console.log("done: " + args.join(" "));
        const {exitCode} = child;
        if (exitCode !== 0) {
            throw new Error(`Process exited with status ${exitCode}\n`);
        }

        // move it to the cache
        if(real) await fs.rename(csvFilePath, cachedFile.cachePath);
    }

    const resData = (await fs.readFile(cachedFile.cachePath)).toString();
    const parsed = parse(resData, {columns: true});
    parsed.forEach(data => {
        data.http_status = parseInt(data.http_status, 10);
        data.response_time_s = parseFloat(data.response_time_s, 10);
        data.rank = sortedSites.filter(site => site[0] === data.name)[0][1].rank;
        if(data.name === "tracr.co") data.name = "tracr.co - Discord lookup";
        data.unreliable = ["YandexCollection", "4pda", "Houzz"].includes(data.name);
    });
    return parsed;
};

if(require.main === module){
    module.exports("realdonaldtrump", 20, true, 0, 30).then(data => fs.writeFile("testresources/realdonaldtrump.json", JSON.stringify(data, null, "  ")));
}
