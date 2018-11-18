import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as fs from 'fs';
import * as cron from 'cron';
import * as path from 'path';
import * as session from 'express-session';
import { router } from './routes';
import * as sqlite3 from 'sqlite3';
import {CacheController} from "./model/cache.controller";
import {DataController} from "./model/data.controller";
import { LocationController } from "./location/location.controller";
import {Cards} from "./model/cards.model";
import {GitController} from "./git";

const sqlite = sqlite3.verbose();
var config = require('../abodeConfig.json');

var app = express();

config.app_root = path.resolve(__dirname);
config.db = new sqlite.Database(`${config.app_root}/../_storage/cache.db`, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {

    if (err) {
        console.error(err.message);
    }

    DataController.db = config.db;
    CacheController.cacheExists(exists => {
        if (!exists) {
            console.log('Building Cache...');
            CacheController.buildCache();
        }
    });

});

app.set('views', './views');
app.set('view engine', 'pug');
app.set('config', config);

app.listen(config.PORT, function() {
	console.log("Abode API running on " + config.PORT);
});

let sessionInfo = {
    secret: '31oYwcDP3TbhNqXLIYEAeIzwEbk=',
    resave: false,
    saveUninitialized: true,
    cookie: {}
};

if (config.ENV === "production") {
    console.log('Production build trust proxy');
    app.set('trust proxy', 1);
    sessionInfo.cookie = { secure: true };
}

app.use(session(sessionInfo));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    if (/.*\.json/.test(req.path)) {
        res.header("Content-Type", "application/json; charset=utf-8");
    }
    next();
});

// App Routes
app.use('/', router);

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
      return res.status(503).render('posts/errorMessage', {
          errorMessage: `Sorry, this page couldn't be found.<br>You could check out <a href='/today'>Today's posts</a> or visit <a href='/'>my homepage</a>.`
      });
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

new cron.CronJob('0 */20 * * * *', function() {
  console.log('running routine cron job');
  GitController.runGitStageAll().then(() => {
     GitController.runGitCommit().then(() => {
        GitController.runGitPull().then(() => {
            GitController.runGitPush().then(() => {
                console.log('Git committed and pushed');
            });
        });
     });
  });
  LocationController.cacheCurrentLocation();
}).start();

process.on('SIGINT', () => {
    console.log('Closing Database Connection');
    if (config.db !== undefined) {
        config.db.close();
        config.db = undefined;
    }
});