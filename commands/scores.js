const fs = require('fs');
const Discord = require('discord.js')

module.exports = {
    name: `!scores`,
    description: 'Lists the user\'s top 10 scores (shortest)!',
    execute(message, args) {
        let userID = args[0].replace(/[<>!@]/g, "");

        let callTimes = fs.readFile('./assets/callTimes.json', (err, data) => {
            if (err) console.error(err);
            callTimes = new Map(JSON.parse(data));

            let userObj = callTimes.get(userID);

            if (!userObj) {
                message.channel.send("That user isn't being monitored! ❌")
            } else if (!isNaN(userID)) {
                let s = "";
                for (i = 0; i < userObj.scores.length; i++) {
                    s += `${i + 1}. ${userObj.scores[i]} seconds\n`;
                }
                scoresEmbed = new Discord.MessageEmbed()
                    .setTitle(`${userObj.username}'s Top 10 Call Times!`)
                    .setColor(0xff0000)
                    .setDescription(s);
                message.channel.send(scoresEmbed);
            }
        });
    }
}