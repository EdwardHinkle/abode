var todaysDate = new Date();
var showConfetti = false;

// If it is New Year's Eve, New Year's Day or January 2, show Confetti
if ((todaysDate.getMonth() + 1 == "12" && todaysDate.getDate() == "31") ||
    (todaysDate.getMonth() + 1 == "1" && todaysDate.getDate() == "1") ||
    (todaysDate.getMonth() + 1 == "1" && todaysDate.getDate() == "2") ||
    (todaysDate.getMonth() + 1 == "6" && todaysDate.getDate() == "21")) {
    showConfetti = true;
}

var LENGTH_OF_CONFETTI = 6000;
var confettiIteration = 1;

window.onload = function () {
    if (document.getElementsByClassName("theme-confetti").length > 0) {
        showConfetti = true;
    } else if (document.getElementsByClassName("theme-snow").length > 0) {
        showSnow = true;
    }

    if (showConfetti) {
        var confettiController = new ConfettiController();

        var repeatConfetti = function () {
            confettiIteration++;
            setTimeout(function () {
                confettiController.restartConfetti();
                setTimeout(function () {
                    confettiController.stopConfetti();
                    repeatConfetti();
                }, LENGTH_OF_CONFETTI);
            }, (LENGTH_OF_CONFETTI * confettiIteration) + LENGTH_OF_CONFETTI);
        };

        confettiController.initializeConfetti();
        setTimeout(function () {
            confettiController.stopConfetti();
            repeatConfetti();
        }, LENGTH_OF_CONFETTI);
    }

    if (showSnow) {
        for (var i = 0; i<199; i++) {
            var newDiv = document.createElement("div");
            newDiv.classList.add("snow");
            newDiv.classList.add("s" + (i+1));
            document.body.appendChild(newDiv);
        }
    }
};