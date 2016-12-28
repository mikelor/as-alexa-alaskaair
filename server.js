var express = require("express");
var alexa = require("alexa-app");
var bodyParser = require("body-parser");

var app = express();
var PORT = process.env.port || 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");

var alexaApp = new alexa.app("test");

alexaApp.launch(function (request, response) {
    response.say("You launched the app!");
});

alexaApp.dictionary = { "names": ["matt", "joe", "bob", "bill", "mary", "jane", "dawn"] };

alexaApp.intent("nameIntent", {
    "slots": { "NAME": "LITERAL" },
    "utterances": [
        "my {name is|name's} {names|NAME}", "set my name to {names|NAME}"
    ]
},
    function (request, response) {
        response.say("Success!");
    }
);

alexaApp.express(app, "/api/echo");

// launch /echo/test in your browser with a GET request

app.listen(PORT);
console.log("Listening on port " + PORT);

/*
var express = require('express')
    , app = express()
    , server = require('http').createServer(app)
    , port = process.env.PORT || 3000
    , fs = require('fs')
    , util = require('util')
    , https = require('https');

// https://as-alexaecho.scm.azurewebsites.net/api/logstream

// Creates the website server on the port #
server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

// Express Routing
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);

// Helper function to format the strings so that they don't include spaces and are all lowercase 
var FormatString = function (string) {
    var lowercaseString = string.toLowerCase();
    var formattedString = lowercaseString.replace(/\s/g, '');
    return formattedString;
};

function performRequest(endpoint, method, data, success) {
    var dataString = JSON.stringify(data);
    var headers = {};

    if (method == 'GET') {
        endpoint += '?' + querystring.stringify(data);
    }
    else {
        headers = {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length
        };
    }
    var options = {
        host: 'askjenn.alaskaair.com',
        path: endpoint,
        method: method,
        headers: headers
    };

    var req = https.request(options, function (res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            console.log(responseString);
            var responseObject = JSON.parse(responseString);
            console.log("responseObject = [" + responseObject + "]");
            console.log("responseObject.text =(" + responseObject.text + ")");
            success(responseObject);
        });
    });

    req.write(dataString);
    req.end();
}

// Handles the route for echo apis
app.post('/api/echo', function (req, res) {
    console.log("received echo request");
    var requestBody = "";

    // Will accumulate the data
    req.on('data', function (data) {
        requestBody += data;
    });

    // Called when all data has been accumulated
    req.on('end', function () {
        var responseBody = {};
        console.log(requestBody);
        console.log(JSON.stringify(requestBody));

        // parsing the requestBody for information
        var jsonData = JSON.parse(requestBody);
        if (jsonData.request.type == "LaunchRequest") {
            // crafting a response
            responseBody = {
                "version": "0.1",
                "response": {
                    "outputSpeech": {
                        "type": "PlainText",
                        "text": "Welcome to Echo Sample! Please say a command"
                    },
                    "card": {
                        "type": "Simple",
                        "title": "Opened",
                        "content": "You started the Node.js Echo API Sample"
                    },
                    "reprompt": {
                        "outputSpeech": {
                            "type": "PlainText",
                            "text": "Say a command"
                        }
                    },
                    "shouldEndSession": false
                }
            };
        }
        else if (jsonData.request.type == "IntentRequest") {
            var outputSpeechText = "";
            var cardContent = "";

            console.log('Received Intent Request {%s}', jsonData.request.intent.name);

            if (jsonData.request.intent.name == "AskQuestion") {
                // The Intent "TurnOn" was successfully called
                // outputSpeechText = "Congrats! You asked to turn on " + jsonData.request.intent.slots.Question.value + " but it was not implemented";
                cardContent = "Successfully called " + jsonData.request.intent.name + ", but it's not implemented!";
                var jennResponse;

                performRequest(
                    '/AlmeApi/api/Conversation/converse',
                    'POST',
                    {
                        question: jsonData.request.intent.slots.Question.value,
                        origin: 'Typed',
                        parameters: {},
                        channel: 'Alexa'
                    },
                    function (jennResponse) {
                        var responseString = JSON.stringify(jennResponse);
                        console.log("[" + responseString + "]");
                        outputSpeechText = jennResponse.text;
                        cardContent = "Successfully called " + jsonData.request.intent.name + ", but it's not implemented!";
                        console.log("jennResponse.Text =[" + jennResponse.text + "]");
                    }
                );
            }
            else if (jsonData.request.intent.name == "TurnOn") {
                // The Intent "TurnOn" was successfully called
                outputSpeechText = "Congrats! You asked to turn on " + jsonData.request.intent.slots.Device.value + " but it was not implemented";
                cardContent = "Successfully called " + jsonData.request.intent.name + ", but it's not implemented!";
            }
            else if (jsonData.request.intent.name == "TurnOff") {
                // The Intent "TurnOff" was successfully called
                outputSpeechText = "Congrats! You asked to turn off " + jsonData.request.intent.slots.Device.value + " but it was not implemented";
                cardContent = "Successfully called " + jsonData.request.intent.name + ", but it's not implemented!";
            } else {
                outputSpeechText = jsonData.request.intent.name + " not implemented";
                cardContent = "Successfully called " + jsonData.request.intent.name + ", but it's not implemented!";
            }

            // Debug
            console.log("outputSpeech (" + outputSpeechText + ")");
            console.log("cardContent (" + cardContent + ")");

            responseBody = {
                "version": "0.1",
                "response": {
                    "outputSpeech": {
                        "type": "PlainText",
                        "text": outputSpeechText
                    },
                    "card": {
                        "type": "Simple",
                        "title": "Open Smart Hub",
                        "content": cardContent
                    },
                    "shouldEndSession": false
                }
            };
        } else {
            // Not a recognized type
            responseBody = {
                "version": "0.1",
                "response": {
                    "outputSpeech": {
                        "type": "PlainText",
                        "text": "Could not parse data"
                    },
                    "card": {
                        "type": "Simple",
                        "title": "Error Parsing",
                        "content": JSON.stringify(requestBody)
                    },
                    "reprompt": {
                        "outputSpeech": {
                            "type": "PlainText",
                            "text": "Say a command"
                        }
                    },
                    "shouldEndSession": false
                }
            };
        }

        res.statusCode = 200;
        res.contentType('application/json');
        res.send(responseBody);
    });
});
*/