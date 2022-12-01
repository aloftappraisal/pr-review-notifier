var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getInput } from "@actions/core";
import { context } from "@actions/github";
import { micromark } from "micromark";
import htmlToMrkdwn from "html-to-mrkdwn";
import { WebClient } from "@slack/web-api";
const slackClient = new WebClient(getInput("slack_bot_token"));
const channelId = getInput("slack_channel_id");
const prReviewsChannelId = "C04B4TN6UHJ"; // #tech-prs
const githubToSlackName = (github) => {
    const users = JSON.parse(getInput("slack_users"));
    const user = users.find((user) => user["github_username"] === github);
    return user === undefined ? `*${github}*` : `<@${user["slack_id"]}>`;
};
const deleteHtmlComments = (html) => html.replace(/<!--.*?-->/g, "");
const markdownToMrkdwn = (markdown) => htmlToMrkdwn(micromark(deleteHtmlComments(markdown))).text;
const mrkdwnQuote = (mrkdwn) => mrkdwn
    .split("\n")
    .map((s) => `>${s}`)
    .join("\n");
export const handleOpen = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("handling open");
    const { pull_request, sender } = context.payload;
    const author = githubToSlackName(sender.login);
    const reviewers = pull_request.requested_reviewers.map((reviewer) => githubToSlackName(reviewer.login));
    const prTitleLink = `<${pull_request._links.html.href}|*${pull_request.title}*>`;
    const bodySection = pull_request.body
        ? `\n${mrkdwnQuote(markdownToMrkdwn(pull_request.body))}`
        : "";
    const reviewersSection = reviewers.length > 0 ? `\n*Reviewers:* ${reviewers.join(", ")}` : "";
    const prReviewsMessage = yield slackClient.chat.postMessage({
        channel: prReviewsChannelId,
        text: `${author} opened ${prTitleLink}${reviewersSection}${bodySection}`,
        unfurl_links: false,
    });
    if (!prReviewsMessage.ok) {
        throw new Error("Failed to send slack message");
    }
    if (reviewers.length !== 0) {
        const slackMessage = yield slackClient.chat.postMessage({
            channel: channelId,
            text: `${reviewers.join(",")}, ${author} requested your review on ${prTitleLink}`,
        });
        if (!slackMessage.ok) {
            throw new Error("Failed to send slack message");
        }
    }
});
export const handlePush = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("handling push");
    const { pull_request } = context.payload;
    if (!pull_request) {
        return;
    }
    const reviewers = pull_request.requested_reviewers.map((reviewer) => githubToSlackName(reviewer.login));
    const PR = `<${pull_request._links.html.href}|*${pull_request.title}*>`;
    if (reviewers.length === 0) {
        return;
    }
    yield slackClient.chat.postMessage({
        channel: channelId,
        text: `Attention ${reviewers.join(", ")}, updates were made to ${PR}`,
    });
});
export const handleReview = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("handling review");
    const { pull_request, review } = context.payload;
    if (!pull_request) {
        return;
    }
    const author = githubToSlackName(pull_request.user.login);
    const reviewer = githubToSlackName(review.user.login);
    if (!reviewer) {
        throw Error(`Could not map ${review.user.login} to the users you provided in action.yml`);
    }
    if (!author) {
        throw Error(`Could not map ${pull_request.user.login} to the users you provided in action.yml`);
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
    yield slackClient.chat.postMessage({
        channel: channelId,
        text: `${author}, ${reviewer} ${baseText}`,
    });
});
//# sourceMappingURL=utils.js.map