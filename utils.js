const core = require("@actions/core");
const github = require("@actions/github");

const { WebClient } = require("@slack/web-api");
const slackClient = new WebClient(core.getInput("slack_bot_token"));

const channelId = core.getInput("slack_channel_id");
const githubToken = core.getInput("github_token");
const octokit = github.getOctokit(githubToken);

export const createSlackThread = async () => {
  console.log("creating slack thread");
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

  return await octokit.issues.createComment({
    owner: repository.owner.login,
    repo: repository.name,
    issue_number: number,
    body: `SLACK_MESSAGE_ID: ${prSlackMsg.ts}`,
  });
};

export const handlePush = async () => {
  console.log("handling push");
  let slackThreadID = await getSlackThreadID();
  if (!slackThreadID) {
    slackThreadID = await createSlackThread();
  }
  const reviewers = pull_request.requested_reviewers.map((reviewer) =>
    githubToSlackName(reviewer.login)
  );
  const PR = `<${pull_request._links.html.href}|*${pull_request.title}*>`;
  if (reviewers.length === 0) {
    return;
  }

  await slackWebClient.chat.postMessage({
    channel: channelId,
    thread_ts: slackThreadID,
    text: `Attention ${reviewers.join(", ")}, updates were made to ${PR}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text,
        },
      },
    ],
  });
};

export const handleReview = async () => {
  console.log("handling review");
  let slackThreadID = await getSlackThreadID();
  if (!slackThreadID) {
    slackThreadID = await createSlackThread();
  }
  const { pull_request, review } = github.context.payload;
  const author = githubToSlackName(review.user.login);
  const reviewer = githubToSlackName(pull_request.user.login);

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

  let baseText;
  switch (review.state) {
    case "changes_requested":
      baseText = `requested changes on your PR`;
      break;
    case "commented":
      baseText = "left comments on your PR";
      break;
    case "approved":
      baseText = "approved your PR. Yay!";
      break;
    default:
      throw Error("unknown review state");
  }

  await slackWebClient.chat.postMessage({
    channel: channelId,
    thread_ts: slackThreadID,
    text: `${author}, ${reviewer} ${baseText}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text,
        },
      },
    ],
  });
};

const getSlackThreadID = async () => {
  const { repository, pull_request } = github.context.payload;
  const comments = await octokit.issues.listComments({
    owner: repository.owner.login,
    repo: repository.name,
    issue_number: pull_request.number,
  });

  const myComment = comments.find((comment) => {
    comment.body.includes("SLACK_MESSAGE_ID");
  });
  if (!myComment) {
    return false;
  }

  return myComment.split(": ")[1];
};

const githubToSlackName = (github) => {
  const users = JSON.parse(core.getInput("slack_users"));
  return `<@${
    users.find((user) => user["github_username"] === github)["slack_id"]
  }>`;
};
