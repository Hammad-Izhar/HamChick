const fs = require('fs');

module.exports = {
    name: `!unmonitor`,
    description: 'Removes a user from being monitored',
    execute(message, args) {
        let userID = args[0].replace(/[<>!@]/g, "");

        let callTimes = fs.readFile('./assets/callTimes.json', (err, data) => {
            if (err) console.error(err);
            callTimes = new Map(JSON.parse(data));

            let userObj = callTimes.get(userID);

            if (!userObj) {
                message.channel.send("That user isn't being monitored! ❌")
            } else if (!isNaN(userID)) {
                callTimes.delete(userID);
                fs.writeFile('./assets/callTimes.json', JSON.stringify([...callTimes]), (err) => console.error(err));
                message.channel.send("Succesfully removed the user! ✔")
            }
        });
    }
}