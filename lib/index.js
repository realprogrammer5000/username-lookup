#!/usr/bin/env node

const express = require("express");
const runSherlock = require("./runsherlock");

express().get("/lookup/:user", async (req, res) => {
    res.status(200);
    res.json(await runSherlock(req.params.user));
}).listen(process.env.PORT || 8080, err => {
    if(err) throw err;
    console.log("Running on " + (process.env.PORT || 8080));
});
