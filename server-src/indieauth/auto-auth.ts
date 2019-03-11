export let checkForUserToken = (req, res, next) => {
    console.log('AutoAuth Middleware!');
    if (req.session.username !== undefined) {
        console.log('User is logged in, no need to authenticate');
        next();
    }

    console.log('TODO: Check for a token');
    console.log('TODO: Verify token');
    console.log('TODO: Add existing user to session');

    // req.session.username = "https://vanderven.se/martijn/";
    // req.session.username = "https://cleverdevil.io/";
    // req.session.username = "https://eddiehinkle.com/";

    console.log("Masquarding as " + req.session.username);

    next();
}