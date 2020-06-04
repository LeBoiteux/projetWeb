var express = require('express');
var bodyParser = require('body-parser');
//var RiveScript = require('rivescript');
var fs = require('fs');

var app = express();
var bots = require("./data.json");
var users = require("./users.json");
var Rivescript = require('rivescript');
var brainsFiles = fs.readdirSync('./brains/');
var brainsNames = generateBotName(brainsFiles);
var brainsData = generateBrainsData(brainsFiles, brainsNames);


function botNotReady(err) {
    console.log("An error has occurred.", err);
}



/*----- Discord Managing ------*/

const Discord = require('discord.js');

const client = new Discord.Client();
client.login('NzE2MjczNjA3NTAzNzczNzI3.XtJYbg.sdBHjGC-GfKkBm1jbVyE_NCCe2A');

const botForD = new Rivescript();
function botReadyD() {
    botForD.sortReplies();
    console.log("Bot for Discord ready");
}
botForD.loadFile('./brains/' + brainsFiles[0]).then(botReadyD).catch(botNotReady);

client.on('ready', () => {
    console.log('Bot is now connected');
});

client.on('message', (msg) => {
    console.log("message author = "+msg.author.username);
    if (msg.author.username != "Rework") {
        console.log("Message received : " + msg.content);
        botForD.reply("local-user", msg.content).then(function (reply) {
            console.log("Message sent : " + reply);
            msg.channel.send(reply);
        });
    }
});


/*----- End of Discord Managing ------*/

/*----- Index Management ------*/

function generateBotName(brainsFiles) {
    var i = 0;
    var list = [];
    for (i = 0; i < brainsFiles.length; i++) {
        var correct = brainsFiles[i].replace('.rive', '');
        list.push(correct);
    }
    return list;
}

function generateBrainsData(brainsFiles, brainsNames) {
    var i = 0;
    var list = []
    for (i = 0; i < brainsFiles.length; i++) {
        var name = brainsNames[i];
        var url = brainsFiles[i];
        var brain = {
            name: name,
            url: url
        }
        list.push(brain);
    }
    return list;
}



app.set('view engine', 'ejs');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));
// parse application/json
app.use(bodyParser.json());
app.use(express.static('public'));


app.get("/", function (req, res) {
    res.render("index");
});
/*----- End of Index Management ------*/

/*----- Administration Part -----*/
app.post('/createBot', function (req, res) {
    var name = req.body.botName;
    var perso = req.body.botPerso;
    console.log(perso);

    var botJson = {
        id: bots.length + 1,
        name: name,
        url: './brains/' + perso + '.rive',
        personality: perso,
        picture: "/icons/c3po.jpg",
        status: "offline"
    };
    //Et on met à jour le Json et la liste de bots avec le nouveau bot
    bots.push(botJson);
    fs.writeFile('./data.json', JSON.stringify(bots), function (err) {
        if (err) return console.log(err);
    });

    console.log("Les bots ont été mis à jour");

    res.redirect("/admin");

});


app.post('/modifyBot', function (req, res) {
    var name = req.body.modBotName.toString().replace(/[^a-zA-Z0-9]/g, "");
    var id = req.body.id;
    var perso = req.body.modBotPerso.toString().replace(/[^a-zA-Z0-9]/g, "");
    for (var i = 0; i < bots.length; i++) {
        console.log(bots[i].name);
        if (bots[i].id == id) {
            if (!(name === "")) {
                bots[i].name = name;
            }
            if (!(perso === "")) {
                bots[i].url = './brains/' + brainsData[perso].name + '.rive';
                bots[i].personality = brainsData[perso].name;
            }

            console.log("Après changement : " + bots[i].name);
        }
    }
    fs.writeFile('./data.json', JSON.stringify(bots), function (err) {
        if (err) return console.log(err);
    });
    console.log("Les bots ont été mis à jour");
    res.redirect("/admin");
});

app.post('/toggleOnOff', function (req, res) {
    var id = req.body.id;
    if (bots[id].status.localeCompare("offline") == 0) {
        bots[id].status = "online";
    } else {
        bots[id].status = "offline";
    }
    fs.writeFile('./data.json', JSON.stringify(bots), function (err) {
        if (err) return console.log(err);
    });
    console.log("Les bots ont été mis à jour");
    res.redirect("/admin");
});

app.post("/deleteBot", function (req, res) {
    var id = req.body.id;
    console.log("id: " + id + "bot:" + bots[id].name);
    bots.splice(id, 1);
    for (var i = 0; i < bots.length; i++) {
        bots[i].id = i + 1;
    }
    fs.writeFile('./data.json', JSON.stringify(bots), function (err) {
        if (err) return console.log(err);
    });
    console.log("Les bots ont été mis à jour");
    res.redirect("/admin");
});

app.post("/sendToMasto", function (req, res) {
    var id = req.body.idForMasto;
    if (bots[id].status === 'online') {
        console.log("Bot à charger : " + id);
        botForM.loadFile(bots[id].url).then(botReadyM).catch(botNotReady);
        sendMessageM("New bot charged. My name is " + bots[id].name);
    } else {
        console.log("Bot offline");
    }

    res.redirect("/admin");
});

app.post("/sendToDiscord", function (req, res) {
    var id = req.body.idForDiscord;
    console.log("id : "+id);
    if (bots[id].status === 'online') {
        console.log("Bot à charger : " + id);
        botForD.loadFile(bots[id].url).then(botReadyD).catch(botNotReady);
    } else {
        console.log("Bot offline");
    }

    res.redirect("/admin");
});

app.post('/admin', function (req, res) {
    console.log("Je passe en admin");
    res.render("admin", {
        bots: bots,
        brains: brainsData
    });
});
app.get("/admin", function (req, res) {
    res.render("admin", {
        bots: bots,
        brains: brainsData
    });
});

/*----- End of Administration Part -----*/

/*----- Login & User Part -----*/

app.post('/login', function (req, res) {
    console.log("Je passe en login");
    res.render("login", {error: false});
});

app.get("/login", function(req, res) {
    res.render("login", {error: false});
});

app.post('/user', function (req, res) {
    console.log("Je passe en user");
    res.render("user");
});

app.get("/user", function(req, res) {
    console.log(bots);
    res.render("user",{botData: bots, userData: users});
});


app.get('/user/?user=:username', function (req, res){
    //res.send('user: ' + req.params.username);
    res.render("user",{botData: bots, userData: users});
})

app.get('/user/?user=:username&bot=:botName', function (req, res){
    res.render("user",{botData: bots, userData: users});
})


app.post('/createUser', function (req, res) {
    var name = req.body.username;
    var pic = req.body.avatars;
    var test = false;

    for (var i=0; i < users.length; i++) {
        if (users[i].name == name) {
            test = true;
        }
    }
    if (test){
        res.render('login', {error: true, message: 'This account already exists.'});
    } else {
        var userJson = {
            id: (users.length) + 1,
            name: name,
            picture: pic
        };
        //Et on met à jour le Json Users
        users.push(userJson);
        fs.writeFile('./users.json', JSON.stringify(users, null, 2), function (err) {
            if (err) return console.log(err);
            console.log("test" + JSON.stringify(users, null, 2));
            console.log('writing to ' + './users.json');
        });
        res.redirect("/user/?user=" + name+'&bot=C3PO');
    }
});


app.post('/loginUser', function (req, res) {
    var name = req.body.username;
    var test = false;

    for (var i = 0; i < users.length; i++) {
        if (users[i].name == name) {
            test = true;
        }
    }
    if (!test){
        res.render('login', {error: true, message: 'Username unknown, please create an account to chat.'});
    } else {
        res.redirect('/user/?user='+name+'&bot=C3PO');
    }

});

app.post('/selectBot', function (req, res){
    var bot = req.body.bots;
    var user = req.body.username;
    res.redirect("/user/?user="+user+"&bot=" + bot);
});


/*----- End of Login & User Part -----*/



app.use(function (req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(404, 'Page introuvable !');
});




//Start the server
app.listen(8081);
