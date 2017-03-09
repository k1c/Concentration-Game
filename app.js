// load necessary modules
var http = require('http');
var fs = require('fs');
var mime = require('mime-types');
var url = require('url');
var boardGame = require('./makeBoard');

const MAX_DIFFICULTY = 4;

const ROOT = "./public_html";

var users = {};   //empty Javascript object

// create http server
var server = http.createServer(handleRequest);
server.listen(2406);
console.log('Server listening on port 2406');

function handleRequest(req, res) {

	//process the request
	console.log(req.method+" request for: "+req.url);

	//parse the url
	var urlObj = url.parse(req.url,true);   //when url.parse is true, it allows to handle querys

	var filename = ROOT+urlObj.pathname;

	if (urlObj.pathname === "/memory/intro"){

		var game = {board:boardGame.makeBoard(4),difficulty:1,gameOver:false};    //starting the board with 4 X 4

		users[urlObj.query.username]=game;

		respond(200,JSON.stringify({difficulty:((game.difficulty+1)*2)}));  // sending the difficulty as the boardwidth.
																																				// difficulty:boardWidth ratio = 1:4, 2:6, 3:8, 4:10 (max)
	}else if(urlObj.pathname === "/memory/card"){

		if(urlObj.query.gameOver === "true"){   //if the game is over, increase the difficulty and built the board

			var game = users[urlObj.query.username];

			game.difficulty += 1;

			if (game.difficulty > MAX_DIFFICULTY){   //reset the game to 4X4 if you have won 10X10
				game.difficulty = 1;
			}
			game.board = boardGame.makeBoard((game.difficulty+1)*2);
			game.gameOver=false;

			users[urlObj.query.username]=game;

			respond(200,JSON.stringify({difficulty:(game.difficulty+1)*2}));

		}else{
			respond(200, "" + users[urlObj.query.username].board[urlObj.query.row][urlObj.query.column]);  //sending the number of the card that the user clicked
		}

	}else{

		//the callback sequence for static serving...
		fs.stat(filename,function(err, stats){
			if(err){   //try and open the file and handle the error, handle the error
				respondErr(err);
			}else{
				if(stats.isDirectory())	filename+="/index.html";

				fs.readFile(filename,"utf8",function(err, data){
					if(err)respondErr(err);
					else respond(200,data);
				});
			}
		});
	}
	
	//locally defined helper function
	//serves 404 files
	function serve404(){
		fs.readFile(ROOT+"/404.html","utf8",function(err,data){ //async
			if(err)respond(500,err.message);
			else respond(404,data);
		});
	}

	//locally defined helper function
	//responds in error, and outputs to the console
	function respondErr(err){
		console.log("Handling error: ",err);
		if(err.code==="ENOENT"){
			serve404();
		}else{
			respond(500,err.message);
		}
	}

	//locally defined helper function
	//sends off the response message
	function respond(code, data){
		// content header
		res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
		// write message and signal communication is complete
		res.end(data);
	}

};//end handle request
