'use strict'

let express = require('express')
let app = express()
let bodyParser = require('body-parser')
let axios = require('axios')

// These two following lines ensures that every incomming request is parsed to json automatically
app.use(bodyParser.urlencoded({ extended: 'true' }))
app.use(bodyParser.json())
// Allowing access to resources from anywhere
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

const computeUrl = date => `https://www.iiens.net/etudiants/edt/json_services/events.php?${date}-3-/allemand1/GR1/op31.4/op32.3g1/op33.2g1/op34.2`;

const extractClassEvents = jsonResponse =>
  Object.keys(jsonResponse.eventgroups)
    .map(key => jsonResponse.eventgroups[key].events[Object.keys(jsonResponse.eventgroups[key].events)[0]])
    .filter(event => event.type === 'Cours');

const quarterToTime = quarter => {
  const minutes = (quarter % 4) * 15;
  const hours = (quarter - (quarter % 4)) / 4;

  return minutes === 0 ? `${hours}h` : `${hours}:${minutes}`;
}

const computeResponse = classEvents => {
  if (classEvents.length === 0) return "Tu n'as rien";
  return classEvents.reduce((agg, event, index) => {
    const separator = index === 0 ? '' :
      index === classEvents.length -1 ? ' et' : ',';
    const eventTime = quarterToTime(event.start);

    return `${agg}${separator} ${event.title} à ${eventTime}`
  }, 'Voici tes cours : ');
};

app.post('/', async (req, res) => {
  let response = {};
  const intentName = req.body.queryResult.intent.displayName;

  if (intentName === 'hello') {
    response = {
      fulfillmentText: "Hello",
    }
  } else if (intentName === 'askPlanning') {
    const date = req.body.queryResult.parameters.date.substring(0, 10).replace(/-/g, '/');
    const url = computeUrl(date);

    const iiensResponse = await axios.get(url).then(response => response.data);

    response = {
      fulfillmentText: computeResponse(extractClassEvents(iiensResponse)),
    }
  }

  res.json(response);
})

app.get('/health', (req, res) => {
  res.send('ok')
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port)
console.log('info', `server listening on port ${port}`)
