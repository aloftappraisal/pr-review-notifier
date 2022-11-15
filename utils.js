const core = require("@actions/core");
const github = require("@actions/github");

const { WebClient } = require("@slack/web-api");
const slackClient = new WebClient(core.getInput("slack_bot_token"));

const channelId = core.getInput("slack_channel_id");
const prReviewsChannelId = 'C04B4TN6UHJ'; // #tech-prs

const githubToSlackName = (github) => {
  const users = JSON.parse(core.getInput("slack_users"));
  return `<@${
    users.find((user) => user["github_username"] === github)["slack_id"]
  }>`;
};

module.exports = {
  handleOpen: async () => {
    console.log("handling open");
    const { pull_request, sender } = github.context.payload;
    const reviewers = pull_request.requested_reviewers.map((reviewer) =>
      githubToSlackName(reviewer.login)
    );
    if (reviewers.length === 0) {
      return;
    }
    const author = githubToSlackName(sender.login);
    const PR = `<${pull_request._links.html.href}|*${pull_request.title}*>`;
    const slackMessage = await slackClient.chat.postMessage({
      channel: channelId,
      text: `${reviewers.join(",")}, ${author} requested your review on ${PR}`,
    });
    if (!slackMessage.ok) {
      throw new Error("Failed to send slack message");
    }
    const prReviewsMessage = await slackClient.chat.postMessage({
      channel: prReviewsChannelId,
      text: `<${pull_request._links.html.href}|*${pull_request.title}*>`,
      // author and reviewers will be included in link preview
      unfurl_links: true,
    });
    if (!prReviewsMessage) {
      throw new Error('Failed to send slack message');
    }
  },

  handlePush: async () => {
    console.log("handling push");
    const { pull_request } = github.context.payload;
    if (!pull_request) {
      return;
    }
    const reviewers = pull_request.requested_reviewers.map((reviewer) =>
      githubToSlackName(reviewer.login)
    );
    const PR = `<${pull_request._links.html.href}|*${pull_request.title}*>`;
    if (reviewers.length === 0) {
      return;
    }

    await slackClient.chat.postMessage({
      channel: channelId,
      text: `Attention ${reviewers.join(", ")}, updates were made to ${PR}`,
    });
  },

  handleReview: async () => {
    console.log("handling review");
    const { pull_request, review } = github.context.payload;
    if (!pull_request) {
      return;
    }
    const author = githubToSlackName(pull_request.user.login);
    const reviewer = githubToSlackName(review.user.login);

    if (!reviewer) {
      throw Error(
        `Could not map ${review.user.login} to the users you provided in action.yml`
      );
    }
    if (!author) {
      throw Error(
        `Could not map ${pull_request.user.login} to the users you provided in action.yml`
      );
    }
    if (author.normalize() === reviewer.normalize()) {
      return;
    }

    let baseText;
    switch (review.state) {
      case "changes_requested":
        baseText = `requested changes on your PR.`;
        break;
      case "commented":
        baseText = "commented on your PR.";
        break;
      case "approved":
        baseText = "approved your PR. Yay!";
        break;
      default:
        throw Error("unknown review state");
    }

    await slackClient.chat.postMessage({
      channel: channelId,
      text: `${author}, ${reviewer} ${baseText}`,
    });
  },
};
