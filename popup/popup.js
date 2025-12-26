document.addEventListener("DOMContentLoaded", function () {
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

  const ICSbutton = document.querySelector("button#ics");
  const CSVbutton = document.querySelector("button#csv");

  ICSbutton.addEventListener("click", async function () {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractTableAfterComment,
      });

      if (results && results[0] && results[0].result) {
        const tableHTML = results[0].result;

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

                let firstDayDate = getFirstDayOccurrence(2026, 0, Days[firstDay]);
                let secondDayDate = getFirstDayOccurrence(2026, 0, Days[secondDay]);

                console.log({ firstDayDate, secondDayDate, startTime, endTime, venue });

                events.push({
                  summary: courseCode,
                  start: `${firstDayDate.getFullYear()}${String(firstDayDate.getMonth()+1).padStart(2, '0')}${String(firstDayDate.getDate()).padStart(2, '0')}T${startTime.replace(":", "")}00`,
                  end: `${firstDayDate.getFullYear()}${String(firstDayDate.getMonth()+1).padStart(2, '0')}${String(firstDayDate.getDate()).padStart(2, '0')}T${endTime.replace(":", "")}00`,
                  location: venue.trim(),
                  description: `Section: ${section}\\nInstructor: ${instructor}`,
                  byday: `${ICSDays[firstDay]},${ICSDays[secondDay]}`,
                  endString: "20260601"
                })
              } else {
                let dayDate = getFirstDayOccurrence(2026, 0, Days[day]);

                console.log({ dayDate, startTime, endTime, venue });

                events.push({
                  summary: courseCode,
                  start: `${dayDate.getFullYear()}${String(dayDate.getMonth()+1).padStart(2, '0')}${String(dayDate.getDate()).padStart(2, '0')}T${startTime.replace(":", "")}00`,
                  end: `${dayDate.getFullYear()}${String(dayDate.getMonth()+1).padStart(2, '0')}${String(dayDate.getDate()).padStart(2, '0')}T${endTime.replace(":", "")}00`,
                  location: venue.trim(),
                  description: `Section: ${section}\\nInstructor: ${instructor}`,
                  byday: ICSDays[day],
                  endString: "20260601"
                })
              }
            }

            const icsData = convertToICS(events);
            downloadICS(icsData, "schedule.ics");
          }

          alert("Conversion successful! Check your downloads for the ICS file.");
        } else {
          alert("Sorry, but there was an issue encountering the conversion. Please ensure you are on the correct page with the schedule table.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error.message);
    }
  });

  CSVbutton.addEventListener("click", async function () {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractTableAfterComment,
      });

      if (results && results[0] && results[0].result) {
        const tableHTML = results[0].result;

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

            let data = [];

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

                let firstDayDate = getFirstDayOccurrence(2026, 0, Days[firstDay]);
                let secondDayDate = getFirstDayOccurrence(2026, 0, Days[secondDay]);

                console.log({ firstDayDate, secondDayDate, startTime, endTime, venue });

                const lastDayOfClasses = new Date(2026, 5, 1);
                while (firstDayDate < lastDayOfClasses) {
                  data.push({
                    "Subject": courseCode,
                    "Start Date": firstDayDate.toLocaleDateString("en-CA"),
                    "Start Time": startTime,
                    "End Date": firstDayDate.toLocaleDateString("en-CA"),
                    "End Time": endTime,
                    "Description": `Section: ${section}\nInstructor: ${instructor}`,
                    "Location": venue.trim(),
                    "All Day Event": "False",
                    "Private": "True"
                  })
                  firstDayDate.setDate(firstDayDate.getDate() + 7);
                }
                while (secondDayDate < lastDayOfClasses) {
                  data.push({
                    "Subject": courseCode,
                    "Start Date": secondDayDate.toLocaleDateString("en-CA"),
                    "Start Time": startTime,
                    "End Date": secondDayDate.toLocaleDateString("en-CA"),
                    "End Time": endTime,
                    "Description": `Section: ${section}\nInstructor: ${instructor}`,
                    "Location": venue.trim(),
                    "All Day Event": "False",
                    "Private": "True"
                  })
                  secondDayDate.setDate(secondDayDate.getDate() + 7);
                }
              } else {
                let dayDate = getFirstDayOccurrence(2026, 0, Days[day]);

                console.log({ dayDate, startTime, endTime, venue });

                const lastDayOfClasses = new Date(2026, 5, 1);
                while (dayDate < lastDayOfClasses) {
                  data.push({
                    "Subject": courseCode,
                    "Start Date": dayDate.toLocaleDateString("en-CA"),
                    "Start Time": startTime,
                    "End Date": dayDate.toLocaleDateString("en-CA"),
                    "End Time": endTime,
                    "Description": `Section: ${section}\nInstructor: ${instructor}`,
                    "Location": venue.trim(),
                    "All Day Event": "False",
                    "Private": "True"
                  })
                  dayDate.setDate(dayDate.getDate() + 7);
                }
              }
            }

            const csvData = convertToCSV(data);
            downloadCSV(csvData, "schedule.csv");
          }

          alert("Conversion successful! Check your downloads for the CSV file.");
        } else {
          alert("Sorry, but there was an issue encountering the conversion. Please ensure you are on the correct page with the schedule table.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error.message);
    }
  });
});

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

function convertToICS(events) {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AISIS to Calendar//EN\nCALSCALE:GREGORIAN\n";
  for (const event of events) {
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `SUMMARY:${event.summary}\n`;
    icsContent += `DTSTART;TZID=Asia/Singapore:${event.start}\n`;
    icsContent += `DTEND;TZID=Asia/Singapore:${event.end}\n`;
    icsContent += `LOCATION:${event.location}\n`;
    icsContent += `DESCRIPTION:${event.description}\n`;
    icsContent += `RRULE:FREQ=WEEKLY;BYDAY=${event.byday};UNTIL=${event.endString}T235959Z\n`;
    icsContent += "END:VEVENT\n";
  }
  icsContent += "END:VCALENDAR";
  return icsContent;
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

function extractTableAfterComment() {
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
