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
        resp = await require("../lib/runsherlock")("realdonaldtrump", 20, false, 0, 30, 0);
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
        await require("../lib/runsherlock")("realdonaldtrump", 20, false, 1, 30, 0);
    });


    it("should throw EOUTOFBOUNDS on out of bounds", async () => {
        try{
            await require("../lib/runsherlock")("realdonaldtrump", 20, false, 10000, 30, 0);
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("Expected to throw but didn't!");
        }catch(e){
            if(e.code !== "EOUTOFBOUNDS") throw e;
        }
    });
});

describe("usernamefinders", function (){
    this.timeout(5000);

    it("should get no Minecraft usernames for \"noonewouldeverusethis7\"", async () => {
        const usernames = await require("../lib/usernamefinders/mojangapi")("noonewouldeverusethis7");
        assert.deepEqual(usernames, []);
    });

    it("should get no Minecraft usernames for \"test\"", async () => {
        const usernames = await require("../lib/usernamefinders/mojangapi")("test");
        assert.deepEqual(usernames, []);
    });

    it("should get correct Minecraft usernames for \"thisisepic\"", async () => {
        const usernames = await require("../lib/usernamefinders/mojangapi")("thisisepic");
        assert.deepEqual(usernames, [
            {
                username: 'epic9898',
                icon: 'https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/apple-icon-180x180.png',
                from: 'Previous Minecraft Username',
                lastUsed: new Date("2015-07-23T22:32:28.000Z")
            },
                {
                    username: 'Epic_Plays9898',
                        icon: 'https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/apple-icon-180x180.png',
                    from: 'Previous Minecraft Username',
                    lastUsed: new Date("2016-02-21T19:13:29.000Z")
                }
            ]
        );
    });

    it("should get no Steam usernames for \"test\"", async () => {
        const usernames = await require("../lib/usernamefinders/steamdbapi")("test");
        assert.deepEqual(usernames, []);
    });

    it("should get correct Steam usernames for \"test15\"", async () => {
        const date = new Date();
        const usernames = await require("../lib/usernamefinders/steamdbapi")("test15", date);
        assert.deepEqual(usernames, [{"username":"JWGOD","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":date},{"username":"................","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":new Date("2017-03-20T04:00:00.000Z")},{"username":"..............","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":new Date("2017-03-20T04:00:00.000Z")},{"username":"............","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":new Date("2017-03-20T04:00:00.000Z")},{"username":"..........","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":new Date("2017-03-20T04:00:00.000Z")},{"username":"........","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":new Date("2017-03-20T04:00:00.000Z")},{"username":"......","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":new Date("2017-03-20T04:00:00.000Z")},{"username":"....","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":new Date("2017-03-20T04:00:00.000Z")},{"username":"..","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":new Date("2017-03-20T04:00:00.000Z")},{"username":"Моча Воробья","icon":"https://store.steampowered.com/favicon.ico","from":"Previous Steam Username","lastUsed":new Date("2017-03-20T04:00:00.000Z")}]);
    });
});
