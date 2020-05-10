const {spawn} = require("child_process");
const fs = require("fs").promises;
const parse = require("csv-parse/lib/sync");
const path = require("path");
if(process.env.NODE_ENV !== "production") require("./checkmodulesinstalled");
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

module.exports = async (username, timeout, real, page, pageSize) => {
    const outDir = real ? path.join(__dirname, "..", "out") : path.join(__dirname, "..", "testresources");
    try{
        await fs.mkdir("out");
    }catch(e){
        if(e.code !== "EEXIST") throw e;
    }

    const pageSites = sortedSites.map(site => site[0]).slice(pageSize * page, pageSize * (page + 1));
    if(pageSites.length < 1 || pageSites.length > pageSize){
        const err = new Error("Page out of bounds!");
        err.code = "EOUTOFBOUNDS";
        throw err;
    }

    const baseArgs = ["../sherlock/sherlock", "--csv", "--rank", "--timeout", timeout.toString()];
    const sitesToSearch = pageSites.filter(site => site !== "Otzovik").map(site => ["--site", site]).flat();

    const args = baseArgs.concat(sitesToSearch).concat(username);

    const child = spawn(real ? "python3" : "echo", args, {cwd: outDir});
    child.on("error", console.error);

    await awaitExit(child);

    console.log("done: " + args.join(" "));
    const {exitCode} = child;
    if (exitCode !== 0) {
        throw new Error(`Process exited with status ${exitCode}\n`);
    }

    const resData = (await fs.readFile(path.join(outDir, username + ".csv"))).toString();
    const parsed = parse(resData, {columns: true});
    parsed.forEach(data => {
        data.http_status = parseInt(data.http_status, 10);
        data.response_time_s = parseFloat(data.response_time_s, 10);
        data.rank = sortedSites.filter(site => site[0] === data.name)[0][1].rank;
        if(data.name === "tracr.co") data.name = "tracr.co - Discord lookup";
        data.unreliable = ["YandexCollection", "Investing.com", "4pda", "500px"].includes(data.name);
    });
    return parsed;
};

if(require.main === module){
    module.exports("realdonaldtrump", 20, true, 0, 30).then(data => fs.writeFile("testresources/realdonaldtrump.json", JSON.stringify(data, null, "  ")));
}
