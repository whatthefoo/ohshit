const speak = require("./speak");
const git = require("./git");
const questions = require("./questions");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

module.exports = {
  timemachine: async function() {
    const branch = await git.getCurrentBranchName();
    const commits = await git.getAllCommits(branch);
    if (commits.length === 0) {
      speak.error("Could not find any commits in this branch");
      process.exit();
    }
    const { commit } = await questions.selectCommit(
      commits,
      "Select a place you want to go back to. Make sure you have no unsaved changes you want to keep."
    );
    git.resetToCommit(commit);
  },
  resetToRemoteBranch: function() {
    console.log("Resetting");
  },
  addToCommit: async function() {
    const { files } = await questions.allOrIndividualFiles();
    const diffFiles = await git.getDiffFiles();

    if (diffFiles.length === 0) {
      speak.success("You don't have any unsaved changes");
      process.exit();
    }

    const latestCommit = await git.getLatestCommit();

    if (!latestCommit) {
      speak.error("You have pushed all your commits already!");
      process.exit();
    }

    const { commitMessage } = await questions.newCommitMessage(
      latestCommit.message
    );

    if (files === "all") {
      git.addAll();
      git.amend(commitMessage);
    }

    if (files === "individual") {
      const { selectedFiles } = await questions.selectFiles(diffFiles);

      if (selectedFiles.length < 1) {
        speak.error("You didn't choose any files to add");
        process.exit();
      }

      git.add(selectedFiles);
      git.amend(commitMessage);
    }
  },
  changeCommitMessage: async () => {
    const latestCommit = await git.getLatestCommit();
    if (latestCommit) {
      const { commitMessage } = await questions.newCommitMessage(
        latestCommit.message
      );
      git.amend(commitMessage);
    } else {
      speak.error("You seem to have pushed all your commits");
    }
  },
  regretCommitToMaster: async () => {
    const commits = await git.getLocalCommits();
    if (commits.length === 0) {
      speak.error("Seems like you have pushed all your commits already!");
      process.exit();
    }
    const { newBranchName } = await questions.newBranch();
    git.createBranch(newBranchName);
    git.resetHead("--hard");
    git.checkout(newBranchName);
  },
  regretCommitToBranch: async () => {
    const commits = await git.getLocalCommits();
    if (commits.length === 0) {
      speak.error("Seems like you have pushed all your commits already!");
      process.exit();
    }
    git.resetHead("--soft");
    git.stash();
    const branches = await git.getLocalBranches();
    const { selectedBranch } = await questions.selectBranch(branches);
    git.checkout(selectedBranch);
    git.stashPop();
  },
  noDiff: () => {
    git.diffStaged();
  },
  fuckEverything: async () => {
    speak.normal("Run these commands after each other");
    speak.normal("cd ..");
    speak.normal("sudo rm -r my-fucking-git-repo-dir");
    speak.normal("git clone https://some.github.url/fucking-git-repo-dir.git");
    speak.normal("cd my-fucking-git-repo-dir");
  }
};
