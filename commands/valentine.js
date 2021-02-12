async function valentine(client, message) {
    return await client.connect(async () => {
        const callTimes = client.db("HamChick").collection("callTimes");

        userObj = await callTimes.findOne({
            "id": message.author.id
        }).catch((err) => console.error(err));

        if (userObj.valentine) {
            if (userObj.valentine.length > 1) {
                let s = "";
                for (i = 0; i < userObj.valentine.length - 1; i++) {
                    s += `<@${userObj.valentine[i]}>, `
                }
                s += `and <@${userObj.valentine[userObj.valentine.length-1]}>`
                message.channel.send(`Look at this whore! Cozying it up with: ${s}!`)
            } else {
                message.channel.send(`<@${message.author.id}> is exclusively with <@${userObj.valentine[0]}>$`)
            }
        } else {
            message.channel.send(`Maybe try accepting someone's proposal?`)
        }
    })
}

module.exports = {
    name: "!valentine",
    description: "Valentine's Special",
    execute(message, args) {
        const MongoClient = require('mongodb').MongoClient;
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h1cxc.mongodb.net/HamChick?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        valentine(client, message);
    }
}