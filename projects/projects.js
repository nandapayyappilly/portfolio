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
  let filteredProjects = projects.filter((project) => {
    const matchesQuery = Object.values(project).join('\n').toLowerCase().includes(query);
    if (selectedIndex === -1) return matchesQuery;

    // Year filter active
    const selectedYear = currentData[selectedIndex].label;
    return matchesQuery && project.year === selectedYear;
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
}

let currentData = []; // Will hold newData for year filtering

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
    svg
      .append('path')
      .attr('d', arcPath)
      .attr('fill', d3.schemeTableau10[i % 10])
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        // Update wedge styles
        svg.selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Update legend styles
        d3.select('.legend')
          .selectAll('li')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Filter projects accordingly
        applyFilters();
      });
  });

  // Build legend
  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  currentData.forEach((d, i) => {
    const li = legend.append('li')
      .attr('class', i === selectedIndex ? 'selected' : '');

    li.append('span')
      .attr('class', 'swatch')
      .style('background-color', d3.schemeTableau10[i % 10]);

    li.append('text')
      .text(`${d.label} (${d.value})`);
  });
}

// Initial render
applyFilters();

/* let selectedIndex = -1; // Initialize selectedIndex for wedge selection
let query = ''; // Track current search input

const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value.toLowerCase();
  applyFilters();
});

// Apply both year and query filters together
function applyFilters() {
  let filteredProjects = projects.filter((project) => {
    const matchesQuery = Object.values(project).join('\n').toLowerCase().includes(query);
    if (selectedIndex === -1) return matchesQuery;

    // Year filter active
    const selectedYear = currentData[selectedIndex].label;
    return matchesQuery && project.year === selectedYear;
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
}

let currentData = []; // Will hold newData for year filtering

// Function to render pie chart
function renderPieChart(projectsGiven) {
  // Re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  // Re-calculate data
  let currentData = newRolledData.map(([year, count]) => ({
    label: year,
    value: count,
  }));

  // Generate pie chart arcs
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(newData);
  let arc = d3.arc().innerRadius(0).outerRadius(40);
  let arcs = arcData.map((d) => arc(d));

  // Select the SVG and clear previous chart
  let svg = d3.select('svg');
  svg.selectAll('path').remove();

  // Create new paths (wedge elements)
  arcs.forEach((arcPath, i) => {
    svg
      .append('path')
      .attr('d', arcPath)
      .attr('fill', d3.schemeTableau10[i % 10])
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer') // Add pointer cursor for better UX
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        // Update path class to reflect selection/deselection
        svg
          .selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Update legend classes
        d3.select('.legend')
          .selectAll('li')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          const selectedYear = newData[selectedIndex].label;
          const filteredProjects = projects.filter(p => p.year === selectedYear);
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }
      });
  });

  // Update legend
  let legend = d3.select('.legend');
  legend.selectAll('li').remove(); // Clear the legend before re-rendering

  newData.forEach((d, i) => {
    let li = legend.append('li')
      .attr('class', i === selectedIndex ? 'selected' : '');

    // Add a swatch to the legend item
    li.append('span') // Create a span element
      .attr('class', 'swatch') // Assign a class for styling
      .style('--color', d3.schemeTableau10[i % 10]); // Set the background color based on the wedge color

    li.append('text')
      .text(`${d.label} (${d.value})`);
  });
}

// Initial render of pie chart
renderPieChart(projects);

// Search functionality
//let query = '';
//let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  // Filter projects based on search query
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // Re-render the filtered projects and pie chart
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
}); */
