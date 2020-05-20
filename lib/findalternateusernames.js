const path = require("path");
const fs = require("fs").promises;

module.exports = async username => {
    const usernameFindersPath = path.join(__dirname, "usernamefinders");
    const usernameFinders = await fs.readdir(usernameFindersPath);

    const resultUsernamesPromises = [];
    // allow all the username finders to run in parallel to improve response time
    for(const usernameFinder of usernameFinders){
        resultUsernamesPromises.push((async () =>
                await require(path.join(usernameFindersPath, usernameFinder))(username)
        )());
    }
    return (await Promise.all(resultUsernamesPromises)).flat();
};
