#!/usr/bin/env node
const express = require("express");
const cors = require("cors");
const runSherlock = require("./runsherlock");
const findAltUsernames = require("./findalternateusernames");
const CachedFileManager = require("./cachedfilemanager");
const fs = require("fs").promises;

const SITES_PER_PAGE = 10;
const MAX_CACHE_SECONDS = 60 * 60 * 5;// cache everything for 5 hours

const app = express();
app.use(cors());

app.get("/alternateusernames/:user", async (req, res) => {
    if(!req.params.user || !req.params.user.length || req.params.user.length > 100){
        return res.status(500).json({error: "EINVALIDUSERNAME"});
    }

    const cachedFile = new CachedFileManager(`${req.params.user}.alternateusernames.json`);
    await cachedFile.setup();

    let data;

    if(await cachedFile.isValid(MAX_CACHE_SECONDS)){
        data = JSON.parse(((await fs.readFile(cachedFile.cachePath)).toString()));
    }else{
        data = await findAltUsernames(req.params.user);
        await fs.writeFile(cachedFile.cachePath, JSON.stringify(data));
    }
    return res.status(200).json(data);
});

app.get("/lookup/:user", async (req, res) => {
    res.status(200).type("json");
    res.flushHeaders();

    let page = 0;
    try{
        const parsedPage = parseInt(req.query.page, 10);
        if(typeof parsedPage === "number" && parsedPage >= 0 && parsedPage === Math.round(parsedPage) && parsedPage < 10000000) page = parsedPage;
    }catch(e){}

    let timeout = 20;
    try{
        const parsedTimeout = parseInt(req.query.timeout, 10);
        if(typeof parsedTimeout === "number" && parsedTimeout >= 0.5 && parsedTimeout < 60) timeout = parsedTimeout;
    }catch(e){}

    try {
        const data = await runSherlock(req.params.user, timeout, true, page, SITES_PER_PAGE, MAX_CACHE_SECONDS);
        res.end(JSON.stringify(data));
    }catch(e){
        if(e.code === "EOUTOFBOUNDS"){
            res.end(JSON.stringify({error: "EOUTOFBOUNDS"}));
        }else{
            throw e;
        }
    }
});

app.get("/pages", (req, res) => {
    res.status(200).json({pages: Math.ceil(Object.keys(require("./getsherlockmodules")()).length / SITES_PER_PAGE)});
});

app.get("/", (req, res) => {
    res.status(204).end();
});

app.listen(process.env.PORT || 8080, err => {
    if(err) throw err;
    console.log("Running on " + (process.env.PORT || 8080));
});
