var roles = [
    "UI / UX Engineer",
    "iOS App Developer",
    "Frontend Developer",
    "Geospatial Engineer",
    "Backend Developer"
];

var currentRole = 0;

setInterval(function() {
    if (currentRole < roles.length - 1) {
        currentRole++;
    } else {
        currentRole = 0;
    }

    var nextRole = roles[currentRole].split("");
    document.getElementById('rolename').innerHTML = "";

    var typingInterval = setInterval(function() {
        document.getElementById('rolename').innerHTML += nextRole.shift();
        if (nextRole.length < 1) {
            clearInterval(typingInterval);
        }
    }, 100);

}, 10000);