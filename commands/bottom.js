async function bottom(client, serverID, message) {
  return await client.connect(async (err) => {
    if (err) console.error(err);
    const callTimes = client.db("HamChick").collection("callTimes");
    lowscores = await callTimes.find({
      'server': serverID
    }).project({
      "_id": false,
      id: false,
      highscore: false,
      scores: false,
      startTime: false,
      endTime: false,
      server: false
    }).toArray();
    lowscores.sort((a, b) => {
      return a.lowscore - b.lowscore
    });
    time = lowscores[0].lowscore;
    if (time > 3600) {
      message.channel.send(`${lowscores[0].username} has the lowest score with ${(time/3600).toFixed(2)} hours.`);
    } else if (time > 60) {
      message.channel.send(`${lowscores[0].username} has the lowest score with ${(time/60).toFixed(2)} minutes.`);
    } else {
      message.channel.send(`${lowscores[0].username} has the lowest score with ${time} seconds.`);
    }
  });
}

module.exports = {
  name: '!bottom',
  description: 'Lists the user with the lowest score in the server!',
  execute(message, args) {
    let serverID = message.channel.guild.id;

    const MongoClient = require('mongodb').MongoClient;
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    bottom(client, serverID, message).then(client.close()).catch((err) => console.error(err));
  }
}