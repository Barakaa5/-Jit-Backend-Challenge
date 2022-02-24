const axios = require("axios");
const prompt = require("prompt-sync")();
const shell = require("shelljs");

let repositories = [];
async function GitHubAPI() {
  let response = await axios.get(path);
  return response.data.items;
}

let numRepo = parseInt(prompt("Welcome, How many repositories to search? "));
while (!Number.isInteger(numRepo))
  numRepo = parseInt(prompt("Please insert an integer: "));
let n;
if (numRepo < 100) n = 1;
else n = numRepo % 100;

let path = `https://api.github.com/search/repositories?q=language:javascript&sort=stars&order=desc&per_page=${numRepo}&page=${n}`;


GitHubAPI()
  .then(function (response) {
    console.log("repositories: " + response.length);
    response.forEach((repository) => {
      repositories.push({
        repoName: repository.name,
        URL: repository.html_url,
        watchers: repository.watchers,
      });
    });
    shell.cd("./repositories");
    repositories.forEach(function (repo) {
      shell.exec(`git clone ${repo.URL}`);
      shell.cd(`./${repo.repoName}`);
      let text = shell.exec("depcheck").stdout;
      let counter = 0;
      let Missing = text.indexOf("Missing dependencies");
      let length = (Missing != -1)? Missing : text.length; 
      for (let i = 0; i < length; i++) if (text[i] == "*") counter++;
      shell.cd(`..`);
      shell.exec(`rm -r ${repo.repoName}`);
      repo.Security_Score = 100 - counter;
    });
    console.log("=========================================");
    console.log("================ Summary ================");
    repositories.sort((a,b) => b.Security_Score - a.Security_Score);
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
