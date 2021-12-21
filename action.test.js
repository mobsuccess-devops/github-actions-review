describe("detect if pull request is draft", () => {
  jest.mock("./lib/actions/octokit");

  const { getPullDraft } = require("./action");
  it("should detect draft", async () => {
    expect(
      getPullDraft({
        draft: true,
      })
    ).toBe(true);
  });
  it("should detect non draft", async () => {
    expect(
      getPullDraft({
        draft: false,
      })
    ).toBe(false);
  });
});

describe("pull number", () => {
  jest.mock("./lib/actions/octokit");

  const { getPullNumber } = require("./action");
  it("should return pull number", async () => {
    expect(
      getPullNumber({
        number: 42,
      })
    ).toBe(42);
  });
});

describe("pull base", () => {
  jest.mock("./lib/actions/octokit");

  const { getPullBase } = require("./action");
  it("should return pull base", async () => {
    expect(
      getPullBase({
        base: {
          ref: "master",
          repo: {
            owner: { login: "mobsuccess-devops" },
            name: "github-actions-review",
          },
        },
      })
    ).toStrictEqual({
      baseRef: "master",
      owner: "mobsuccess-devops",
      repo: "github-actions-review",
    });
  });
});

describe("pull requested reviewers", () => {
  jest.mock("./lib/actions/octokit");

  const { getPullRequestedReviewers } = require("./action");
  it("should return pull requested reviewers", async () => {
    expect(
      getPullRequestedReviewers({
        requested_reviewers: [1, 2, 3],
      })
    ).toEqual([1, 2, 3]);
  });
});

describe("check if review has been requested", () => {
  jest.mock("./lib/actions/octokit");

  const { getHasRequestedReview } = require("./action");
  it("should detect no review has been requested", async () => {
    expect(
      getHasRequestedReview([{ body: "coucou", user: { login: "thomas" } }])
    ).toBe(false);
  });
  it("should detect review has been requested", async () => {
    expect(
      getHasRequestedReview([
        {
          body: "A review for this PR has been requested in Slack: <link>",
          user: { login: "ms-bot" },
        },
      ])
    ).toBe(true);
  });
});
