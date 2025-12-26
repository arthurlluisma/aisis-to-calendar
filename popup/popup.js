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

  const button = document.querySelector("button");

  button.addEventListener("click", async function () {
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

          alert("Table found! Check console for details.");
        } else {
          alert("Could not find the comment or table.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error.message);
    }
  });
});

function downloadCSV(csvData, filename) {
  const blob = new Blob([csvData], { type: "text/csv" });
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
