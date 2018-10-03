import * as express from 'express';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as fs from "fs";
import * as indieAuth from '../indieauth';

export let sponsorRouter = express.Router();


sponsorRouter.get('/', (req, res, next) => {


    res.render('sponsor/sponsor');
});

sponsorRouter.post('/', (req, res, next) => {

    // bcrypt.compare(req.body.password, hash, function(err, doesMatch){
    //     if (doesMatch){
    //         let returnTo = req.session.returnTo || '/';
    //         delete req.session.returnTo;
    //         req.session.username = "https://eddiehinkle.com/";
    //         console.log(`Finished authenticating redirect to ${returnTo}`);
    //         res.redirect(returnTo);
    //     }else{
    //         res.render('login', { error: "Sorry, wrong password" });
    //     }
    // });

});