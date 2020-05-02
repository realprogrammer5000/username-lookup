#!/usr/bin/env node

const express = require("express");
const runSherlock = require("./runsherlock");

const SITES_PER_PAGE = 30;

const app = express();

app.get("/lookup/:user", async (req, res) => {
    res.status(200).type("json");
    res.flushHeaders();

    let page = 0;
    try{
        const parsedPage = parseInt(req.query.page, 10);
        if(typeof parsedPage === "number" && parsedPage >= 0 && parsedPage === Math.round(parsedPage) && parsedPage < 10000000) page = parsedPage;
    }catch(e){}

    res.end(JSON.stringify(await runSherlock(req.params.user, 20000, true, page, SITES_PER_PAGE)));
});

app.get("/pages", (req, res) => {
    res.status(200).json({pages: Math.ceil(Object.keys(require("../sherlock/data")).length / SITES_PER_PAGE)});
});

app.listen(process.env.PORT || 8080, err => {
    if(err) throw err;
    console.log("Running on " + (process.env.PORT || 8080));
});
