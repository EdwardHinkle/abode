import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as fs from 'fs';
import * as cron from 'cron';
import * as path from 'path';
import { router } from './routes';
import { rebuildServer } from './process-server/rebuildServer';

var config = require('../abodeConfig.json');

var app = express();

app.listen(config.PORT, function() {
	console.log("Abode API running on " + config.PORT);
});

app.use(bodyParser.json());

// App Routes
app.use('/', router);

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
	res.sendFile(path.join(__dirname, '../jekyll/_build/404.html'));
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

new cron.CronJob('0 0 2 * * *', function() {
	rebuildServer();
}, null, true, 'America/New_York');
