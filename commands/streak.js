async function streak(type, userID, client, message) {
    return await client.connect(async () => {
        try {
            const callTimes = client.db('HamChick').collection('callTimes');

            let userObj = await callTimes.findOne({
                'id': userID
            });
            if (type == 'gn') {
                message.channel.send(`<@${userID}> is on a ${userObj.gnStreak}-day streak! 🌕`)
            } else if (type == 'supsup') {
                message.channel.send(`<@${userID}> is on a ${userObj.gmStreak}-day streak! 🌞`);
            }
        } catch (err) {
            console.error(err);
        }
    });
}

module.exports = {
    name: `!streak`,
    description: "",
    execute(message, args) {
        let userID = args[1] ? args[1].replace(/[<>!@]/g, "") : message.author.id
        if (!((/gn/i).test(args[0])) && !((/supsup/i).test(args[0]))) {
            message.channel.send("That's not a valid streak name! You must say either 'gn' or 'supsup'.");
            return
        }
        let streakType = args[0].toLowerCase();

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        streak(streakType, userID, client, message)
    }
}