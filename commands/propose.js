async function propose(client, userID, message) {
    return await client.connect(async () => {
        const callTimes = client.db("HamChick").collection("callTimes");

        let userObj = await callTimes.findOne({
            "id": userID
        }).catch((err) => console.error(err));

        if (!userObj.pending_valentine.includes(message.author.id)) {
            userObj.pending_valentine.push(message.author.id);
            update = {
                $set: userObj
            };
            await callTimes.updateOne({
                "id": userID
            }, update).catch(err => console.error(err));
            message.channel.send(`Yoooooo! <@${userID}> I think you should really consider going out with <@${message.author.id}>. They are pretty cute :flushed:`)
        } else {
            message.channel.send(`<@${message.author.id}> I know you are desperate, but I didn't expect you to be that desperate!`)
        }
    });
}

module.exports = {
    name: "!propose",
    description: "Valentine's Special",
    execute(message, args) {
        if (!args[0] || args[0].replace(/[!<>@]/g, "") == String(message.author.id)) {
            message.channel.send("Sorry! I don't want to wingman for your right hand.")
        }
        let userID = args[0].replace(/[!<>@]/g, "");
        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        propose(client, userID, message);
    }
}