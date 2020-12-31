const fs = require('fs');

module.exports = {
    name: `!monitor`,
    description: 'Adds a user to be monitored',
    execute(message, args) {
        if (args == []) args = [message.author.id];
        let userID = args[0].replace(/[<>!@]/g, "");
        let serverID = message.channel.guild.id

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        client.connect(err => {
            if (err) console.error(err);
            const callTimes = client.db("HamChick").collection("callTimes");
            let userObj = callTimes.findOne({"id": userID})
                .then(doc => {
                    if (doc) {
                        console.log(doc);
                        message.channel.send('That user is already being monitored! (👁_👁)');
                    } else if (!isNaN(userID)) {
                        console.log(doc);
                        callTimes.insertOne({
                            username: message.channel.guild.members.cache.get(userID).user.username,
                            id: userID,
                            highscore: 9007199254740991,
                            scores: [],
                            startTime: null,
                            endTime: null,
                            server: serverID
                        }).catch(err => console.error(err));
                        message.channel.send('Sucessfully began monitering user! (👁_👁)')
                    }
                }).catch(err => console.error(err));
        });
    }
};