var app = require('express').createServer(),
    io = require('socket.io').listen(app); 

app.listen(process.env.C9_PORT || 8333); 

var joueurs = {};
var vainqueurs = new Array();
var nomJoueurs = new Array();
var joueur;
var clientId = 1;
var tpsProchainTirage = 15;
var dernierNombreGagnant;

var timerProchainTirage = setInterval(function () { 
	if(tpsProchainTirage > 0) {
		tpsProchainTirage --;
	} else {
		tpsProchainTirage = 15;
		dernierNombreGagnant = tirage();
		designerVainqueurs(dernierNombreGagnant);
	}
}, 1000); 


app.get('/', function (req, res) { 
    res.sendfile(__dirname + '/public/start.html'); 
});

app.get('/connexionLoterie', function (req, res) {
	joueur = req.param("login");
	
	if(loginDisponible(joueur)) {
		// si login disponible, joueur entre dans la partie
		entrerEnJeu(joueur, res);
	} else {
		// sinon retourne sur page login
		res.send('Nom de joueur non disponible',404);
	}
});

/**
 * Vérifie si un login est disponible ou non
 */
function loginDisponible(nom) {
	
	for(var i = 0; i < nomJoueurs.length; i++) {
		if(nomJoueurs[i] == nom) {
			return false;
		}
	}
	
	return true;
}

/**
 * Entrée d'un nouveau joueur
 */
function entrerEnJeu(login, res) {
	joueurs[joueur] = null;
	nomJoueurs.push(joueur);
	
	console.log(login + " entre en jeu");
	
	res.sendfile(__dirname + '/public/loterie.html'); 
}

/**
 * Permet de tirer un nombre compris entre 0 et 100
 */
function tirage() {
	return Math.floor(Math.random() * 100);
}

/**
 * Désigne le vainqueur selon le numéro tiré
 */
function designerVainqueurs(numeroVainqueur) {
	vainqueurs = new Array();
	
	for(var j in joueurs) {
		if(joueurs[j] == numeroVainqueur) {
			vainqueurs.push(j);
		}
	}
}


io.sockets.on('connection', function (client) { 
    var my_timer; 
    var my_client = { 
        "id": clientId, 
		"nom": joueur,
        "obj": client 
    }; 
    
    clientId += 1;

	// Compteur et envoit des diverses informations
    my_timer = setInterval(function () { 
        my_client.obj.send(JSON.stringify({ 
            "tpsProchainTirage": tpsProchainTirage,
			"dernierNombreGagnant": dernierNombreGagnant,
			"joueur": my_client.nom,
			"joueurs": joueurs,
			"vainqueurs": vainqueurs
        })); 
    }, 1000); 
    
	// Réception des numéros joués
    client.on('message', function(data) { 
		joueurs[my_client.nom] = data;
        console.log('Reçu: ' + data); 
    });
    
	// déconnexion d'un client
    client.on('disconnect', function() { 
        clearTimeout(my_timer); 
		delete joueurs[joueur];
		
		if(joueurs.length == 0){
			clearTimeout(timerProchainTirage); 
		}

        console.log('disconnect'); 
    }); 
});
