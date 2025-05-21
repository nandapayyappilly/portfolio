import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('nandapayyappilly');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  profileStats.innerHTML = `
    <h2 class="stats-title">GitHub Stats</h2>
    <dl class="stats">
      <div class="stat-block">
        <dt>Public Repos:</dt>
        <dd>${githubData.public_repos}</dd>
      </div>
      <div class="stat-block">
        <dt>Public Gists:</dt>
        <dd>${githubData.public_gists}</dd>
      </div>
      <div class="stat-block">
        <dt>Followers:</dt>
        <dd>${githubData.followers}</dd>
      </div>
      <div class="stat-block">
        <dt>Following:</dt>
        <dd>${githubData.following}</dd>
      </div>
    </dl>
  `;
}

/* const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  profileStats.innerHTML = `
    <h2>GitHub Stats</h2>
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
} */