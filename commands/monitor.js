const fs = require('fs');

module.exports = {
	name: `!monitor`,
	description: 'Adds a user to be monitored',
	execute(message, args) {
		let userID = args[0].replace(/[<>!@]/g, "");
		let serverID = message.channel.guild.id

		let callTimes = fs.readFile('./assets/callTimes.json', (err, data) => {
			if (err) console.error(err);
			callTimes = new Map(JSON.parse(data));

			if (callTimes.get(userID)) {
				message.channel.send('That user is already being monitored! (👁_👁)')
			} else if (!isNaN(userID)) {
				callTimes.set(userID, {
					username: message.channel.guild.members.cache.get(userID).user.username,
					id: userID,
					highscore: 9007199254740991,
					scores: [],
					startTime: null,
					endTime: null,
					server: serverID,
				})
			}
			fs.writeFile("./assets/callTimes.json", JSON.stringify([...callTimes]), err => console.error(err));
			message.channel.send('Sucessfully began monitering user! (👁_👁)');
		});
	}
};