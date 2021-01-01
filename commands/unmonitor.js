async function unmonitor(client, userID, message) {
    return await client.connect(async () => {
        let callTimes = client.db("HamChick").collection("callTimes");

        userObj = await callTimes.findOne({
            'id': userID
        }).catch((err) => console.error(err));

        if (!userObj) {
            message.channel.send('That user isn\'t being monitored! ❌');
        } else {
            await callTimes.deleteOne(userObj).catch((err) => console.error(err));
            message.channel.send("Succesfully removed the user! :white_check_mark:");
        }
    });
}

module.exports = {
    name: `!unmonitor`,
    description: 'Removes a user from being monitored',
    execute(message, args) {
        argument = args[0] ? args[0] : message.author.id;
        let userID = argument.replace(/[<>!@]/g, "");

        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        unmonitor(client, userID, message).then(client.close()).catch((err) => console.error(err));
    }
}