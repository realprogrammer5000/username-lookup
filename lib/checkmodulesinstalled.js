const {spawnSync} = require("child_process");
const path = require("path");
const fs = require("fs");

if(status !== 0){
    throw new Error(`Process exited with status ${status} / signal ${signal}:\n${stdout}\n${stderr}`);
}
