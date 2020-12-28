const fs = require('fs');

module.exports = {
    name: `!reset`,
    description: 'Resets a user\'s high score and scores!',
    execute(message, args) {
        let userID = args[0].replace(/[<>!@]/g, "");

        let callTimes = fs.readFile('./assets/callTimes.json', (err, data) => {
            if (err) console.error(err);
            callTimes = new Map(JSON.parse(data));

            let userObj = callTimes.get(userID);

            if (!userObj) {
                message.channel.send("That user isn't being monitored! ❌")
            } else if (!isNaN(userID)) {
                userObj.highscore = 9007199254740991;
                userObj.scores = [];
                userObj.startTime = null;
                userObj.endTime = null;
                fs.writeFile("./assets/callTimes.json", JSON.stringify([...callTimes]), err => console.error(err));
                message.channel.send('Succesfully reset the user! 👁👁');
            }
        });
    }
}