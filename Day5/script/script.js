
const announcements = [
    {
        name: "Wilson Kumar",
        description: "No classes will be held on 21st Nov",
        files: 2,
        date: "15-Sep-2018 at 07:21 pm",
        // course: "Mathematics 101",
        done: true,
        bgColor: "#fff"
    },
    {
        name: "Samson White",
        description: "Guest lecture on Geometry on 20th September",
        files: 2,
        date: "15-Sep-2018 at 07:21 pm",
        // course: "Mathematics 101",
        done: false,
        bgColor: "#FFFFEE"
    },
    {
        name: "Wilson Kumar",
        description: "Additional course materials available on request",
        // files: 0,
        date: "15-Sep-2018 at 07:21 pm",
        course: "Mathematics 101",
        done: true,
        bgColor: "#fff"
    },
    {
        name: "Wilson Kumar",
        description: "No classes will be held on 25th Dec",
        files: 0,
        date: "15-Sep-2018 at 07:21 pm",
        // course: "Mathematics 101",
        done: false,
        bgColor: "#FFFFEE"
    },
    {
        name: "Wilson Kumar",
        description: "No classes will be held on 25th Dec",
        files: 0,
        date: "15-Sep-2018 at 07:21 pm",
        course: "Mathematics 101",
        done: false,
        bgColor: "#FFFFEE"
    }
];
const notification = [
     {

        description: "No classes will be held on 21st Nov",

        date: "15-Sep-2018 at 07:21 pm",
        // course: "Mathematics 101",
        done: true,
        bgColor: "#fff"
    },
    {

        description: "Guest lecture on Geometry on 20th September",

        date: "15-Sep-2018 at 07:21 pm",
        // course: "Mathematics 101",
        done: false,
        bgColor: "#FFFFEE"
    },
    {

        description: "Additional course materials available on request",

        date: "15-Sep-2018 at 07:21 pm",
        course: "Mathematics 101",
        done: true,
        bgColor: "#fff"
    },
    {

        description: "No classes will be held on 25th Dec",

        date: "15-Sep-2018 at 07:21 pm",
        // course: "Mathematics 101",
        done: false,
        bgColor: "#FFFFEE"
    },
    {

        description: "No classes will be held on 21st Nov",

        date: "15-Sep-2018 at 07:21 pm",
        // course: "Mathematics 101",
        done: true,
        bgColor: "#fff"
    },
    {

        description: "Guest lecture on Geometry on 20th September",

        date: "15-Sep-2018 at 07:21 pm",
        // course: "Mathematics 101",
        done: false,
        bgColor: "#FFFFEE"
    },
    {

        description: "Additional course materials available on request",

        date: "15-Sep-2018 at 07:21 pm",
        course: "Mathematics 101",
        done: true,
        bgColor: "#fff"
    },
    {

        description: "No classes will be held on 25th Dec",

        date: "15-Sep-2018 at 07:21 pm",
        // course: "Mathematics 101",
        done: false,
        bgColor: "#FFFFEE"
    },
    {
        description: "No classes will be held on 25th Dec",

        date: "15-Sep-2018 at 07:21 pm",
        course: "Mathematics 101",
        done: false,
        bgColor: "#FFFFEE"
    }
];
function intailizeAnnouncement() {
    const container = document.getElementById("announcementstPopupInner");

    let allHtml = "";

    announcements.forEach(item => {
        allHtml += `
    <div class="announcementItemCard" style="background-color: ${item.bgColor || "#fff"};">
      <div class="announcementHeader">
        <span><span class="Pa">PA:</span> ${item.name || ""}</span>
        <span></span>
      </div>
      
      <div class="announcementTitle">${item.description || "No description available"}</div>
      
      ${item.course ? `<div class="announcementCourse">Course: ${item.course}</div>` : ""}
      
      <div class="announcementfiles">
        <div><span>
          ${typeof item.files === "number" && item.files > 0
                ? `${item.files} file${item.files !== 1 ? "s" : ""} are attached`
                : ""}
        </span></div>
        <div><span>${item.date || "Date not available"}</span></div>
      </div>
    </div>
   
  `;
    });
    container.insertAdjacentHTML('beforeend', allHtml);



}
function intailizeNotification() {
    const container = document.getElementById("notificationPopupInner");

    let allHtml = "";

    notification.forEach(item => {
        allHtml += `
    <div class="announcementItemCard" style="background-color: ${item.bgColor || "#fff"};">
     
      
      <div class="announcementTitle">${item.description || "No description available"}</div>
      
      ${item.course ? `<div class="announcementCourse">Course: ${item.course}</div>` : ""}
      
      <div class="announcementfiles">
        <div><span>
          ${typeof item.files === "number" && item.files > 0
                ? `${item.files} file${item.files !== 1 ? "s" : ""} are attached`
                : ""}
        </span></div>
        <div><span>${item.date || "Date not available"}</span></div>
      </div>
    </div>
   
  `;
    });
    container.insertAdjacentHTML('beforeend', allHtml);



}
intailizeNotification();
function displayMenu() {
    document.getElementById("navbarForSmallScreen").style.display = "block";

}

function hideMenu() {
    document.getElementById("navbarForSmallScreen").style.display = "none";
}

function displaySubMenu(component1, component2) {
    document.getElementById(component1.id).style.display = "block";
    document.getElementById(component1.id).style.backgroundColor = "#F3F3F3";
    document.getElementById(component2.id).style.backgroundColor = "#F3F3F3";
    const collection = document.getElementById(component2.id).children;
    // console.log(component2)
    collection[0].src = "./images/keyboard_arrow_up.svg";
}

function hideSubMenu(component1, component2) {
    document.getElementById(component1.id).style.display = "none";
    document.getElementById(component1.id).style.backgroundColor = "#FFFFFF";
    document.getElementById(component2.id).style.backgroundColor = "#FFFFFF";
    const collection = document.getElementById(component2.id).children;
    collection[0].src = "./images/keyboard_arrow_down.svg";
}



function displayAnnouncements() {
    document.getElementById("announcementstPopup").style.display = "block";

}

function hideAnnouncements() {
    document.getElementById("announcementstPopup").style.display = "none";
}
