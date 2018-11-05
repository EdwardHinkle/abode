var selectedLines = [];

document.getElementsByClassName('code-container')[0].addEventListener('click', function(evt) {
    var lineId = evt.target.classList[0];

    if (lineId && lineId.indexOf('L') === 0) {
        if (evt.target.classList.contains('highlight-line')) {
            evt.target.classList.remove('highlight-line');
            selectedLines.splice(selectedLines.indexOf(lineId), 1);
            updateFragment(selectedLines);
        } else {
            evt.target.classList.add('highlight-line');
            selectedLines.push(lineId);
            updateFragment(selectedLines);
        }
    }
});

function updateFragment(activeLines) {
    activeLines = activeLines.map(function(lineId) { return lineId.slice(1, lineId.length); });
    activeLines.sort();

    var fragment = 'L';
    var lastLineNumbers = [];
    var selectedLineStart;
    activeLines.forEach(function(lineString, i) {
        var lineNumber = parseInt(lineString);
        var lastLine;

        if (lastLineNumbers.length > 0) {
            lastLine = lastLineNumbers[lastLineNumbers.length - 1];
        }

        if (lastLine) {
            var lineDifference = lineNumber - lastLine;
            if (lineDifference > 1) {
                if (selectedLineStart !== lastLineNumbers[lastLineNumbers.length - 1]) {
                    fragment += "-L" + lastLineNumbers[lastLineNumbers.length - 1];
                }
                fragment += ",L" + lineNumber;
                selectedLineStart = lineNumber;
            } else if (i === activeLines.length - 1) {
                fragment += "-L" + lineNumber;
            }
        } else {
            fragment += lineNumber;
            selectedLineStart = lineNumber;
        }

        lastLineNumbers.push(lineNumber);
    });
    window.location.hash = fragment;
}

window.addEventListener("load", function parseFragment() {
    console.log('checking fragment');
    var lineSegments = window.location.hash.split("#")[1].split(",");
    var activeLines= [];

    lineSegments.forEach(function(segment) {
        var segments = segment.split("-");
        var segmentStart = segments[0].split("L")[1];
        var segmentEnd = segments[1].split("L")[1];

        for (var i = segmentStart; i <= segmentEnd; i++) {
            activeLines.push(parseInt(i));
        }
    });

    activeLines.forEach(function(lineNumber) {
        document.getElementsByClassName("code-container")[0].getElementsByClassName("L" + lineNumber)[0].classList.add("highlight-line");
    });

});