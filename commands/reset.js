const fs = require('fs');

module.exports = {
        name: `!reset`,
        description: 'Resets a user\'s high score and scores!',
        execute(message, args) {
            if (args == []) args = [message.author.id];
            let userID = args[0].replace(/[<>!@]/g, "");

            const MongoClient = require('mongodb').MongoClient;
            const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
            const client = new MongoClient(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            client.connect(err => {
                if (err) console.error(err);
                const callTimes = client.db("HamChick").collection("callTimes");
                let userObj = callTimes.findOne({
                        'id': userID
                    })
                    .then(docs => {
                        if (!docs) message.channel.send("That user isn't being monitored! ❌");
                        else {
                            update = {
                                $set: {
                                    highscore: 9007199254740991,
                                    scores: [],
                                    startTime: null,
                                    endTime: null
                                }
                            }
                            callTimes.updateOne({
                                'id': userID
                            }, update, (err) => {
                                if (err) console.error(err);
                                db.close();
                            });
                        }
                    }).catch(err => console.error(err));
            }).catch(err => console.error(err));
            }
        }