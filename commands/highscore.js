async function highscore(type, client, userID, message) {
    return await client.connect(async () => {
        try {
            const callTimes = client.db('HamChick').collection('callTimes');
            let userObj = await callTimes.findOne({
                'id': userID
            });
            if (type == 'call') {
                let time = userObj.highscore;
                if (time >= 3600) {
                    time = (time / 3600).toFixed(2);
                    message.channel.send(`<@${userID}>'s longest call time is ${time} hours!`);
                } else if (time >= 60) {
                    time = (time / 60).toFixed(2);
                    message.channel.send(`<@${userID}>'s longest call time is ${time} minutes!`);
                } else {
                    message.channel.send(`<@${userID}>'s longest call time is ${time} seconds!`);
                }
            } else if (type == 'gn') {
                message.channel.send(`<@${userID}>'s longest gn streak is ${userObj.gnHighscore} days!`);
            } else if (type == 'supsup') {
                message.channel.send(`<@${userID}>'s longest supsup streak is ${userObj.gmHighscore} days!`)
            }
        } catch (err) {
            console.error(err);
        }
    });
}

module.exports = {
    name: "!highscore",
    description: "",
    execute(message, args) {
        let userID = args[1] ? args[1].replace(/[<>@!]/g, "") : message.author.id;
        console.log(userID);
        if (!((/call/i).test(args[0])) && !((/gn/i).test(args[0])) && !((/supsup/i).test(args[0]))) {
            message.channel.send("That's not a valid streak name! You must say either 'call', 'gn', or'supsup'.");
            return
        }
        let highscoreType = args[0].toLowerCase();

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        highscore(highscoreType, client, userID, message)
    }
}