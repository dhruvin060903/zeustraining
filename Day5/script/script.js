
// const announcements = [
//     {
//         name: "Wilson Kumar",
//         description: "No classes will be held on 21st Nov",
//         files: 2,
//         date: "15-Sep-2018 at 07:21 pm",
//         // course: "Mathematics 101",
//         done: true,
//         bgColor: "#fff"
//     },
//     {
//         name: "Samson White",
//         description: "Guest lecture on Geometry on 20th September",
//         files: 2,
//         date: "15-Sep-2018 at 07:21 pm",
//         // course: "Mathematics 101",
//         done: false,
//         bgColor: "#FFFFEE"
//     },
//     {
//         name: "Wilson Kumar",
//         description: "Additional course materials available on request",
//         // files: 0,
//         date: "15-Sep-2018 at 07:21 pm",
//         course: "Mathematics 101",
//         done: true,
//         bgColor: "#fff"
//     },
//     {
//         name: "Wilson Kumar",
//         description: "No classes will be held on 25th Dec",
//         files: 0,
//         date: "15-Sep-2018 at 07:21 pm",
//         // course: "Mathematics 101",
//         done: false,
//         bgColor: "#FFFFEE"
//     },
//     {
//         name: "Wilson Kumar",
//         description: "No classes will be held on 25th Dec",
//         files: 0,
//         date: "15-Sep-2018 at 07:21 pm",
//         course: "Mathematics 101",
//         done: false,
//         bgColor: "#FFFFEE"
//     }
// ];
// const notification = [
//     {

//         description: "No classes will be held on 21st Nov",

//         date: "15-Sep-2018 at 07:21 pm",
//         // course: "Mathematics 101",
//         done: true,
//         bgColor: "#fff"
//     },
//     {

//         description: "Guest lecture on Geometry on 20th September",

//         date: "15-Sep-2018 at 07:21 pm",
//         // course: "Mathematics 101",
//         done: false,
//         bgColor: "#FFFFEE"
//     },
//     {

//         description: "Additional course materials available on request",

//         date: "15-Sep-2018 at 07:21 pm",
//         course: "Mathematics 101",
//         done: true,
//         bgColor: "#fff"
//     },
//     {

//         description: "No classes will be held on 25th Dec",

//         date: "15-Sep-2018 at 07:21 pm",
//         // course: "Mathematics 101",
//         done: false,
//         bgColor: "#FFFFEE"
//     },
//     {

//         description: "No classes will be held on 21st Nov",

//         date: "15-Sep-2018 at 07:21 pm",
//         // course: "Mathematics 101",
//         done: true,
//         bgColor: "#fff"
//     },
//     {

//         description: "Guest lecture on Geometry on 20th September",

//         date: "15-Sep-2018 at 07:21 pm",
//         // course: "Mathematics 101",
//         done: false,
//         bgColor: "#FFFFEE"
//     },
//     {

//         description: "Additional course materials available on request",

//         date: "15-Sep-2018 at 07:21 pm",
//         course: "Mathematics 101",
//         done: true,
//         bgColor: "#fff"
//     },
//     {

//         description: "No classes will be held on 25th Dec",

//         date: "15-Sep-2018 at 07:21 pm",
//         // course: "Mathematics 101",
//         done: false,
//         bgColor: "#FFFFEE"
//     },
//     {
//         description: "No classes will be held on 25th Dec",

//         date: "15-Sep-2018 at 07:21 pm",
//         course: "Mathematics 101",
//         done: false,
//         bgColor: "#FFFFEE"
//     }
// ];


function displaySubMenu(component1, component2) {
    document.getElementById(component1.id).style.display = "block";
    document.getElementById(component1.id).style.backgroundColor = "#F3F3F3";
    document.getElementById(component2.id).style.backgroundColor = "#F3F3F3";
    const collection = document.getElementById(component2.id).children;
    collection[0].src = "./images/keyboard_arrow_up.svg";
}

function hideSubMenu(component1, component2) {
    document.getElementById(component1.id).style.display = "none";
    document.getElementById(component1.id).style.backgroundColor = "#FFFFFF";
    document.getElementById(component2.id).style.backgroundColor = "#FFFFFF";
    const collection = document.getElementById(component2.id).children;
    collection[0].src = "./images/keyboard_arrow_down.svg";
}
function displayMenu() {
    document.getElementById("navbarForSmallScreen").style.display = "block";
    const collection = document.getElementById("hamburgerMenuImg");
    collection.src = "./images/hamburger-menu-white.svg";
}

function hideMenu() {
    document.getElementById("navbarForSmallScreen").style.display = "none";
    const collection = document.getElementById("hamburgerMenuImg");
    collection.src = "./images/hamburger-menu.svg";
}



function displayAnnouncements() {
    document.getElementById("announcementstPopup").style.display = "block";
    const collection = document.getElementById("announcement-bell");
    collection.style.backgroundImage = "url('./images/announcements-white.svg')";
    const badge = document.getElementById("announcement-badge");
    badge.style.display = "none";
}

function hideAnnouncements() {
    document.getElementById("announcementstPopup").style.display = "none";
    const collection = document.getElementById("announcement-bell");
    collection.style.backgroundImage = "url('./images/announcements.svg')";
    const badge = document.getElementById("announcement-badge");
    badge.style.display = "flex";
}

function displayAlert() {
    document.getElementById("notificationPopup").style.display = "block";
const collection = document.getElementById("alert-bell");
    collection.style.backgroundImage = "url('./images/alerts-white.svg')";
    const badge = document.getElementById("alert-badge");
    badge.style.display = "none";
}

function hideAlert() {
    // console.log("dfsd")
    document.getElementById("notificationPopup").style.display = "none";
       const collection = document.getElementById("alert-bell");
    collection.style.backgroundImage = "url('./images/alerts.svg')";
    const badge = document.getElementById("alert-badge");
    badge.style.display = "flex";
}

// const cards = [
//   {
//     image: "./images/imageMask-1.svg",
//     title: "Acceleration",
//     grade: "Physics | Grade 7",
//     greenCount: 2,
//     units: 4,
//     lessons: 18,
//     topics: 24,
//     classes: ["Mr. Frank's Class B"],
//     studentsInfo: "50 Students | 21-Jan-2020 - 21-Aug-2020",
//     icons: {
//       manage: true,
//       grade: true,
//       report: true
//     },
//     favourite: "./images/favourite.svg",
//     expired: false
//   },
//   {
//     image: "./images/imageMask-2.svg",
//     title: "Displacement, Velocity and Speed",
//     grade: "Physics 2 | Grade 6",
//     greenCount: 3,
//     units: 2,
//     lessons: 15,
//     topics: 20,
//     classes: ["No Classes", "Course Name"],
//     studentsInfo: "",
//     icons: {
//       manage: false,
//       grade: false,
//       report: true
//     },
//     favourite: "./images/favourite.svg",
//     expired: false
//   },
//   {
//     image: "./images/imageMask.svg",
//     title: "Introduction to Biology: Micro organisms and how they affect...",
//     grade: "Biology | Grade 4",
//     greenCount: 1,
//     units: 5,
//     lessons: 16,
//     topics: 22,
//     classes: ["All Classes"],
//     studentsInfo: "300 Students",
//     icons: {
//       manage: false,
//       grade: false,
//       report: true
//     },
//     favourite: "./images/favourite.svg",
//     expired: false
//   },
//   {
//     image: "./images/imageMask-3.svg",
//     title: "Introduction to High School Mathematics",
//     grade: "Mathematics | Grade 8",
//     greenCount: 3,
//     units: 4,
//     lessons: 18,
//     topics: 24,
//     classes: ["Mr. Frank's Class A"],
//     studentsInfo: "44 Students | 14-Oct-2019 - 20-Oct-2020",
//     icons: {
//       manage: true,
//       grade: true,
//       report: true
//     },
//     favourite: "./images/favourite -2.svg",
//     expired: true
//   }
// ];


function intailizeAnnouncement(announcements) {
    const container = document.getElementById("announcementstPopupInner");

    let allHtml = "";

    announcements.forEach(item => {
        allHtml += `
    <div class="announcementItemCard" style="background-color: ${item.bgColor || "#fff"};">
      <div class="announcementHeader">
        <span><span class="Pa">PA:</span> ${item.name || ""}</span>
        <span>${item.done? `<img src="./images/correct.png" alt="attach-icon" height="16px" width="15px"/>`:`<img src="./images/zoom-in.png" alt="attach-icon" height="17px" width="19px"/>`}</span>
      </div>
      
      <div class="announcementTitle">${item.description || "No description available"}</div>
      
      ${item.course ? `<div class="announcementCourse">Course: ${item.course}</div>` : ""}
      
      <div class="announcementfiles">
      <div style="display:flex;">
      <span>
     
          ${typeof item.files === "number" && item.files > 0
                ? ` <img src="./images/attach_file.svg" alt="attach-icon" height="13px" width="16px"/>${item.files} file${item.files !== 1 ? "s" : ""} are attached`
                : ""}
        </span></div>
        <div><span>${item.date || "Date not available"}</span></div>
      </div>
    </div>
   
  `;
    });
    container.insertAdjacentHTML('beforeend', allHtml);
}
function intailizeNotification(notifications) {
    const container = document.getElementById("notificationPopupInner");

    let allHtml = "";

    notifications.forEach(item => {
        allHtml += `
    <div class="announcementItemCard" style="background-color: ${item.bgColor || "#fff"};">
     
      
      <div class="announcementTitle"> <div>${item.description || "No description available"}</div>
      ${item.done? `<img src="./images/correct.png" alt="attach-icon" height="16px" width="15px"/>`:`<img src="./images/zoom-in.png" alt="attach-icon" height="17px" width="19px"/>`}
      </div>
      
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
function cardIntialization(cards){
    let cardHTML = "";
    
    cards.forEach(card => {
      cardHTML += `
        <div class="card">
          ${card.expired ? `<div class="expire">EXPIRED</div>` : ""}
          <div class="cardcontent">
            <img class="cardImg" src="${card.image}" alt="cardimg" />
            <div class="cardTextContent">
              <div class="cardTitle">
                <span class="title">${card.title}</span>
                <img src="${card.favourite}" alt="favourite" class="favouriteImg ${card.favourite.includes('-2') ? 'emptyStar' : ''}" />
              </div>
    
              <div class="grade">
                <span>${card.grade} +<span class="green">${card.greenCount}</span></span>
              </div>
              
              <div class="ULT">
                <span><b>${card.units}</b> Units <b>${card.lessons}</b> Lessons <b>${card.topics}</b> Topics</span>
              </div>
              
              <div class="selectClass">
                <select class="course ${card.classes.includes('No Classes') ? 'noClass' : ''}">
                  ${card.classes.map(cls => `<option value="${cls}">${cls}</option>`).join('')}
                </select>
              </div>
              
              <div class="cardDates">
                <span>${card.studentsInfo}</span>
              </div>
            </div>
          </div>
          <div class="cardIcons">
            <div class="cardIconsMargin">
              <img src="./images/preview.svg" alt="previewimg" class="previewimg" />
              <img src="./images/manage course.svg" alt="manage course" class="gardeImg ${card.icons.manage ? "" : "disabledIcons"}" />
              <img src="./images/grade submissions.svg" alt="gradeimg" class="${card.icons.grade ? "" : "disabledIcons"}" />
              <img src="./images/reports.svg" alt="report" class="report" />
            </div>
          </div>
        </div>
      `;
    });
    
    // Append to DOM
    document.querySelector(".card-container").innerHTML = cardHTML;

}

async function loadCards() {
  try {
    const response = await fetch('./json/cards.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const cards = await response.json();
    console.log(cards);
    cardIntialization(cards);
  } catch (error) {
    console.error("Failed to load cards:", error);
  }
}

async function loadAnnouncement() {
    try {
        const response = await fetch('./json/announcement.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const announcements = await response.json();
        console.log(announcements);
        intailizeAnnouncement(announcements);
    } catch (error) {
        console.error("Failed to load cards:", error);
    }
}
async function loadNotifications() {
    try {
        const response = await fetch('./json/notifications.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const notifications = await response.json();
        console.log(notifications);
        intailizeNotification(notifications);
    } catch (error) {
        console.error("Failed to load cards:", error);
    }
}
loadCards();
loadNotifications();
loadAnnouncement();