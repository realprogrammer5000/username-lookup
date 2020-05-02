const {spawn} = require("child_process");
const fs = require("fs").promises;
const parse = require("csv-parse/lib/sync");
const path = require("path");
if(process.env.NODE_ENV !== "production") require("./checkmodulesinstalled");
const sites = require("./getsherlockmodules")();
const sortedSites = Object.entries(sites).sort((site1, site2) => site1[1].rank - site2[1].rank).map(site => site[0]);

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

module.exports = async (username, timeout, real, page, pageSize) => {
    const outDir = real ? path.join(__dirname, "..", "out") : path.join(__dirname, "..", "testresources");
    try{
        await fs.mkdir("out");
    }catch(e){
        if(e.code !== "EEXIST") throw e;
    }

    const pageSites = sortedSites.slice(pageSize * page, pageSize * (page + 1));
    if(pageSites.length < 1 || pageSites.length > pageSize) throw new Error("Page out of bounds!");

    const baseArgs = ["../sherlock/sherlock.py", "--csv", "--rank", "--timeout", timeout.toString()];
    const sitesToSearch = pageSites.filter(site => site !== "Otzovik").map(site => ["--site", site]).flat();

    const args = baseArgs.concat(sitesToSearch).concat(username);
    const child = spawn(real ? "python3" : "echo", args, {cwd: outDir});
    child.on("error", console.error);

    await awaitExit(child);
    const {exitCode} = child;
    if (exitCode !== 0) {
        throw new Error(`Process exited with status ${exitCode}\n`);
    }

    const resData = (await fs.readFile(path.join(outDir, username + ".csv"))).toString();
    const parsed = parse(resData, {columns: true});
    parsed.forEach((data, idx) => {
        data.http_status = parseInt(data.http_status, 10);
        data.response_time_ms = parseInt(data.response_time_ms, 10);
        data.rank = idx;
    });
    return parsed;
};

if(require.main === module){
    module.exports("realdonaldtrump", 20000, true, 0, 30).then(data => fs.writeFile("testresources/realdonaldtrump.json", JSON.stringify(data, null, "  ")));
}
