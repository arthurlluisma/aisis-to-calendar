document.addEventListener("DOMContentLoaded", function () {
  const ICSbutton = document.querySelector("button#ics");
  const CSVbutton = document.querySelector("button#csv");

  ICSbutton.addEventListener("click", convertCalendar.bind(null, "ICS"));

  CSVbutton.addEventListener("click", convertCalendar.bind(null, "CSV"));
});

const TermStartMonth = Object.freeze({
  "2nd Semester": 0,
  "1st Semester": 7,
  "Intersession": 5
})

const TermEndMonth = Object.freeze({
  "2nd Semester": 4,
  "1st Semester": 11,
  "Intersession": 6
})

const TermEndMonthDay = Object.freeze({
  "2nd Semester": "0531",
  "1st Semester": "1231",
  "Intersession": "0731"
})

const Days = Object.freeze({
  "S": 0,
  "M": 1,
  "T": 2,
  "W": 3,
  "TH": 4,
  "F": 5,
  "SAT": 6
}) 

const ICSDays = Object.freeze({
  "S": "SU",
  "M": "MO",
  "T": "TU",
  "W": "WE",
  "TH": "TH",
  "F": "FR",
  "SAT": "SA"
})

async function convertCalendar(whichButton) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const termAndYearResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractTermAndYearAfterComment,
    });

    const classResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractClassesTableAfterComment,
    });

    if (classResults && classResults[0] && classResults[0].result) {
      const tableHTML = classResults[0].result;

      let termAndYear = termAndYearResults[0].result;
      let term = termAndYear.split(", SY ")[0].trim();
      let year = termAndYear.split(", SY ")[1].trim().split("-")[1];
      year = parseInt(year, 10);
      if (term !== "2nd Semester") {
        year -= 1;
      }
      let yearString = year.toString();
      console.log({ term, year, yearString });

      if (tableHTML) {
        console.log("Found table:", tableHTML);

        const parser = new DOMParser();
        const doc = parser.parseFromString(tableHTML, "text/html");
        const tableElement = doc.querySelector("table");

        console.log("Table element:", tableElement);

        const tbody = tableElement.querySelector("tbody");
        if (tbody) {
          const rows = Array.from(tbody.rows);
          rows.shift();
          rows.pop();

          let events = [];

          for (const row of rows) {
            const courseCode = row.cells[0].innerText.trim();
            const section = row.cells[1].innerText.trim();
            const instructor = row.cells[3].innerText.trim();
            const schedule = row.cells[4].innerText.trim();

            if (schedule.includes("TBA")) continue;

            let dateAndVenue = schedule.split("(")[0];
            let dayAndTime = dateAndVenue.split("/");
            let timeSplit = dayAndTime[0].split(" ")[1].split("-");
            let day = dayAndTime[0].split(" ")[0];
            let startTime = timeSplit[0];
            let endTime = timeSplit[1];
            let venue = dayAndTime[1];

            if (day.includes("-")) {
              let dayValues = day.split("-");
              let firstDay = dayValues[0];
              let secondDay = dayValues[1];

              let firstDayDate = getFirstDayOccurrence(year, TermStartMonth[term], Days[firstDay]);
              let secondDayDate = getFirstDayOccurrence(year, TermStartMonth[term], Days[secondDay]);

              console.log({ firstDayDate, secondDayDate, startTime, endTime, venue });

              const lastDayOfClasses = new Date(year, TermEndMonth[term], 31);
              if (whichButton === "CSV") {
                while (firstDayDate < lastDayOfClasses) {
                  events.push({
                    "Subject": courseCode,
                    "Start Date": firstDayDate.toLocaleDateString("en-CA"),
                    "Start Time": startTime,
                    "End Date": firstDayDate.toLocaleDateString("en-CA"),
                    "End Time": endTime,
                    "Description": `Section: ${section}\nInstructor: ${instructor}`,
                    "Location": venue.trim(),
                    "All Day Event": "False",
                    "Private": "False"
                  })
                  firstDayDate.setDate(firstDayDate.getDate() + 7);
                }
                while (secondDayDate < lastDayOfClasses) {
                  events.push({
                    "Subject": courseCode,
                    "Start Date": secondDayDate.toLocaleDateString("en-CA"),
                    "Start Time": startTime,
                    "End Date": secondDayDate.toLocaleDateString("en-CA"),
                    "End Time": endTime,
                    "Description": `Section: ${section}\nInstructor: ${instructor}`,
                    "Location": venue.trim(),
                    "All Day Event": "False",
                    "Private": "False"
                  })
                  secondDayDate.setDate(secondDayDate.getDate() + 7);
                }
              } else {
                let startDate = firstDayDate.getTime() < secondDayDate.getTime() ? firstDayDate : secondDayDate;

                events.push({
                  summary: courseCode,
                  start: `${startDate.getFullYear()}${String(startDate.getMonth()+1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}T${startTime.replace(":", "")}00`,
                  end: `${startDate.getFullYear()}${String(startDate.getMonth()+1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}T${endTime.replace(":", "")}00`,
                  location: venue.trim(),
                  description: `Section: ${section}\\nInstructor: ${instructor}`,
                  byday: `${ICSDays[firstDay]},${ICSDays[secondDay]}`,
                  endString: `${yearString}${TermEndMonthDay[term]}`
                })
              }
              
            } else {
              let dayDate = getFirstDayOccurrence(year, TermStartMonth[term], Days[day]);

              console.log({ dayDate, startTime, endTime, venue });

              const lastDayOfClasses = new Date(year, TermEndMonth[term], 31);
              if (whichButton === "CSV") {
                while (dayDate < lastDayOfClasses) {
                  events.push({
                    "Subject": courseCode,
                    "Start Date": dayDate.toLocaleDateString("en-CA"),
                    "Start Time": startTime,
                    "End Date": dayDate.toLocaleDateString("en-CA"),
                    "End Time": endTime,
                    "Description": `Section: ${section}\nInstructor: ${instructor}`,
                    "Location": venue.trim(),
                    "All Day Event": "False",
                    "Private": "False"
                  })
                  dayDate.setDate(dayDate.getDate() + 7);
                }
              } else {
                events.push({
                  summary: courseCode,
                  start: `${dayDate.getFullYear()}${String(dayDate.getMonth()+1).padStart(2, '0')}${String(dayDate.getDate()).padStart(2, '0')}T${startTime.replace(":", "")}00`,
                  end: `${dayDate.getFullYear()}${String(dayDate.getMonth()+1).padStart(2, '0')}${String(dayDate.getDate()).padStart(2, '0')}T${endTime.replace(":", "")}00`,
                  location: venue.trim(),
                  description: `Section: ${section}\\nInstructor: ${instructor}`,
                  byday: ICSDays[day],
                  endString: `${yearString}${TermEndMonthDay[term]}`
                })
              }
            }
          }

          if (whichButton === "CSV") {
            const csvData = convertToCSV(events);
            downloadCSV(csvData, "schedule.csv");
          } else {
            const icsData = await convertToICS(events);
            downloadICS(icsData, "schedule.ics");
          }
        }

        alert(`Conversion successful! Check your downloads for the ${whichButton} file.`);
      } else {
        alert("Sorry, but the table containing the class schedules couldn't be found. Please ensure you are on the correct page with the class schedule table.");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Sorry, but there was an issue during the conversion process. Please try again.");
  }
}

function downloadICS(icsData, filename) {
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.visibility = "hidden";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function convertToICS(events) {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AISIS to Calendar//EN\nCALSCALE:GREGORIAN\n";
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const sequences = await getSequences();
  const updatedSequences = { ...sequences };
  
  for (const event of events) {
    icsContent += "BEGIN:VEVENT\n";
    
    const uid = generateUID(event);
    icsContent += `UID:${uid}\n`;
    icsContent += `DTSTAMP:${timestamp}\n`;
    
    const currentSequence = sequences[uid] || 0;
    const newSequence = currentSequence + 1;
    updatedSequences[uid] = newSequence;
    icsContent += `SEQUENCE:${newSequence}\n`;

    icsContent += `SUMMARY:${event.summary}\n`;
    icsContent += `DTSTART;TZID=Asia/Singapore:${event.start}\n`;
    icsContent += `DTEND;TZID=Asia/Singapore:${event.end}\n`;
    icsContent += `LOCATION:${event.location}\n`;
    icsContent += `DESCRIPTION:${event.description}\n`;
    icsContent += `RRULE:FREQ=WEEKLY;BYDAY=${event.byday};UNTIL=${event.endString}T235959Z\n`;
    icsContent += "END:VEVENT\n";
  }
  icsContent += "END:VCALENDAR";
  
  await saveSequences(updatedSequences);
  
  return icsContent;
}

async function getSequences() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['eventSequences'], (result) => {
      resolve(result.eventSequences || {});
    });
  });
}

async function saveSequences(sequences) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ eventSequences: sequences }, resolve);
  });
}

function generateUID(event) {
  const summary = event.summary.replace(/[^a-zA-Z0-9]/g, '');
  const startTime = event.start.substring(9, 15);
  const days = event.byday.replace(/,/g, '');
  const location = event.location.replace(/[^a-zA-Z0-9]/g, '');
  
  return `${summary}-${startTime}-${days}-${location}@aisis-to-calendar`;
}

function downloadCSV(csvData, filename) {
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.visibility = "hidden";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convertToCSV(data) {
  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ("" + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

function getFirstDayOccurrence(year, month, dayOfWeek) {
  const date = new Date(year, month, 1);
  const firstDayOfMonth = date.getDay();
  const dayDifference = (dayOfWeek - firstDayOfMonth + 7) % 7;
  date.setDate(1 + dayDifference);
  return date;
}

function extractClassesTableAfterComment() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_COMMENT,
    null,
    false
  );

  let commentNode = null;
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.trim() === "results and tables") {
      commentNode = walker.currentNode;
      break;
    }
  }

  if (!commentNode) {
    return null;
  }

  let currentNode = commentNode.nextSibling;

  while (currentNode) {
    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      if (currentNode.tagName === "TABLE") {
        return currentNode.outerHTML;
      }
      const table = currentNode.querySelector("table");
      if (table) {
        return table.outerHTML;
      }
    }
    currentNode = currentNode.nextSibling;
  }

  return null;
}

function extractTermAndYearAfterComment() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_COMMENT,
    null,
    false
  );

  let commentNode = null;
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.trim() === "term, school year") {
      commentNode = walker.currentNode;
      break;
    }
  }

  if (!commentNode) {
    return null;
  }

  let currentNode = commentNode.nextSibling;

  while (currentNode) {
    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      if (currentNode.tagName === "SPAN") {
        return currentNode.innerHTML;
      }
      const span = currentNode.querySelector("span");
      if (span) {
        return span.innerHTML;
      }
    }
    currentNode = currentNode.nextSibling;
  }

  return null;
}
