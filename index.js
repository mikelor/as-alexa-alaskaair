//initialize express
var express = require('express');
var alexa = require('alexa-app');
verifier = require('alexa-verifier');
https = require('https');
fs = require('fs')
util = require('util')

var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(
    function (req, res, next) {
        if (!req.headers || !req.headers.signaturecertchainurl) {
            console.log("Unable to find request headers");
            return next();
        }

        req._body = true;
        req.rawBody = '';
        req.on('data',
            function (data) {
                return req.rawBody += data;
            }
        );

        return req.on('end',
            function () {
                var cert_url, er, requestBody, signature;
                try {
                    console.log(req.rawBody);
                    req.body = JSON.parse(req.rawBody);
                } catch (_error) {
                    console.log("Error encountered");
                    er = _error;
                    req.body = {};
                }
        
                cert_url = req.headers.signaturecertchainurl;
                signature = req.headers.signature;
                requestBody = req.rawBody;
                return verifier(
                    cert_url,
                    signature,
                    requestBody,
                    function (er) {
                        if (er) {
                            console.error('error validating the alexa cert:', er);
                            return res.status(401).json({
                                status: 'failure',
                                reason: er
                            });
                        } else {
                            return next();
                        }
                    }
                );
            }
        );
    }
);

//create and assign our Alexa App instance to an address on express, in this case https://as-alexa-alaskaair-662ykhdrpzmom.azurewebsites.net/api/alaska-agent
var alexaApp = new alexa.app("alaska-agent");
alexaApp.express(app, "/api/");

//make sure our app is only being launched by the correct application (our Amazon Alexa app)
alexaApp.pre =
    function (request, response, type) {
        if (request.sessionDetails.application.applicationId != "amzn1.ask.skill.50cae8cf-d04b-467f-96c0-80c9db6d0256") {
            console.log("Invalid ApplicationId");
            response.fail("Invalid applicationId");
        }
    };

//
// Launch Intent
//
alexaApp.launch(
    function (request, response) {
        response.card("Alaska Agent", "Welcome to the Alaska Airlines Agent Skill. How can I help you?");
        response.say("Welcome to the Alaska Airlines Agent Skill. How can I help you?");
        response.send();
    }
);

//
// AskJenn Intent
//
alexaApp.intent("AskJennIntent",
    {
        "slots": { "Question": "LITERAL" },
        "utterances": [
            "{Ask Jenn|Question}"
        ]
    },
    function (request, response) {
        console.log("Intent: AskJenn");

        var jennResponse;

        performRequest(
            'askjenn.alaskaair.com',
            '/AlmeApi/api/Conversation/converse',
            'POST',
            {
                question: request.slot('Question'),
                origin: 'Typed',
                parameters: {},
                channel: 'Alexa'
            },
            function (jennResponse) {
                var responseString = JSON.stringify(jennResponse);
                console.log(responseString);

                response.say(jennResponse.text);
                response.card("Alaska Agent", jennResponse.text + "\n" + jennResponse.navUrl.UrlAddress );
                response.send();
            }
        );
        // return false immediately so alexa-app doesn't send the response
        return false;
    }
);

//our GoodbyeAgent intent, this ends the conversation
//we'll add this back in if our app has more than one real intent
alexaApp.intent('GoodbyeAgent',
    {
        "slots" : {},
        "utterances": ["Shut up",
            "I don't want to hear anymore",
            "Good bye"]
    },
    function(request, response){
		response.say("Ok then. We can chat later  Just say: 'Alaska Agent'");
		response.send();
    }
);

//our About intent, this talks about the icons we used
alexaApp.intent('IntentAbout', {
    "slots": {},
    "utterances": ["Tell me about this app"]
    },
    function (request, response) {
        response.say("Hacked together over our Holiday break, enjoy.");
        response.send();
    });

//
// performRequest
//
function performRequest(host, endpoint, method, data, success) {
    console.log("Calling Method:" + host + endpoint);

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
        host: host,
        path: endpoint,
        method: method,
        headers: headers
    };

    var req = https.request(options,
        function (res) {
            res.setEncoding('utf-8');
            var responseString = '';

            res.on('data',
                function (data) {
                    responseString += data;
                }
            );

            res.on('end',
                function () {
                    console.log(responseString);
                    var responseObject = JSON.parse(responseString);
                    success(responseObject);
                }
            );
        }
   );

    req.write(dataString);
    req.end();
}

//
// a shortcut to get our app schema
//
app.get('/schema',
    function (request, response) {
        response.send('<pre>' + alexaApp.schema() + '</pre>');
    }
);

//
// a shortcut to get our app utterances
//
app.get('/utterances',
    function (request, response) {
        response.send('<pre>' + alexaApp.utterances() + '</pre>');
    }
);

//
// make sure we're listening on the assigned port
//
app.listen(app.get('port'),
    function () {
        console.log("Node app is running at localhost:" + app.get('port'));
    }
);
