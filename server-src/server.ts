import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as fs from 'fs';
import * as cron from 'cron';
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

new cron.CronJob('0 0 2 * * *', function() {
	rebuildServer();
}, null, true, 'America/New_York');
