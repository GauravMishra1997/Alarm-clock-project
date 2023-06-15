// Initial References
let timerRef = document.querySelector(".timer-display");
const hourInput = document.getElementById("hourInput");
const minuteInput = document.getElementById("minuteInput");
const amPmSelect = document.getElementById("amPmSelect");
const activeAlarms = document.querySelector(".activeAlarms");
const setAlarm = document.getElementById("set");
let alarmsArray = [];
let alarmSound = new Audio("alarm.mp3");

let alarmIndex = 0;

// Append zeroes for single digit
const appendZero = (value) => (value < 10 ? "0" + value : value);

// Search for value in object
const searchObject = (parameter, value) => {
  let alarmObject,
    objIndex,
    exists = false;
  alarmsArray.forEach((alarm, index) => {
    if (alarm[parameter] == value) {
      exists = true;
      alarmObject = alarm;
      objIndex = index;
      return false;
    }
  });
  return [exists, alarmObject, objIndex];
};

// Display Time
function displayTimer() {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  let amPm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert to 12-hour format
  hours = appendZero(hours);
  minutes = appendZero(minutes);
  seconds = appendZero(seconds);

  // Display time
  timerRef.innerHTML = `${hours}:${minutes}:${seconds} ${amPm}`;

  // Alarm
  alarmsArray.forEach((alarm, index) => {
    if (alarm.isActive) {
      if (
        alarm.amPm === amPm &&
        alarm.alarmHour === hours &&
        alarm.alarmMinute === minutes &&
        seconds === "00" // Check if it's the start of a new minute
      ) {
        alarmSound.play();
        alarmSound.loop = true;
      }
    }
  });
}

const inputCheck = (inputValue) => {
  inputValue = parseInt(inputValue);
  if (inputValue < 10) {
    inputValue = appendZero(inputValue);
  }
  return inputValue;
};

hourInput.addEventListener("input", () => {
  hourInput.value = inputCheck(hourInput.value);
});

minuteInput.addEventListener("input", () => {
  minuteInput.value = inputCheck(minuteInput.value);
});

// Create alarm div
const createAlarm = (alarmObj) => {
  // Keys from object
  const { id, alarmHour, alarmMinute, amPm } = alarmObj;
  // Alarm div
  let alarmDiv = document.createElement("div");
  alarmDiv.classList.add("alarm");
  alarmDiv.setAttribute("data-id", id);
  alarmDiv.innerHTML = `<span>${alarmHour}:${alarmMinute} ${amPm}</span>`;

  // Checkbox
  let checkbox = document.createElement("input");
  checkbox.setAttribute("type", "checkbox");
  checkbox.addEventListener("click", (e) => {
    if (e.target.checked) {
      startAlarm(e);
    } else {
      stopAlarm(e);
    }
  });
  alarmDiv.appendChild(checkbox);
  // Delete button
  let deleteButton = document.createElement("button");
  deleteButton.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
  deleteButton.classList.add("deleteButton");
  deleteButton.addEventListener("click", (e) => deleteAlarm(e));
  alarmDiv.appendChild(deleteButton);

  activeAlarms.appendChild(alarmDiv);
};

// Set Alarm
setAlarm.addEventListener("click", () => {
  alarmIndex += 1;

  // Alarm object
  let alarmObj = {};
  alarmObj.id = `${alarmIndex}_${hourInput.value}_${minuteInput.value}`;
  alarmObj.alarmHour = hourInput.value;
  alarmObj.alarmMinute = minuteInput.value;
  alarmObj.amPm = amPmSelect.value;
  alarmObj.isActive = false; // Set isActive to false initially

  const [exists, existingAlarm] = searchObject("id", alarmObj.id);
  if (exists) {
    activeAlarms.removeChild(
      document.querySelector(`[data-id="${existingAlarm.id}"]`)
    );
    alarmsArray.splice(existingAlarm.objIndex, 1);
  }

  // Push alarm object into array
  alarmsArray.push(alarmObj);
  // Create alarm div
  createAlarm(alarmObj);

  // Reset input values
  hourInput.value = "";
  minuteInput.value = "";
});

// Start Alarm
function startAlarm(e) {
  let alarmId = e.target.parentNode.getAttribute("data-id");
  const [, alarmObj, objIndex] = searchObject("id", alarmId);

  // Clear any existing timeouts for the alarm
  clearTimeout(alarmObj.timeout);

  // Get the current time and the alarm time
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  let alarmHour = parseInt(alarmObj.alarmHour);
  let alarmMinute = parseInt(alarmObj.alarmMinute);
  let amPm = alarmObj.amPm;

  // Convert alarm time to 24-hour format if necessary
  if (amPm === "PM" && alarmHour !== 12) {
    alarmHour += 12;
  } else if (amPm === "AM" && alarmHour === 12) {
    alarmHour = 0;
  }

  // Calculate the time remaining until the next occurrence of the alarm
  let timeDiff = 0;
  if (
    currentHour > alarmHour ||
    (currentHour === alarmHour && currentMinute >= alarmMinute)
  ) {
    // If the alarm time has already passed for the current day, schedule it for the next day
    const tomorrow = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(alarmHour);
    tomorrow.setMinutes(alarmMinute);
    tomorrow.setSeconds(0);
    tomorrow.setMilliseconds(0);
    timeDiff = tomorrow.getTime() - currentTime.getTime();
  } else {
    // If the alarm time is in the future for the current day
    const alarmTime = new Date();
    alarmTime.setHours(alarmHour);
    alarmTime.setMinutes(alarmMinute);
    alarmTime.setSeconds(0);
    alarmTime.setMilliseconds(0);
    timeDiff = alarmTime.getTime() - currentTime.getTime();
  }

  // Set a timeout for the alarm to start at the specified time
  alarmObj.timeout = setTimeout(() => {
    alarmSound.currentTime = 0;
    alarmSound.play();
    alarmSound.loop = true;
  }, timeDiff);

  alarmsArray[objIndex].isActive = true;
}

// Stop Alarm
function stopAlarm(e) {
  let alarmId = e.target.parentNode.getAttribute("data-id");
  const [, alarmObj, objIndex] = searchObject("id", alarmId);

  // Clear the timeout for the alarm
  clearTimeout(alarmObj.timeout);

  alarmsArray[objIndex].isActive = false;
  alarmSound.pause();
  alarmSound.loop = false;
}

// Delete Alarm
function deleteAlarm(e) {
  let alarmId = e.target.parentNode.getAttribute("data-id");
  const [, , objIndex] = searchObject("id", alarmId);
  alarmsArray.splice(objIndex, 1);
  activeAlarms.removeChild(e.target.parentNode);
}

// Update time every second
setInterval(displayTimer, 1000);

// Initial time display
displayTimer();
