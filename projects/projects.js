import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
document.querySelector('.projects-title').textContent = `${projects.length} projects`;

let selectedIndex = -1;
let query = ''; // Track current search input

const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value.toLowerCase();
  applyFilters();
});

// Apply both year and query filters together
function applyFilters() {
  // Apply only search filter for pie chart data
  const searchFiltered = projects.filter((project) =>
    Object.values(project).join('\n').toLowerCase().includes(query)
  );

  // Apply search + year filter for project cards
  const filteredProjects = searchFiltered.filter((project) => {
    if (selectedIndex === -1) return true;
    const selectedYear = currentData[selectedIndex].label;
    return project.year === selectedYear;
  });

  // Update cards and chart
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(searchFiltered);
}

let currentData = [];

function renderPieChart(projectsGiven) {
  // Aggregate projects by year
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  currentData = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  // Pie chart setup
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(currentData);
  const arc = d3.arc().innerRadius(0).outerRadius(40);
  const arcs = arcData.map((d) => arc(d));

  const svg = d3.select('svg');
  svg.selectAll('path').remove();

  arcs.forEach((arcPath, i) => {
    const color = i === selectedIndex ? '#ff6666' : d3.schemeTableau10[i % 10]; // Dynamic color

    svg
      .append('path')
      .attr('d', arcPath)
      .attr('fill', color)
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        // Update pie chart and legend after selection
        applyFilters();
      });
  });

  // Build legend
  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  currentData.forEach((d, i) => {
    const li = legend.append('li')
      .attr('class', i === selectedIndex ? 'selected' : '');

    const color = i === selectedIndex ? '#ff6666' : d3.schemeTableau10[i % 10]; // Match slice color

    li.append('span')
      .attr('class', 'swatch')
      .style('background-color', color);

    li.append('text')
      .text(`${d.label} (${d.value})`);
  });
}

// Initial render
applyFilters();