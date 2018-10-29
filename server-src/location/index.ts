import * as express from "express";

export let locationRouter = express.Router();

// Routes
locationRouter.post('/ping', locationPing);

function locationPing(req, res, next) {
    console.log('Location Ping');
    console.log(req.body);
    res.status(200).send('location updated');
}
