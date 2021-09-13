const github = require("@actions/github");
const core = require("@actions/core");
const { handleOpen, handlePush, handleReview } = require("./utils");

(async () => {
  try {
    const { eventName, payload } = github.context;
    switch (eventName) {
      case "pull_request": {
        if (payload.action === "opened") {
          await handleOpen();
        }
        break;
      }
      case "push": {
        await handlePush();
        break;
      }
      case "pull_request_review": {
        await handleReview();
        break;
      }
      default: {
        console.log(`Event: ${eventName} not implemented, continuing.`);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
