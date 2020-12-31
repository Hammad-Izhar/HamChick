const fs = require('fs');

module.exports = {
    name: `!unmonitor`,
    description: 'Removes a user from being monitored',
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
          let callTimes = client.db("HamChick").collection("callTimes");
          let userObj = callTimes.findOne({'id': userID})
            .then((doc) => {
                if (!doc) message.channel.send('That user isn\'t being monitored! ❌');
                else {
                    callTimes.deleteOne(doc);
                    message.channel.send("Succesfully removed the user! :white_check_mark:");
                }
            })
});
    }
}