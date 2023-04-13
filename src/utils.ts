import { context } from "@actions/github";
import { micromark } from "micromark";
import htmlToMrkdwn from "html-to-mrkdwn";
import { WebClient } from "@slack/web-api";
import { Handler } from "./types.js";

const prReviewsChannelId = "C04B4TN6UHJ"; // #tech-prs

const githubToSlackName = (users, github: string) => {
  const user = users.find((user) => user["github_username"] === github);
  return user === undefined ? `*${github}*` : `<@${user["slack_id"]}>`;
};

const deleteHtmlComments = (html) => html.replace(/<!--.*?-->/g, "");
const markdownToMrkdwn = (markdown) =>
  htmlToMrkdwn(micromark(deleteHtmlComments(markdown))).text;
const mrkdwnQuote = (mrkdwn) =>
  mrkdwn
    .split("\n")
    .map((s) => `>${s}`)
    .join("\n");

const escapeMrkdwn = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll(">", "&gt;").replaceAll("<", "&lt;");

export const handleOpen: Handler = async (client, users, channelId) => {
  console.log("handling open");
  const { pull_request, sender } = context.payload;

  const author = githubToSlackName(users, sender.login);
  const reviewers = pull_request.requested_reviewers.map((reviewer) =>
    githubToSlackName(users, reviewer.login)
  );
  const prTitleMrkdwn = escapeMrkdwn(pull_request.title);
  const prTitleLink = `*<${pull_request._links.html.href}|${prTitleMrkdwn}>*`;

  const bodySection = pull_request.body
    ? `\n${mrkdwnQuote(markdownToMrkdwn(pull_request.body))}`
    : "";
  const reviewersSection =
    reviewers.length > 0 ? `\n*Reviewers:* ${reviewers.join(", ")}` : "";

  const prReviewsMessage = await client.chat.postMessage({
    channel: prReviewsChannelId,
    text: `${author} opened ${prTitleLink}${reviewersSection}${bodySection}`,
    unfurl_links: false,
  });
  if (!prReviewsMessage.ok) {
    throw new Error();
  }
};

export const handlePush: Handler = async (client, users, channelId) => {
  console.log("handling push");
  const { pull_request } = context.payload;
  if (!pull_request) {
    throw new Error();
  }
  const reviewers = pull_request.requested_reviewers.map((reviewer) =>
    githubToSlackName(users, reviewer.login)
  );
  const PR = `<${pull_request._links.html.href}|*${pull_request.title}*>`;
  if (reviewers.length === 0) {
    return;
  }

  const message = await client.chat.postMessage({
    channel: channelId,
    text: `Attention ${reviewers.join(", ")}, updates were made to ${PR}`,
  });
  if (!message.ok) {
    throw new Error();
  }
};

export const handleReview: Handler = async (client, users, channelId) => {
  console.log("handling review");
  const { pull_request, review } = context.payload;
  if (!pull_request) {
    throw new Error();
  }
  const author = githubToSlackName(users, pull_request.user.login);
  const reviewer = githubToSlackName(users, review.user.login);
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

  const message = await client.chat.postMessage({
    channel: channelId,
    text: `${author}, ${reviewer} ${baseText}`,
  });
  if (!message.ok) {
    throw new Error();
  }
};
