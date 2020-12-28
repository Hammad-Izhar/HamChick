// TODO: !reset, !scores, !top

//Discord Setup
const fs = require('fs');
const Discord = require('discord.js');
require('dotenv').config();
const monitor = require('./commands/monitor');
const DiscordClient = new Discord.Client();

DiscordClient.commands = new Discord.Collection();
const discordCommands = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


for (const file of discordCommands) {
    const command = require(`./commands/${file}`);
    DiscordClient.commands.set(command.name, command);
}
console.log(discordCommands)

//Assets
let startTime;
let endTime;

DiscordClient.login();
DiscordClient.on('ready', () => {
    console.log('Logged on and ready to rumble!');
});

DiscordClient.on('message', msg => {
    const args = msg.content.split(/ +/);
    const cmd = args.shift().toLowerCase();
    console.info(`Called command: ${cmd}`);

    if (!DiscordClient.commands.has(cmd)) return console.log('no command');

    try {
        DiscordClient.commands.get(cmd).execute(msg, args);
    } catch (error) {
        console.error(error)
        msg.reply('Great! You broke me 😢. Try again later!')
    }
});


DiscordClient.on('voiceStateUpdate', (oldState, newState) => {
    console.log('Got a voice update!')
    fs.readFile('./assets/callTimes.json', (err, data) => {
        if (err) console.error(err);

        let callTimes = new Map(JSON.parse(data));
        let memberID = oldState.id;
        let userObj = callTimes.get(memberID);

        if (userObj && oldState.channelID == null) {
            userObj.startTime = new Date();
        } else if (userObj && newState.channelID == null && userObj.startTime) {
            userObj.endTime = new Date();
        }

        if (userObj && userObj.startTime && userObj.endTime) {
            let channelID = '473234078817058828';
            startTime = new Date(userObj.startTime);
            endTime = new Date(userObj.endTime);
            let time = (endTime.getTime() - startTime.getTime()) / 1000;
            userObj.startTime = null;
            userObj.endTime = null;

            if (userObj.highscore <= time) {
                oldState.guild.channels.cache.get(channelID).send(`${userObj.username} was in a voice channel for ${time} seconds!`);
                userObj.scores.push(time);
                if (userObj.scores.length > 10) {
                    userObj.scores.sort();
                    userObj.scores.pop();
                }
            } else if (userObj.highscore > time) {
                oldState.guild.channels.cache.get(channelID).send(`${userObj.username} was in a voice channel for ${time} seconds! A new high score!`);
                userObj.highscore = time;
                userObj.scores.push(time);
                if (userObj.scores.length > 10) {
                    userObj.scores.sort();
                    userObj.scores.pop();
                }
            }
        }

        fs.writeFile("./assets/callTimes.json", JSON.stringify([...callTimes]), err => console.error(err));
    });
});