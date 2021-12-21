const github = require("@actions/github");
const getOctokit = require("./lib/actions/octokit");

const octokit = getOctokit();

async function getActionParameters() {
  if (
    github.context &&
    github.context.payload &&
    github.context.payload.issue &&
    github.context.payload.issue.number
  ) {
    // this is a issue comment
    console.log(`Getting PR from issue`);
    const {
      issue: { number: issueNumber },
      repository: {
        owner: { login: owner },
        name: repo,
      },
    } = github.context.payload;
    console.log(`Found issue ${issueNumber} for ${owner}/${repo}`);
    const pullRequest = (
      await octokit.pulls.get({
        owner,
        repo,
        pull_number: issueNumber,
      })
    ).data;
    console.log("Got pull request", pullRequest);
    return { pullRequest, owner, repo, issueNumber };
  } else {
    // this is a PR event
    console.log("Getting PR from context");
    const pullRequest = github.context.payload.pull_request;
    return {
      pullRequest,
    };
  }
}

const getPullAuthor = (exports.getPullAuthor = (pullRequest) => {
  const {
    user: { login },
  } = pullRequest;
  return login;
});

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
  if (
    github.context &&
    github.context.payload &&
    github.context.payload.issue &&
    github.context.payload.issue.number
  ) {
    return await actionIssue();
  } else {
    return await actionPullRequest();
  }
};

async function actionIssue() {
  console.info(`Calling action on issue`);
  const { owner, repo, issueNumber, pullRequest } = await getActionParameters();

  const workflowRuns = await octokit.paginate(
    "GET /repos/{owner}/{repo}/actions/runs",
    { owner, repo, issue_number: issueNumber }
  );
  console.log("DEBUG RUNS", workflowRuns);
}

async function actionPullRequest() {
  console.info(`Calling action on pull_request`);
  const { pullRequest } = await getActionParameters();

  const author = getPullAuthor(pullRequest);
  const pullNumber = getPullNumber(pullRequest);
  const draft = getPullDraft(pullRequest);
  const { baseRef, owner, repo } = getPullBase(pullRequest);
  const requestedReviewers = getPullRequestedReviewers(pullRequest);

  const comments = await octokit.paginate(
    "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
    { owner, repo, issue_number: pullNumber }
  );
  const hasRequestedReview = getHasRequestedReview(comments);

  if (author === "ms-bot") {
    console.log(
      `Not checking PR ${pullNumber} that has been created by ms-bot`
    );
    return;
  }

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
}
