async function monitor(client, userID, serverID, message) {
    return await client.connect(async () => {
        guild = message.channel.guild;
        const callTimes = client.db("HamChick").collection("callTimes");

        userObj = await callTimes.findOne({
            "id": userID
        }).catch((err) => console.error(err));

        if (userObj) {
            message.channel.send('That user is already being monitored! (👁_👁)');
        } else if (guild.member(userID)) {
            await callTimes.insertOne({
                username: message.channel.guild.members.cache.get(userID).user.username,
                id: userID,
                highscore: null,
                lowscore: 2147483647,
                scores: [],
                startTime: null,
                endTime: null,
                server: serverID,
                gnStreak: 0,
                gnTime: null,
                gmStreak: 0,
                gmTime: null,
                gnHighscore: 0,
                gmHighscore: 0,
                valentine: null,
                pending_valentine: null
            }).catch((err) => console.error(err));

            message.channel.send('Sucessfully began monitering user! (👁_👁)')
        }
    });
}

module.exports = {
    name: `!monitor`,
    description: 'Adds a user to be monitored',
    execute(message, args) {
        argument = args[0] ? args[0] : message.author.id;
        let userID = argument.replace(/[<>!@]/g, "");
        let serverID = message.channel.guild.id

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        monitor(client, userID, serverID, message).then(client.close()).catch((err) => console.error(err));
    }
};