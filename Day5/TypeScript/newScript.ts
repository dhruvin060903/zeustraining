function displaySubMenu(component1: HTMLElement, component2: HTMLElement) {
  component1.style.display = "block";
  component1.style.backgroundColor = "#F3F3F3";
  component2.style.backgroundColor = "#F3F3F3";

  const img = component2.querySelector("img");
  if (img instanceof HTMLImageElement) {
    img.src = "./images/keyboard_arrow_up.svg";
  }
}
function hideSubMenu(component1: HTMLElement, component2: HTMLElement) {
  component1.style.display = "none";
  component1.style.backgroundColor = "#FFFFFF";
  component2.style.backgroundColor = "#FFFFFF";
  const img = component2.querySelector("img");
  if (img instanceof HTMLImageElement) {
    img.src = "./images/keyboard_arrow_down.svg";
  }

}
function displayMenu() {
  // document.getElementById("navbarForSmallScreen").style.display = "block";
  const component = document.getElementById("navbarForSmallScreen");
  if (component instanceof HTMLElement)
    component.style.maxHeight = "500px";


  const collection = document.getElementById("hamburgerMenuImg");
  if (collection instanceof HTMLImageElement)
    collection.src = "./images/hamburger-menu-white.svg";
}
function hideMenu() {
  const component = document.getElementById("navbarForSmallScreen");
  if (component instanceof HTMLElement)
    component.style.maxHeight = "0px";


  const collection = document.getElementById("hamburgerMenuImg");
  if (collection instanceof HTMLImageElement)
    collection.src = "./images/hamburger-menu.svg";
}
function displayAnnouncements(): void {
  const popup = document.getElementById("announcementstPopup");
  const bell = document.getElementById("announcement-bell");
  const badge = document.getElementById("announcement-badge");

  if (popup && bell && badge) {
    popup.style.display = "block";
    bell.style.backgroundImage = "url('./images/announcements-white.svg')";
    badge.style.display = "none";
  }
}

function hideAnnouncements(): void {
  const popup = document.getElementById("announcementstPopup");
  const bell = document.getElementById("announcement-bell");
  const badge = document.getElementById("announcement-badge");

  if (popup && bell && badge) {
    popup.style.display = "none";
    bell.style.backgroundImage = "url('./images/announcements.svg')";
    badge.style.display = "flex";
  }
}

function displayAlert(): void {
  const popup = document.getElementById("notificationPopup");
  const bell = document.getElementById("alert-bell");
  const badge = document.getElementById("alert-badge");

  if (popup && bell && badge) {
    popup.style.display = "block";
    bell.style.backgroundImage = "url('./images/alerts-white.svg')";
    badge.style.display = "none";
  }
}

function hideAlert(): void {
  const popup = document.getElementById("notificationPopup");
  const bell = document.getElementById("alert-bell");
  const badge = document.getElementById("alert-badge");

  if (popup && bell && badge) {
    popup.style.display = "none";
    bell.style.backgroundImage = "url('./images/alerts.svg')";
    badge.style.display = "flex";
  }
}
function changeSelectionColor(select: HTMLSelectElement): void {
  if (select) {
    if (select.value === "No Classes") {
      console.log(select);
      select.classList.add("noClass");
    } else {
      select.classList.remove("noClass");
    }
  }
}


function intailizeAnnouncement(announcements) {
  const container = document.getElementById("announcementstPopupInner");

  let allHtml = "";

  announcements.forEach(item => {
    allHtml += `
    <div class="announcementItemCard" style="background-color: ${item.bgColor || "#fff"};">
      <div class="announcementHeader">
        <span><span class="Pa">PA:</span> ${item.name || ""}</span>
        <span>${item.done ? `<img src="./images/correct.png" alt="attach-icon" height="16px" width="15px"/>` : `<img src="./images/zoom-in.png" alt="attach-icon" height="17px" width="19px"/>`}</span>
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
  if (container)
    container.insertAdjacentHTML('beforeend', allHtml);
}
function intailizeNotification(notifications) {
  const container = document.getElementById("notificationPopupInner");

  let allHtml = "";

  notifications.forEach(item => {
    allHtml += `
    <div class="announcementItemCard" style="background-color: ${item.bgColor || "#fff"};">
     
      
      <div class="announcementTitle"> <div>${item.description || "No description available"}</div>
      ${item.done ? `<img src="./images/correct.png" alt="attach-icon" height="16px" width="15px"/>` : `<img src="./images/zoom-in.png" alt="attach-icon" height="17px" width="19px"/>`}
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
  if (container)

    container.insertAdjacentHTML('beforeend', allHtml);



}
function cardIntialization(cards) {
  let cardHTML = "";

  cards.forEach((card, index) => {
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
                <select class="course ${card.classes[0] === 'No Classes' ? 'noClass' : ''}"  id= "courseSelection${index}"  onclick="changeSelectionColor(courseSelection${index})">
                  ${card.classes.map((cls: any) => `<option value="${cls}">${cls}</option>`).join('')}
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
  const component = document.querySelector(".card-container");
  if (component)
    component.innerHTML = cardHTML;

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