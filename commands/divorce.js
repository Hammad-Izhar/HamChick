async function divorce(client, userID, message) {
    return await client.connect(async () => {
        const callTimes = client.db("HamChick").collection("callTimes");

        userObj = await callTimes.findOne({
            "id": message.author.id
        }).catch((err) => console.error(err));

        if (userObj.valentine.includes(userID)) {
            userObj.valentine.splice(userObj.valentine.indexOf(userID), 1);
            let update = {
                $set: userObj
            };
            await callTimes.updateOne({
                "id": message.author.id
            }, update).catch(err => console.error(err));

            let userObj2 = await callTimes.findOne({
                "id": userID
            }).catch(err => console.error(err))
            userObj2.valentine.splice(userObj2.valentine.indexOf(message.author.id), 1);
            update = {
                $set: userObj2
            }
            await callTimes.updateOne({
                "id": userID
            }, update).catch(err => console.error(err));
            message.channel.send(`Yeah <@${userID}>, it's very clearly you and not <@${message.author.id}> 💔`);
        } else {
            message.channel.send(`<@${message.author.id}> I know you are desperate, but I didn't expect you to be that desperate!`);
        }
    });
}

module.exports = {
    name: "!divorce",
    description: "Valentine's Special",
    execute(message, args) {
        if (!args[0] || args[0].replace(/[!<>@]/g, "") == String(message.author.id)) {
            message.channel.send("Yeah, don't know what you were expecting trying to divorce yourself.")
        }
        let userID = args[0].replace(/!<>@/, "");
        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        divorce(client, userID, message);
    }
}