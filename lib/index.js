#!/usr/bin/env node

const express = require("express");
const cors = require("cors");
const runSherlock = require("./runsherlock");
const path = require("path");
const fs = require("fs").promises;

const SITES_PER_PAGE = 10;
const MAX_CACHE_SECONDS = 60 * 60 * 5;// cache everything for 5 hours

const app = express();
app.use(cors());

app.get("/alternateusernames/:user", async (req, res) => {
    if(!req.params.user || !req.params.user.length || req.params.user.length > 100){
        return res.status(500).json({error: "EINVALIDUSERNAME"});
    }

    const usernameFindersPath = path.join(__dirname, "usernamefinders");
    const usernameFinders = await fs.readdir(usernameFindersPath);

    const resultUsernamesPromises = [];
    // allow all the username finders to run in parallel to improve response time
    for(const usernameFinder of usernameFinders){
        resultUsernamesPromises.push((async () =>
            await require(path.join(usernameFindersPath, usernameFinder))(req.params.user)
        )());
    }
    return res.status(200).json(await Promise.all(resultUsernamesPromises));
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

app.listen(process.env.PORT || 8080, err => {
    if(err) throw err;
    console.log("Running on " + (process.env.PORT || 8080));
});
