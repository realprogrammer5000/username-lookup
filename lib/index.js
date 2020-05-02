#!/usr/bin/env node

const express = require("express");
const cors = require("cors");
const runSherlock = require("./runsherlock");

const SITES_PER_PAGE = 10;

const app = express();
app.use(cors());

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
        const data = await runSherlock(req.params.user, timeout, true, page, SITES_PER_PAGE);
        res.end(JSON.stringify(data));
    }catch(e){
        if(e.code === "EOUTOFBOUNDS"){
            res.end(JSON.stringify({error: "EOUTOFBOUNDS"}));
        }
    }
});

app.get("/pages", (req, res) => {
    res.status(200).json({pages: Math.ceil(Object.keys(require("../sherlock/data")).length / SITES_PER_PAGE)});
});

app.listen(process.env.PORT || 8080, err => {
    if(err) throw err;
    console.log("Running on " + (process.env.PORT || 8080));
});
