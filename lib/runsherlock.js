const {spawn} = require("child_process");
const fs = require("fs").promises;
const parse = require("csv-parse/lib/sync");
const path = require("path");
require("./checkmodulesinstalled");
const sites = require("./getsherlockmodules")();


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

module.exports = async (username, timeout, real = true) => {
    const outDir = real ? path.join(__dirname, "..", "out") : path.join(__dirname, "..", "testresources");
    try{
        await fs.mkdir("out");
    }catch(e){
        if(e.code !== "EEXIST") throw e;
    }

    const baseArgs = ["../sherlock/sherlock.py", "--csv", "--timeout", timeout.toString()];
    const sitesToSearch = Object.keys(sites).filter(site => site !== "Otzovik").map(site => ["--site", site]).flat();

    const args = baseArgs.concat(sitesToSearch).concat(username);
    const child = spawn(real ? "python3" : "echo", args, {cwd: outDir});
    child.on("error", console.error);

    await awaitExit(child);
    const {exitCode} = child;
    if (exitCode !== 0) {
        throw new Error(`Process exited with status ${exitCode}\n`);
    }

    const resData = (await fs.readFile(path.join(outDir, username + ".csv"))).toString();
    return parse(resData, {columns: true});
};

if(require.main === module){
    module.exports("realdonaldtrump", 20000, true);
}
