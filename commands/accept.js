async function accept(client, userID, message) {
    return await client.connect(async () => {
        const callTimes = client.db("HamChick").collection("callTimes");

        userObj = await callTimes.findOne({
            "id": message.author.id
        }).catch((err) => console.error(err));

        if (userObj.pending_valentine.includes(userID)) {
            userObj.pending_valentine.splice(userObj.pending_valentine.indexOf(userID), 1);
            userObj.valentine.push(userID);
            let update = {
                $set: userObj
            };
            await callTimes.updateOne({
                "id": message.author.id
            }, update).catch(err => console.error(err));

            let userObj2 = await callTimes.findOne({
                "id": userID
            }).catch(err => console.error(err))
            userObj2.valentine.push(message.author.id);
            update = {
                $set: userObj2
            }
            await callTimes.updateOne({
                "id": userID
            }, update).catch(err => console.error(err));

            message.channel.send(`Awwww! <@${message.author.id}> and <@${userID}> make such a cute couple! 🕊`);
        } else {
            message.channel.send("Either that person doesn't exist or they don't like you enough to ask you out. :person_shrugging:")
        }
    });
}

module.exports = {
    name: "!accept",
    description: "Valentine's Special",
    execute(message, args) {
        if (!args[0]) {
            message.channel.send("...")
        }
        let userID = args[0].replace(/[!<>@]/, "");
        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        accept(client, userID, message);
    }
}