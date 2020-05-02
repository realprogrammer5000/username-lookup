const {spawnSync} = require("child_process");
const path = require("path");

const {status, signal, stdout, stderr} = spawnSync("pip3", `install -r requirements.txt`.split(" "), {cwd: path.join(__dirname, "..", "sherlock")});
if(status !== 0){
    throw new Error(`Process exited with status ${status} / signal ${signal}:\n${stdout}\n${stderr}`);
}
