var fs = require('fs'); // file system for reading/writing to computer
var express = require('express');
var bodyParser = require('body-parser'); // allows you to parse JSON.
var app = express();
var cors = require('cors') // makes this backend allow frontend traffic (eg. for AJAX requests) from any domain.
app.use(cors());
app.use(bodyParser.json({limit: '50mb'})); // gives our application support for JSON-formatted PUT or POST requests.
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

/* Creates a mapping between your filesystem, and the filesystem you pretend exists.
 * If you ask for the first parameter to be just '', then no extra folder is inserted in front of the 'images' in the URL presented to the user.
 * In this case: We can access file://...site/images/index.html at:
 * http://localhost:3000/index.html
 * Rules that the images folder in site/ needs to be presented in URLs as nothing at all. */
app.use('', express.static('site'));

// Listens continuously on port 3000
app.listen(3000, function (){
   console.log('Server started. Please navigate to localhost:3000 to view website.');
});

/** 
  * Generates either 'abcdef123.json' (main JSON), 'abcdef123.txt' (report) based on the file extension passed in.
  * If request.body.extension is '.json', will write the main JSON file.
  * Else (eg. '.txt'), it will append to the report file.
  */
app.post('/generator', function(request, response){
	var filepath =  'feedback/' + request.body.uid + request.body.extension;
	var payload;

	if(request.body.extension === '.txt') payload = request.body.separator + '\n' + JSON.stringify(request.body.input, null, "  ") + '\n';
	else if(request.body.extension === '.json') payload = JSON.stringify(request.body.input); // minified
	else if(request.body.extension === '.status') payload = JSON.stringify(request.body.input); // minified

	if(request.body.extension === '.json') {
		// http://stackoverflow.com/questions/2496710/writing-files-in-node-js
		fs.writeFile(
			filepath,
		 	payload,

		  	function (err) {
		  		if (err) {
		  			console.log("Error: " + err);
		  			response.status(500).end(); // server-internal error
		  			throw err;
		  		}
		  		console.log('The "data to write" was written to file!');
		  		response.status(200).end();
			}
		);
	}
	else if (request.body.extension === '.txt'){
		// http://stackoverflow.com/questions/3459476/how-to-append-to-a-file-in-node
		fs.appendFile(
			filepath,
		 	payload,

		  	function (err) {
		  		if (err) {
		  			console.log("Error: " + err);
		  			response.status(500).end(); // server-internal error
		  			throw err;
		  		}
		  		console.log('The "data to append" was appended to file!');
		  		response.status(200).end();
			}
		);
	}
	else if (request.body.extension === '.status'){
		fs.writeFile(
			filepath,
		 	payload,

		  	function (err) {
		  		if (err) {
		  			console.log("Error: " + err);
		  			response.status(500).end(); // server-internal error
		  			throw err;
		  		}
		  		console.log('The "data to write" was written to file!');
		  		response.status(200).end();
			}
		);
	}
	// else throw notImplementedException

});

/** 
  * Reads the main JSON file based on the uid passed in.
  */
app.post('/quiz', function(request, response){
	var filepath =  'feedback/' + request.body.uid + request.body.extension;

	fs.readFile(filepath, 'utf8', function (err, contents) {
	  if (err) {
	  	response.status(500).end(); // server-internal error
	    return console.log(err);
	  }
	  var o = JSON.parse(contents);
	  // console.log(contents);
	  response.json(o);
	});
});

