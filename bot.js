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

    async function nightStreak(client, message) {
        return await client.connect(async () => {
            try {
                const userID = message.author.id;
                const callTimes = client.db("HamChick").collection("callTimes");

                let userObj = await callTimes.findOne({
                    "id": userID
                }).catch(err => console.error(err));

                now = new Date();

                if (now.getHours() >= 2 && now.getHours() <= 4) {
                    if (userObj.gnTime == null) {
                        console.log('First Time!');
                        userObj.gnTime = new Date();
                        userObj.gnStreak = 1;
                        console.log(userObj.gnStreak);
                        if (userObj.gnHighscore < userObj.gnStreak) {
                            userObj.gnHighscore = userObj.gnStreak;
                        }
                        message.channel.send('Good Night! First time! Keep up the good work! 🌙')
                    } else if (userObj.gnTime && (now.getTime() - (new Date(userObj.gnTime)).getTime()) >= 72000000 && now.getDate() == (new Date(userObj.gnTime)).getDate() + 1) {
                        console.log('Streaking!');
                        userObj.gnTime = new Date();
                        userObj.gnStreak += 1;
                        if (userObj.gnHighscore < userObj.gnStreak) {
                            userObj.gnHighscore = userObj.gnStreak;
                        }
                        if (userObj.gnStreak % 5 == 0) {
                            message.channel.send(`Good night! ${message.author} is on a ${userObj.gnStreak} night streak! 🌕`);
                        } else {
                            message.channel.send(`Good night ${message.author}!`)
                        }
                    } else if ((86400000 + ((new Date(userObj.gnTime)).getTime() - now.getTime())) > 0) {
                        console.log('Too early!')
                        let time = (72000000 + ((new Date(userObj.gnTime)).getTime() - now.getTime())) / 1000;
                        let s = ""
                        if (time > 3600) {
                            s = `${(time/3600).toFixed(2)} hours`;
                        } else if (time > 60) {
                            s = `${(time/60).toFixed(2)} minutes`;
                        } else {
                            s = `${(time)} seconds`
                        }
                        message.channel.send(`I'm sorry! You have to wait ${s} to say gn!`)
                    } else if (now.getDate() > (new Date(userObj.gnTime)).getDate() + 1) {
                        console.log('Too late!');
                        userObj.gnTime == new Date();
                        userObj.gnStreak = 1;
                        message.channel.send('Damn it! You lost your streak! Try again! 🌑')
                    }
                } else {
                    message.channel.send(`It's too damn early to say good night! Try again a little later!`);
                }
                let update = {
                    $set: userObj
                };

                await callTimes.updateOne({
                    "id": userID
                }, update).catch(err => console.error(err));
            } catch (err) {
                console.error(err);
            }
        });
    }

    async function morningStreak(client, message) {
        return await client.connect(async () => {
            try {
                const userID = message.author.id;
                const callTimes = client.db("HamChick").collection("callTimes");

                let userObj = await callTimes.findOne({
                    "id": userID
                }).catch(err => console.error(err));

                now = new Date();

                if (now.getHours() >= 11 && now.getHours() <= 17) {
                    if (userObj.gmTime == null) {
                        console.log('First Time!');
                        userObj.gmTime = new Date();
                        userObj.gmStreak += 1;
                        if (userObj.gmHighscore < userObj.gmStreak) {
                            userObj.gmHighscore = userObj.gmStreak;
                        }
                        message.channel.send('Good morning! First time! Keep up the good work! 🌞')
                    } else if (userObj.gmTime && (now.getTime() - (new Date(userObj.gmTime))) >= 72000000 && now.getDate() == (new Date(userObj.gmTime)).getDate() + 1) {
                        console.log('Streaking!');
                        userObj.gmTime = new Date();
                        userObj.gmStreak += 1;
                        if (userObj.gmHighscore < userObj.gmStreak) {
                            userObj.gmHighscore = userObj.gmStreak;
                        }
                        if (userObj.gmStreak % 5 == 0) {
                            message.channel.send(`Good Morning! ${message.author} is on a ${userObj.gmStreak} night streak! ☀`);
                        } else {
                            message.channel.send(`Good morning ${message.author}!`)
                        }
                    } else if ((86400000 + ((new Date(userObj.gmTime)).getTime() - now.getTime())) > 0) {
                        console.log('Too early!')
                        let time = (72000000 + ((new Date(userObj.gmTime)).getTime() - now.getTime())) / 1000;
                        let s = ""
                        if (time > 3600) {
                            s = `${(time/3600).toFixed(2)} hours`;
                        } else if (time > 60) {
                            s = `${(time/60).toFixed(2)} minutes`;
                        } else {
                            s = `${(time)} seconds`
                        }
                        message.channel.send(`I'm sorry! You have to wait ${s} to say gm!`)
                    } else if (now.getDate() > (new Date(userObj.gmTime)).getDate() + 1) {
                        console.log('Too late!');
                        userObj.gmTime = new Date();
                        userObj.gmStreak = 1;
                        message.channel.send('Damn it! You lost your streak! You are back to square 1! 🌥')
                    }
                } else {
                    message.channel.send(`It's too late to say good morning! Try again a little earlier!`);
                }
                let update = {
                    $set: userObj
                };

                await callTimes.updateOne({
                    "id": userID
                }, update).catch(err => console.error(err));
            } catch (err) {
                console.error(err);
            }
        });
    }


    let gn = /\b\W*gns\W*\b/i;
    let supsup = /\b\W*supsups\W*\b/i;
    let sup_sup = /\b\W*sup sups\W*\b/i;

    if (gn.test(msg.content)) {
        console.log("Someone said gn!");

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        nightStreak(client, msg).catch(err => console.error(err));
    }

    if (supsup.test(msg.content) || sup_sup.test(msg.content)) {
        console.log("Someone said supsup!");

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        morningStreak(client, msg).catch(err => console.error(err));
    }


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
                    s = `<@${userObj.id}> was in a voice channel for ${(time/3600).toFixed(2)} hours!`
                } else if (time > 60) {
                    s = `<@${userObj.id}> was in a voice channel for ${(time/60).toFixed(2)} minutes!`
                } else {
                    s = `<@${userObj.id}> was in a voice channel for ${time} seconds!`
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

// const http = require('http');
// const server = http.createServer((req, res) => {
//     res.writeHead(200);
//     res.end('Online');
// });
// server.listen(3000);