function validateForm() {
    const name = document.getElementById("name").value.trim();
    const comments = document.getElementById("comments").value.trim();
    const genderMale = document.getElementById("male").checked;
    const genderFemale = document.getElementById("female").checked;

    if (name === "") {
        alert("Please enter your name.");
        return false;
    }

    if (comments === "") {
        alert("Please enter your comments.");
        return false;
    }

    if (!genderMale && !genderFemale) {
        alert("Please select your gender.");
        return false;
    }

    alert("Form submitted successfully!");
    return true;
}
