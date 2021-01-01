async function top(client, serverID, message) {
    return await client.connect(async (err) => {
        if (err) console.error(err);
        const callTimes = client.db("HamChick").collection("callTimes");
        highscores = await callTimes.find({
            'server': serverID
        }).project({
            "_id": false,
            id: false,
            lowscore: false,
            scores: false,
            startTime: false,
            endTime: false,
            server: false
        }).toArray();
        highscores.sort((a, b) => {
            return b.highscore - a.highscore
        })
        time = highscores[0].highscore;
        if (time > 3600) {
            message.channel.send(`${highscores[0].username} has the highest score with ${(time/3600).toFixed(2)} hours.`);
        } else if (time > 60) {
            message.channel.send(`${highscores[0].username} has the highest score with ${(time/60).toFixed(2)} minutes.`);
        } else {
            message.channel.send(`${highscores[0].username} has the highest score with ${time} seconds.`);
        }
    });
}

module.exports = {
    name: '!top',
    description: 'Lists the user with the highest score in the server!',
    execute(message, args) {
        let serverID = message.channel.guild.id;

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        top(client, serverID, message).then(client.close()).catch((err) => console.error(err));
    }
}