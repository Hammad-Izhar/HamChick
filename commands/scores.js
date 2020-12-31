const fs = require('fs');
const Discord = require('discord.js')

module.exports = {
    name: `!scores`,
    description: 'Lists the user\'s top 10 scores (shortest)!',
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
                    "id": userID
                })
                .then(doc => {
                    if (!doc) {
                        message.channel.send('Could not find user! :x:');
                    } else {
                        let s = "";
                        for (i = 0; i < userObj.scores.length; i++) {
                            s += `${i + 1}. ${userObj.scores.sort()[i]} seconds\n`;
                        }
                        scoresEmbed = new Discord.MessageEmbed()
                            .setTitle(`${userObj.username}'s Top 10 Call Times!`)
                            .setColor(0xff0000)
                            .setDescription(s);
                        message.channel.send(scoresEmbed);
                    }
                }).then(db.close()).catch(err => console.error(err));
        }).catch(err => console.error(err));
    }
}