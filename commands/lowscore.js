async function lowscore(client, userID, message) {
    return await client.connect(async () => {
        try {
            const callTimes = client.db('HamChick').collection('callTimes');
            let userObj = await callTimes.findOne({
                'id': userID
            });
            let time = userObj.lowscore;
            if (time >= 3600) {
                time = (time / 3600).toFixed(2);
                message.channel.send(`<@${userID}>'s shortest call time is ${time} hours!`);
            } else if (time >= 60) {
                time = (time / 60).toFixed(2);
                message.channel.send(`<@${userID}>'s shortest call time is ${time} minutes!`);
            } else {
                message.channel.send(`<@${userID}>'s shortest call time is ${time} seconds!`);
            }
        } catch (err) {
            console.err(err);
        }
    });
}

module.exports = {
    name: "!lowscore",
    description: "",
    execute(message, args) {
        let userID = args[0] ? args[0].replace(/[<>@!]/g, "") : message.author.id;

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        lowscore(client, userID, message)
    }
}