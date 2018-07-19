import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as fs from 'fs';
import * as cron from 'cron';
import * as path from 'path';
import * as session from 'express-session';
import { router } from './routes';
import { rebuildServer } from './process-server/rebuildServer';

var config = require('../abodeConfig.json');

var app = express();

config.app_root = path.resolve(__dirname);

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

