var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser'); // allows you to parse JSON.
var app = express();
var cors = require('cors') // makes this backend allow frontend traffic (eg. for AJAX requests) from any domain.
app.use(cors());
app.use(bodyParser.json()); // gives our application support for JSON-formatted PUT or POST requests.

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

app.post('/generator', function(request, response){

	// // http://stackoverflow.com/questions/2496710/writing-files-in-node-js
	// fs.writeFile("feedback/test.txt", request.body.feedback, function(err) {
	//     if(err) return console.log(err);

	//     console.log("The file was saved!");
	// });

	// http://stackoverflow.com/questions/3459476/how-to-append-to-a-file-in-node
	fs.appendFile('feedback/test.txt', JSON.stringify(request.body.feedback, null, "  "), function (err) {
	  if (err) throw err;
	  console.log('The "data to append" was appended to file!');
	});
});
