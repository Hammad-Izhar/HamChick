async function top(topType, client, serverID, message) {
    return await client.connect(async (err) => {
        if (err) console.error(err);
        const callTimes = client.db("HamChick").collection("callTimes");
        if (topType == "call") {
            let highscores = await callTimes.find({
                'server': serverID
            }).project({
                "_id": false,
                highscore: true,
                username: true
            }).toArray();
            highscores.sort((a, b) => {
                return b.highscore - a.highscore
            });
            let time = highscores[0].highscore;
            if (time > 3600) {
                message.channel.send(`${highscores[0].username} has the highest score with ${(time/3600).toFixed(2)} hours.`);
            } else if (time > 60) {
                message.channel.send(`${highscores[0].username} has the highest score with ${(time/60).toFixed(2)} minutes.`);
            } else {
                message.channel.send(`${highscores[0].username} has the highest score with ${time} seconds.`);
            }
        } else if (topType == 'gn') {
            let streaks = await callTimes.find({
                'server': serverID
            }).project({
                "_id": false,
                gnHighscore: true,
                username: true
            }).toArray();
            streaks.sort((a, b) => {
                return b.gnHighscore - a.gnHighscore
            });
            let globalHighscore = streaks[0].gnHighscore;
            let s = "";
            for (userObj of streaks) {
                if (userObj.gnHighscore == globalHighscore) {
                    s += `${userObj.username}, `;
                }
            }
            s = s.trimEnd();
            message.channel.send(`The following members have the longest gn streak: ${s.slice(0, s.length - 1)}!`);
        } else if (topType == 'supsup') {
            let streaks = await callTimes.find({
                'server': serverID
            }).project({
                "_id": false,
                gmHighscore: true,
                username: true
            }).toArray();
            streaks.sort((a, b) => {
                return b.gmHighscore - a.gmHighscore
            });
            let globalHighscore = streaks[0].gmHighscore;
            let s = "";
            for (userObj of streaks) {
                if (userObj.gmHighscore == globalHighscore) {
                    s += `${userObj.username}, `;
                }
            }
            s = s.trimEnd()
            message.channel.send(`The following members have the longest supsup streak: ${s.slice(0, s.length - 1)}!`);
        }
    });
}

module.exports = {
    name: '!top',
    description: 'Lists the user with the highest score in the server!',
    execute(message, args) {
        let serverID = message.channel.guild.id;

        if (!((/\b\W*call\W*\b/i).test(args[0])) && !((/\b\W*gn\W*\b/i).test(args[0])) && !((/\b\W*supsup\W*\b/i).test(args[0]))) {
            message.channel.send("That's not a valid argument! You must say either 'call', 'gn', or'supsup'.");
            return
        }
        let topType = args[0].toLowerCase();

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        top(topType, client, serverID, message).then(client.close()).catch((err) => console.error(err));
    }
}