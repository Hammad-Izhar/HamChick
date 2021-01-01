// TODO: !top, Wordnik ciphers

//Discord Setup
const fs = require('fs');
const Discord = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();
const monitor = require('./commands/monitor');
const DiscordClient = new Discord.Client();

DiscordClient.commands = new Discord.Collection();
const discordCommands = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of discordCommands) {
    const command = require(`./commands/${file}`);
    DiscordClient.commands.set(command.name, command);
}

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

    if (!DiscordClient.commands.has(cmd) && !args[0] && !msg.author.bot && cmd[cmd.length - 1] == ".") {
        cmd1 = cmd.slice(0, cmd.length - 1);
        console.log(`GIF TIME: http://api.giphy.com/v1/gifs/search?q=${cmd}&api_key=${process.env.GIPHY_PASS}&limit=${process.env.GIF_LIMIT}`);
        async function gif() {
            data = await fetch(`http://api.giphy.com/v1/gifs/search?q=${cmd1}&api_key=${process.env.GIPHY_PASS}&limit=${process.env.GIF_LIMIT}`).then(response => response.json()).catch(err => console.error(err));
            let index = Math.floor(Math.random() * (data.data.length) - 1);
            try {
                if (data.data) {
                    let url = data.data[index].images.original.url;
                    gifEmbed = new Discord.MessageEmbed()
                        .setColor(0xff0000)
                        .setImage(url);
                    return msg.channel.send(gifEmbed);
                } else {
                    return
                }
            } catch (err) {
                console.log(`Had an error:\n${err}\nHere's the link! http://api.giphy.com/v1/gifs/search?q=${cmd1}&api_key=${process.env.GIPHY_PASS}&limit=${process.env.GIF_LIMIT}`)
            }
        }
        gif();
    };

    if (!DiscordClient.commands.has(cmd)) return;

    try {
        DiscordClient.commands.get(cmd).execute(msg, args);
    } catch (error) {
        console.error(error)
        msg.reply('Great! You broke me 😢. Try again later!')
    }
});


DiscordClient.on('voiceStateUpdate', (oldState, newState) => {
    console.log('Got a voice update!')

    const MongoClient = require('mongodb').MongoClient;
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    async function userWrapper(memberID, collection) {
        try {
            let userObj = await collection.findOne({
                'id': memberID
            });
            return userObj;
        } catch (err) {
            console.error(err)
        }
    }

    client.connect(err => {
        if (err) console.error(err);

        const callTimes = client.db("HamChick").collection("callTimes");
        let memberID = oldState.id;

        userWrapper(memberID, callTimes).then((userObj) => {
            if (userObj && oldState.channelID == null) {
                userObj.startTime = new Date();
            } else if (userObj && newState.channelID == null && userObj.startTime) {
                userObj.endTime = new Date();
            }
            let s = ""
            if (userObj && userObj.startTime && userObj.endTime) {
                let channelID = '473234078817058828';
                startTime = new Date(userObj.startTime);
                endTime = new Date(userObj.endTime);
                let time = (endTime.getTime() - startTime.getTime()) / 1000;
                if (time > 3600) {
                    s = `${userObj.username} was in a voice channel for ${(time/3600).toFixed(2)} hours!`
                } else if (time > 60) {
                    s = `${userObj.username} was in a voice channel for ${(time/60).toFixed(2)} minutes!`
                } else {
                    s = `${userObj.username} was in a voice channel for ${time} seconds!`
                }
                userObj.startTime = null;
                userObj.endTime = null;

                if (userObj.highscore >= time && userObj.lowscore <= time) {
                    oldState.guild.channels.cache.get(channelID).send(s);
                    userObj.scores.push(time);
                    if (userObj.scores.length > 10) {
                        userObj.scores.sort();
                        userObj.scores.pop();
                    }
                } else if (userObj.highscore < time) {
                    oldState.guild.channels.cache.get(channelID).send(`${s} A new high score!`);
                    userObj.highscore = time;
                    if (time < userObj.lowscore) {
                        userObj.lowscore = time;
                    }
                    userObj.scores.push(time);
                    if (userObj.scores.length > 10) {
                        userObj.scores.sort();
                        userObj.scores.pop();
                    }
                } else if (userObj.lowscore > time) {
                    oldState.guild.channels.cache.get(channelID).send(`${s} A new low score!`);
                    userObj.lowscore = time;
                    userObj.scores.push(time);
                    if (userObj.scores.length > 10) {
                        userObj.scores.sort();
                        userObj.scores.pop();
                    }
                }
            }
            if (userObj) {
                update = {
                    $set: {
                        'username': userObj.username,
                        'id': userObj.id,
                        'highscore': userObj.highscore,
                        'lowscore': userObj.lowscore,
                        'scores': userObj.scores,
                        'startTime': userObj.startTime,
                        'endTime': userObj.endTime,
                        'server': userObj.server
                    }
                };
                callTimes.updateOne({
                    'id': memberID
                }, update, (err) => {
                    if (err) console.error(err);
                });
            }
        });
    });
    client.close();
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Online');
});
server.listen(3000);