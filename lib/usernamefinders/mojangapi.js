const fetch = require("node-fetch");

module.exports = async (username) => {
    // get the uid of the username
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    // 204 or 404 can be returned
    if(res.status !== 200) return [];
    const {id} = await res.json();

    // get historic usernames for that uuid
    const namesRes = await fetch(`https://api.mojang.com/user/profiles/${id}/names`);

    // grab the names
    return (await namesRes.json()).
    // convert it to the old name object format
    map((userObj, idx, arr) => (
        {
            username: userObj.name,
            icon: "https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/apple-icon-180x180.png",
            from: "Previous Minecraft Username",
            lastUsed: arr[idx + 1] && new Date(arr[idx + 1].changedToAt)
        }
    )).
    // don't include the current username
    filter(userObj => userObj.username.toLowerCase() !== username.toLowerCase());
};
