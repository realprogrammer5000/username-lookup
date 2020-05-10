const assert = require("assert").strict;
const {spawnSync} = require("child_process");

describe("environment", () => {
    it("should have python3", function(){
        const {status} = spawnSync("python3", [`--version`]);
        assert.equal(status, 0);
    });
    it("should have pip3", function(){
        const {status} = spawnSync("pip3", [`--version`]);
        assert.equal(status, 0);
    });
});

describe("checkmodulesinstalled", () => {
    it("should install modules", function(done){
        // a big timeout because pip can be slow
        this.timeout(5000);
        setImmediate(() => {
            require("../lib/checkmodulesinstalled");
            done();
        });
    });
    it("should run sherlock", function(){
        const {status, stdout} = spawnSync("python3", ["sherlock/sherlock", "--version"]);
        assert.equal(status, 0);
        assert(stdout.length > 0);
    });
});

describe("getsherlockmodules", () => {
    it("should not crash", () => {
        require("../lib/getsherlockmodules")();
    });
    it("should have YouTube", () => {
        assert(require("../lib/getsherlockmodules")().YouTube);
    });
});

describe("runsherlock", () => {
    let resp;
    it("should not throw", async () => {
        resp = await require("../lib/runsherlock")("realdonaldtrump", 20, false, 0, 30);
    });

    it("should give modules on fake run", () => {
        assert(resp.length);
    });

    it("should have the correct number of modules", () => {
        assert.equal(resp.length, 30);
    });

    it("should have Facebook", () => {
        assert(resp.some(res => res.name === "Facebook" && res.url_user === "https://www.facebook.com/realdonaldtrump"));
    });

    it("should have ranks", () => {
        assert(resp.some(res => res.rank));
    });

    it("should not throw on second page", async () => {
        await require("../lib/runsherlock")("realdonaldtrump", 20, false, 1, 30);
    });


    it("should throw EOUTOFBOUNDS on out of bounds", async () => {
        try{
            await require("../lib/runsherlock")("realdonaldtrump", 20, false, 10000, 30);
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("Expected to throw but didn't!");
        }catch(e){
            if(e.code !== "EOUTOFBOUNDS") throw e;
        }
    });
});
