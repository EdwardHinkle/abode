import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as fs from 'fs';
import { router } from './routes';

var config = require('../abodeConfig.json');

var app = express();

app.listen(config.PORT, function() {
	console.log("Abode API running on " + config.PORT);
});

app.use(bodyParser.json());

// App Routes
app.use('/', router);

// var exec = require('child_process').exec;
// var CronJob = require('cron').CronJob;

// new CronJob('0 0 2 * * *', function() {
// 	winston.info("Cron Running ", moment().toDate());
// 	exec("./update-eh-personal", puts);
// }, null, true, 'America/New_York');
