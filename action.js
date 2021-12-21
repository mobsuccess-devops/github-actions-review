const github = require("@actions/github");
const getOctokit = require("./lib/actions/octokit");

const octokit = getOctokit();

exports.getActionParameters = function getActionParameters() {
  const pullRequest = github.context.payload.pull_request;
  return {
    pullRequest,
  };
};

const getPullDraft = (exports.getPullDraft = (pullRequest) => {
  const { draft } = pullRequest;
  return draft;
});

const getPullNumber = (exports.getPullNumber = (pullRequest) => {
  const { number: pullNumber } = pullRequest;
  return pullNumber;
});

const getPullBase = (exports.getPullBase = (pullRequest) => {
  const {
    base: {
      ref: baseRef,
      repo: {
        owner: { login: owner },
        name: repo,
      },
    },
  } = pullRequest;
  return { baseRef, owner, repo };
});

const getPullRequestedReviewers = (exports.getPullRequestedReviewers = (
  pullRequest
) => {
  const { requested_reviewers: requestedReviewers } = pullRequest;
  return requestedReviewers;
});

const getHasRequestedReview = (exports.getHasRequestedReview = (comments) =>
  comments.some(
    ({ body, user: { login } }) =>
      login === "ms-bot" &&
      body.match(/A review for this PR has been requested in Slack/)
  ));

exports.action = async function action() {
  console.info(`Calling action ${action}`);
  const { pullRequest } = exports.getActionParameters();
  console.log("DEBUG PR", pullRequest);

  const pullNumber = getPullNumber(pullRequest);
  const draft = getPullDraft(pullRequest);
  const { baseRef, owner, repo } = getPullBase(pullRequest);
  const requestedReviewers = getPullRequestedReviewers(pullRequest);

  console.log("DEBUG PR INFO", {
    pullNumber,
    draft,
    baseRef,
    requestedReviewers,
  });

  const comments = await octokit.paginate(
    "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
    { owner, repo, issue_number: pullNumber }
  );
  console.log("DEBUG COMMENTS", comments);
  const hasRequestedReview = getHasRequestedReview(comments);
  console.log("DEBUG HAS REQUESTED REVIEW", hasRequestedReview);

  if (["main", "master", "preprod", "prod"].indexOf(baseRef) === -1) {
    console.log(
      `Not checking PR ${pullNumber} based on “${baseRef}”, which is an unprotected branch`
    );
    return;
  }

  if (draft) {
    console.log(`Not checking PR ${pullNumber} that is in draft mode`);
    return;
  }

  if (requestedReviewers.length > 0) {
    console.log(
      `PR ${pullNumber} has ${requestedReviewers.length} requested reviewer${
        requestedReviewers.length !== 1 ? "s" : ""
      }, everything is OK`
    );
    return;
  }

  if (hasRequestedReview) {
    console.log(
      `PR ${pullNumber} has been requested review on #mobsuccess-review-requested, everything is OK`
    );
    return;
  }

  throw new Error(
    `PR ${pullNumber} should have its review requested in #mobsuccess-review-requested`
  );
};
