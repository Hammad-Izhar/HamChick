async function reset(client, userID, message) {
    return await client.connect(async () => {
        const callTimes = client.db("HamChick").collection("callTimes");
        query = {
            'id': userID
        };

        let userObj = await callTimes.findOne(query).catch((err) => console.error(err));

        if (!userObj) {
            message.channel.send("That user isn't being monitored! ❌");
        } else {
            update = {
                $set: {
                    highscore: null,
                    lowscore: 2147483647,
                    scores: [],
                    startTime: null,
                    endTime: null,
                    gnStreak: 0,
                    gnTime: null,
                    gmStreak: 0,
                    gmTime: null,
                    gnHighscore: 0,
                    gmHighscore: 0,
                    valentine: null,
                    pending_valentine: null
                }
            }
            await callTimes.updateOne(query, update).catch((err) => console.error(err));
            message.channel.send("Succesfully reset the user! :white_check_mark:");
        }
    });
}

module.exports = {
    name: `!reset`,
    description: 'Resets a user\'s high score and scores!',
    execute(message, args) {
        argument = args[0] ? args[0] : message.author.id;
        let userID = argument.replace(/[<>!@]/g, "");

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        reset(client, userID, message).then(client.close()).catch((err) => console.error(err));
    }
}