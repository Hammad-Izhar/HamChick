const Discord = require('discord.js')

async function scores(client, userID, message) {
    return await client.connect(async () => {
        const callTimes = client.db("HamChick").collection("callTimes");

        let userObj = await callTimes.findOne({
            'id': userID
        }).catch((err) => console.error(err))

        if (!userObj) {
            message.channel.send('Could not find user! :x:')
        } else {
            let s = "";
            for (i = 0; i < userObj.scores.length; i++) {
                time = userObj.scores.sort(function (a, b) {return b - a})[i];
                if (time >= 3600) {
                    s += `${i + 1}. ${(time / 3600).toFixed(2)} hours\n`;
                } else if (time >= 60) {
                    s += `${i + 1}. ${(time / 60).toFixed(2)} minutes\n`;
                } else {
                    s += `${i + 1}. ${(time).toFixed(2)} seconds\n`;
                }
            }
            scoresEmbed = new Discord.MessageEmbed()
                .setTitle(`${userObj.username}'s Top 10 Call Times!`)
                .setColor(0xff0000)
                .setDescription(s);
            message.channel.send(scoresEmbed);
        }
    });
}

module.exports = {
    name: `!scores`,
    description: 'Lists the user\'s top 10 scores (shortest)!',
    execute(message, args) {
        argument = args[0] ? args[0] : message.author.id;
        let userID = argument.replace(/[<>!@]/g, "");

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        scores(client, userID, message).then(client.close()).catch((err) => console.error(err));
    }
}