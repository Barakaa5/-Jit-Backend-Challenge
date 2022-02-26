const axios = require("axios");
const prompt = require("prompt-sync")();
const shell = require("shelljs");

let repositories = [];
async function GitHubAPI(path) {
  let response = await axios.get(path);
  return response.data.items;
}

let numRepo = parseInt(prompt("Welcome, How many repositories to search? ")); // Asking from the user the amount of repo to check
while (!Number.isInteger(numRepo))
  numRepo = parseInt(prompt("Please insert an integer: "));
if (numRepo > 100) numRepo = 100;// Limit the search 

let query = `q=language:javascript&sort=stars&order=desc&per_page=${numRepo}&page=0`;

let path = `https://api.github.com/search/repositories?${query}`;

GitHubAPI(path)
  .then(function (response) {
    response.forEach((repository) => {// createing an array with relevant data of the repositories
      repositories.push({
        repoName: repository.name,
        URL: repository.html_url,
        watchers: repository.watchers,
      });
    });
    shell.cd("./repositories");
    repositories.forEach(function (repo) {// for Each repo, clone it, calculate it's Security Score and remove the cloning folder.
      shell.exec(`git clone ${repo.URL}`);
      shell.cd(`./${repo.repoName}`);
      let text = shell.exec("depcheck").stdout;
      let counter = 0;
      let Missing = text.indexOf("Missing dependencies");//ignoring Missing dependencies
      let length = Missing != -1 ? Missing : text.length;
      for (let i = 0; i < length; i++) if (text[i] == "*") counter++;
      shell.cd(`..`);
      shell.exec(`rm -r ${repo.repoName}`);
      repo.Security_Score = 100 - counter; //Security_Score is (100 - the amount of Unused devDependencies)
    });
    console.log("=========================================");
    console.log("================ Summary ================"); //output Summary
    repositories.sort((a, b) => b.Security_Score - a.Security_Score);
    repositories.forEach(function (repo) {
      console.log("--------------------------------");
      console.log("Repository Name: " + repo.repoName);
      console.log("URL: " + repo.URL);
      console.log("Watchers: " + repo.watchers);
      console.log("Security Score: " + repo.Security_Score + "%");
      console.log("--------------------------------");
    });
    console.log("================== End ==================");
    console.log("=========================================");
  })
  .catch((error) => console.log(error));
