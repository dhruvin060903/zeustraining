function validateForm(event) {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const comments = document.getElementById("comments").value.trim();
    const genderMale = document.getElementById("male").checked;
    const genderFemale = document.getElementById("female").checked;
    if (name === "") {
        alert("Please enter your name.");
        document.getElementById("name").focus();
        return false;
    }

    if (comments === "") {
        alert("Please enter your comments.");
        document.getElementById("comments").focus();
        return false;
    }

    if (!genderMale && !genderFemale) {
        alert("Please select your gender.");
        return false;
    }

    alert("Form submitted successfully!");
    document.getElementById("name").value = "";
    document.getElementById("comments").value = "";
    document.getElementById("male").checked = false;
    document.getElementById("female").checked = false;
    

    return true;
}
