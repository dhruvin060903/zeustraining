var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
function displaySubMenu(component1, component2) {
    component1.style.display = "block";
    component1.style.backgroundColor = "#F3F3F3";
    component2.style.backgroundColor = "#F3F3F3";
    var img = component2.querySelector("img");
    if (img instanceof HTMLImageElement) {
        img.src = "./images/keyboard_arrow_up.svg";
    }
}
function hideSubMenu(component1, component2) {
    component1.style.display = "none";
    component1.style.backgroundColor = "#FFFFFF";
    component2.style.backgroundColor = "#FFFFFF";
    var img = component2.querySelector("img");
    if (img instanceof HTMLImageElement) {
        img.src = "./images/keyboard_arrow_down.svg";
    }
}
function displayMenu() {
    // document.getElementById("navbarForSmallScreen").style.display = "block";
    var component = document.getElementById("navbarForSmallScreen");
    if (component instanceof HTMLElement)
        component.style.maxHeight = "500px";
    var collection = document.getElementById("hamburgerMenuImg");
    if (collection instanceof HTMLImageElement)
        collection.src = "./images/hamburger-menu-white.svg";
}
function hideMenu() {
    var component = document.getElementById("navbarForSmallScreen");
    if (component instanceof HTMLElement)
        component.style.maxHeight = "0px";
    var collection = document.getElementById("hamburgerMenuImg");
    if (collection instanceof HTMLImageElement)
        collection.src = "./images/hamburger-menu.svg";
}
function displayAnnouncements() {
    var popup = document.getElementById("announcementstPopup");
    var bell = document.getElementById("announcement-bell");
    var badge = document.getElementById("announcement-badge");
    if (popup && bell && badge) {
        popup.style.display = "block";
        bell.style.backgroundImage = "url('./images/announcements-white.svg')";
        badge.style.display = "none";
    }
}
function hideAnnouncements() {
    var popup = document.getElementById("announcementstPopup");
    var bell = document.getElementById("announcement-bell");
    var badge = document.getElementById("announcement-badge");
    if (popup && bell && badge) {
        popup.style.display = "none";
        bell.style.backgroundImage = "url('./images/announcements.svg')";
        badge.style.display = "flex";
    }
}
function displayAlert() {
    var popup = document.getElementById("notificationPopup");
    var bell = document.getElementById("alert-bell");
    var badge = document.getElementById("alert-badge");
    if (popup && bell && badge) {
        popup.style.display = "block";
        bell.style.backgroundImage = "url('./images/alerts-white.svg')";
        badge.style.display = "none";
    }
}
function hideAlert() {
    var popup = document.getElementById("notificationPopup");
    var bell = document.getElementById("alert-bell");
    var badge = document.getElementById("alert-badge");
    if (popup && bell && badge) {
        popup.style.display = "none";
        bell.style.backgroundImage = "url('./images/alerts.svg')";
        badge.style.display = "flex";
    }
}
function intailizeAnnouncement(announcements) {
    var container = document.getElementById("announcementstPopupInner");
    var allHtml = "";
    announcements.forEach(function (item) {
        allHtml += "\n    <div class=\"announcementItemCard\" style=\"background-color: ".concat(item.bgColor || "#fff", ";\">\n      <div class=\"announcementHeader\">\n        <span><span class=\"Pa\">PA:</span> ").concat(item.name || "", "</span>\n        <span>").concat(item.done ? "<img src=\"./images/correct.png\" alt=\"attach-icon\" height=\"16px\" width=\"15px\"/>" : "<img src=\"./images/zoom-in.png\" alt=\"attach-icon\" height=\"17px\" width=\"19px\"/>", "</span>\n      </div>\n      \n      <div class=\"announcementTitle\">").concat(item.description || "No description available", "</div>\n      \n      ").concat(item.course ? "<div class=\"announcementCourse\">Course: ".concat(item.course, "</div>") : "", "\n      \n      <div class=\"announcementfiles\">\n      <div style=\"display:flex;\">\n      <span>\n     \n          ").concat(typeof item.files === "number" && item.files > 0
            ? " <img src=\"./images/attach_file.svg\" alt=\"attach-icon\" height=\"13px\" width=\"16px\"/>".concat(item.files, " file").concat(item.files !== 1 ? "s" : "", " are attached")
            : "", "\n        </span></div>\n        <div><span>").concat(item.date || "Date not available", "</span></div>\n      </div>\n    </div>\n   \n  ");
    });
    if (container)
        container.insertAdjacentHTML('beforeend', allHtml);
}
function intailizeNotification(notifications) {
    var container = document.getElementById("notificationPopupInner");
    var allHtml = "";
    notifications.forEach(function (item) {
        allHtml += "\n    <div class=\"announcementItemCard\" style=\"background-color: ".concat(item.bgColor || "#fff", ";\">\n     \n      \n      <div class=\"announcementTitle\"> <div>").concat(item.description || "No description available", "</div>\n      ").concat(item.done ? "<img src=\"./images/correct.png\" alt=\"attach-icon\" height=\"16px\" width=\"15px\"/>" : "<img src=\"./images/zoom-in.png\" alt=\"attach-icon\" height=\"17px\" width=\"19px\"/>", "\n      </div>\n      \n      ").concat(item.course ? "<div class=\"announcementCourse\">Course: ".concat(item.course, "</div>") : "", "\n      \n      <div class=\"announcementfiles\">\n        <div><span>\n          ").concat(typeof item.files === "number" && item.files > 0
            ? "".concat(item.files, " file").concat(item.files !== 1 ? "s" : "", " are attached")
            : "", "\n        </span></div>\n        <div><span>").concat(item.date || "Date not available", "</span></div>\n      </div>\n    </div>\n   \n  ");
    });
    if (container)
        container.insertAdjacentHTML('beforeend', allHtml);
}
function cardIntialization(cards) {
    var cardHTML = "";
    cards.forEach(function (card) {
        cardHTML += "\n        <div class=\"card\">\n          ".concat(card.expired ? "<div class=\"expire\">EXPIRED</div>" : "", "\n          <div class=\"cardcontent\">\n            <img class=\"cardImg\" src=\"").concat(card.image, "\" alt=\"cardimg\" />\n            <div class=\"cardTextContent\">\n              <div class=\"cardTitle\">\n                <span class=\"title\">").concat(card.title, "</span>\n                <img src=\"").concat(card.favourite, "\" alt=\"favourite\" class=\"favouriteImg ").concat(card.favourite.includes('-2') ? 'emptyStar' : '', "\" />\n              </div>\n    \n              <div class=\"grade\">\n                <span>").concat(card.grade, " +<span class=\"green\">").concat(card.greenCount, "</span></span>\n              </div>\n              \n              <div class=\"ULT\">\n                <span><b>").concat(card.units, "</b> Units <b>").concat(card.lessons, "</b> Lessons <b>").concat(card.topics, "</b> Topics</span>\n              </div>\n              \n              <div class=\"selectClass\">\n                <select class=\"course ").concat(card.classes.includes('No Classes') ? 'noClass' : '', "\">\n                  ").concat(card.classes.map(function (cls) { return "<option value=\"".concat(cls, "\">").concat(cls, "</option>"); }).join(''), "\n                </select>\n              </div>\n              \n              <div class=\"cardDates\">\n                <span>").concat(card.studentsInfo, "</span>\n              </div>\n            </div>\n          </div>\n          <div class=\"cardIcons\">\n            <div class=\"cardIconsMargin\">\n              <img src=\"./images/preview.svg\" alt=\"previewimg\" class=\"previewimg\" />\n              <img src=\"./images/manage course.svg\" alt=\"manage course\" class=\"gardeImg ").concat(card.icons.manage ? "" : "disabledIcons", "\" />\n              <img src=\"./images/grade submissions.svg\" alt=\"gradeimg\" class=\"").concat(card.icons.grade ? "" : "disabledIcons", "\" />\n              <img src=\"./images/reports.svg\" alt=\"report\" class=\"report\" />\n            </div>\n          </div>\n        </div>\n      ");
    });
    // Append to DOM
    var component = document.querySelector(".card-container");
    if (component)
        component.innerHTML = cardHTML;
}
function loadCards() {
    return __awaiter(this, void 0, void 0, function () {
        var response, cards, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('./json/cards.json')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    cards = _a.sent();
                    console.log(cards);
                    cardIntialization(cards);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to load cards:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function loadAnnouncement() {
    return __awaiter(this, void 0, void 0, function () {
        var response, announcements, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('./json/announcement.json')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    announcements = _a.sent();
                    console.log(announcements);
                    intailizeAnnouncement(announcements);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("Failed to load cards:", error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function loadNotifications() {
    return __awaiter(this, void 0, void 0, function () {
        var response, notifications, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('./json/notifications.json')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    notifications = _a.sent();
                    console.log(notifications);
                    intailizeNotification(notifications);
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.error("Failed to load cards:", error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
loadCards();
loadNotifications();
loadAnnouncement();
