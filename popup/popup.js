document.addEventListener("DOMContentLoaded", function () {
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
            for (const row of rows) {
              const schedule = row.cells[4].innerText.trim();

              if (schedule.includes("TBA")) continue;

              let dateAndVenue = schedule.split("(")[0];
              let dayAndTime = dateAndVenue.split("/");
              let timeSplit = dayAndTime[0].split(" ")[1].split("-");
              let day = dayAndTime[0].split(" ")[0];
              let startTime = timeSplit[0];
              let endTime = timeSplit[1];
              let venue = dayAndTime[1];
              console.log({ day, startTime, endTime, venue });
            }
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
