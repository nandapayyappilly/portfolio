import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let commitProgress = 100;
let commits = [];
let data = [];
let timeScale;

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line),
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
  
    return data;
}
  
function processCommits(data) {
    return d3.groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          writable: false,
          configurable: false,
          enumerable: false,
        });
  
        return ret;
      });
}

function getFilteredCommits() {
  const commitMaxTime = timeScale.invert(commitProgress);
  return commits.filter(d => d.datetime < commitMaxTime);
}

/* timeScale = d3.scaleTime(
  [d3.min(commits, (d) => d.datetime), d3.max(commits, (d) => d.datetime)],
  [0, 100],
);



// Handle slider input
document.getElementById('commitSlider').addEventListener('input', (event) => {
  commitProgress = +event.target.value;
  updateCommitTimeLabel();
  // You can re-render or filter the visualization here later
});

updateCommitTimeLabel(); */
  
// Function to compute summary stats
function computeSummaryStats(data, commits) {
    // Total LOC
    const totalLOC = d3.sum(data, d => d.line);
    
    // Number of files
    const numFiles = d3.group(data, d => d.file).size;
    
    // Max depth
    const maxDepth = d3.max(data, d => d.depth);
  
    // Longest line length
    const longestLine = d3.max(data, d => d.length);
  
    // Max lines modified in a single commit
    const maxLines = d3.max(commits, commit => commit.totalLines);
  
    return {
      totalLOC,
      numFiles,
      maxDepth,
      longestLine,
      maxLines,
    };
}
  
// Function to render stats to the page
function renderCommitInfo(data, commits) {
    const stats = computeSummaryStats(data, commits);

    const container = d3.select('#stats');

    // Add title
    container.append('h2')
    .attr('class', 'stats-title')
    .text('Summary');
  
    const dl = d3.select('#stats')
      .append('dl')
      .attr('class', 'stats');
  
    const items = [
      { label: 'Commits', value: commits.length },
      { label: 'Files', value: stats.numFiles },
      { label: 'Total LOC', value: stats.totalLOC },
      { label: 'Max Depth', value: stats.maxDepth },
      { label: 'Longest Line', value: stats.longestLine },
      { label: 'Max Lines', value: stats.maxLines },
    ];
  
    items.forEach(item => {
      const block = dl.append('div').attr('class', 'stat-block');
      block.append('dt').html(item.label);
      block.append('dd').text(item.value);
    });
}

function updateCommitTimeLabel() {
  const selectedTime = d3.select('#selectedTime');
  const maxTime = timeScale.invert(commitProgress);
  selectedTime.text(maxTime.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short"
  }));
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.classList.toggle('show', isVisible);
  //tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`; // Offset for mouse pointer
  tooltip.style.top = `${event.clientY + 10}px`;
}

let xScale;
let yScale;

function updateScatterPlot(data, filteredCommits) {
  // Put all the JS code of Steps inside this function
  d3.select('svg').remove(); // first clear the svg
  const width = 1000;
  const height = 600;
  const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');

  xScale = d3
  .scaleTime()
  .domain(d3.extent(filteredCommits, (d) => d.datetime))
  .range([0, width])
  .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const dots = svg.append('g').attr('class', 'dots');
  
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Create the axes
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat('%b %d'));
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
  
  const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);

  const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([2, 30]);
  
  const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);
  
  dots
  .selectAll('circle')
  .data(sortedCommits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', (d) => rScale(d.totalLines)) 
  .style('--r', (d) => rScale(d.totalLines)) 
  .attr('fill', 'steelblue')
  .style('fill-opacity', 0.7)
  // .attr('r', 5)
  //.style("--r", d => d.r)
  .attr('fill', 'steelblue')
  .on('mouseenter', (event, commit) => {
    d3.select(event.currentTarget).style('fill-opacity', 1);
    renderTooltipContent(commit);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);
    //brushed(event);
  })
  .on('mousemove', (event) => {
    updateTooltipPosition(event);
  })
  .on('mouseleave', () => {
    updateTooltipVisibility(false);
  })
  .attr('r', (d) => rScale(d.totalLines))
  .style('fill-opacity', 0.7) // Add transparency for overlapping dots
  .style("--r", d => d.r)
  .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
      //createBrushSelector(svg);
      //brushed(event);
  })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
  });
  createBrushSelector(svg);
 }
 

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  
  const dt = commit.datetime;
  if (dt instanceof Date) {
    date.textContent = dt.toLocaleDateString('en', { dateStyle: 'full' });
    time.textContent = dt.toLocaleTimeString('en', { timeStyle: 'short' });
  } else {
    date.textContent = '';
    time.textContent = '';
  }

  author.textContent = commit.author || 'Unknown';
  lines.textContent = commit.lines.length !== undefined ? commit.lines.length : 'N/A';
}

function createBrushSelector(svg) {
  const brush = d3.brush()
    .extent([
      [xScale.range()[0], yScale.range()[1]],
      [xScale.range()[1], yScale.range()[0]],
    ])
    .on('brush end', brushed);

  svg.append('g')
    .attr('class', 'brush')
    .call(brush);

  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? getFilteredCommits().filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }

  // Extract brush selection bounds
  const [x0, x1] = selection.map(d => d[0]);
  const [y0, y1] = selection.map(d => d[1]);

  // Map commit data to scaled positions
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  // Check if commit falls within brush bounds
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? getFilteredCommits().filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
    <div class="stat-block">
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    </div>
    `;
  }
}

let NUM_ITEMS = commits.length; // Ideally, let this value be the length of your commit history
let ITEM_HEIGHT = 120; // Feel free to change
let VISIBLE_COUNT = 10; // Feel free to change as well
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);
const itemsContainer = d3.select('#items-container');
scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(
    0,
    Math.min(startIndex, commits.length - VISIBLE_COUNT),
  );
  renderItems(startIndex);
});

let F_NUM_ITEMS = 100; // Ideally, let this value be the length of your commit history
let F_ITEM_HEIGHT = 30; // Feel free to change
let F_VISIBLE_COUNT = 10; // Feel free to change as well
let F_totalHeight = (F_NUM_ITEMS - 1) * F_ITEM_HEIGHT;
const F_scrollContainer = d3.select('#files-scroll-container');
const F_spacer = d3.select('#files-spacer');
F_spacer.style('height', `${F_totalHeight}px`);
const F_itemsContainer = d3.select('#files-items-container');
F_scrollContainer.on('scroll', () => {
  const F_scrollTop = F_scrollContainer.property('scrollTop');
  let F_startIndex = Math.floor(F_scrollTop / F_ITEM_HEIGHT);
  F_startIndex = Math.max(
    0,
    Math.min(F_startIndex, commits.length - F_VISIBLE_COUNT),
  );
  renderFiles(F_startIndex);
});

function renderFiles(F_startIndex) {
  // Clear things off
  F_itemsContainer.selectAll('div').remove();
  const F_endIndex = Math.min(F_startIndex + F_VISIBLE_COUNT, commits.length);
  let F_newCommitSlice = commits.slice(F_startIndex, F_endIndex);
  // TODO: how should we update the scatterplot (hint: it's just one function call)
  updateScatterPlot(data, F_newCommitSlice);
  displayCommitFiles(F_newCommitSlice);
  //displayCommitFiles();
  // Re-bind the commit data to the container and represent each using a div
  F_itemsContainer.selectAll('div')
                .data(F_newCommitSlice)
                .enter()
                .append('div')
                .html((d) => {
                  const numFiles = d3.rollups(d.lines, D => D.length, d => d.file).length;
                  const dateStr = d.datetime.toLocaleString("en", {
                    dateStyle: "full",
                    timeStyle: "short"
                  });
                  return `<p>On ${dateStr}, I edited ${d.totalLines} lines across ${numFiles} files.</p>`;
                })
                .style('position', 'absolute')
                .style('top', (_, idx) => `${idx * F_ITEM_HEIGHT}px`);
}


function renderItems(startIndex) {
  // Clear things off
  itemsContainer.selectAll('div').remove();
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);
  // TODO: how should we update the scatterplot (hint: it's just one function call)
  updateScatterPlot(data, newCommitSlice);
  displayCommitFiles(newCommitSlice);
  //displayCommitFiles();
  // Re-bind the commit data to the container and represent each using a div
  itemsContainer.selectAll('div')
                .data(newCommitSlice)
                .enter()
                .append('div')
                .html((d, i) => {
                  const numFiles = d3.rollups(d.lines, D => D.length, d => d.file).length;
                  const dateStr = d.datetime.toLocaleString("en", {
                    dateStyle: "full",
                    timeStyle: "short"
                  });
                  const linkText = i > 0
                    ? "another glorious commit"
                    : "my first commit, and it was glorious";
            
                  return `
                    <p>
                      On ${dateStr}, I made
                      <a href="${d.url}" target="_blank">${linkText}</a>.
                      I edited ${d.totalLines} lines across ${numFiles} files.
                      Then I looked over all I had made, and I saw that it was very good.
                    </p>`;
                })
                .style('position', 'absolute')
                .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}

function displayCommitFiles(commitsToUse) {
  const lines = commitsToUse.flatMap((d) => d.lines);
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });
  files = d3.sort(files, (d) => -d.lines.length);
  d3.select('.files').selectAll('div').remove();
  let filesContainer = d3
    .select('.files')
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');
  filesContainer
    .append('dt')
    .html(
      (d) => `<code>${d.name}</code><small>${d.lines.length} lines</small>`,
    );
  filesContainer
    .append('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', (d) => fileTypeColors(d.type));
}



async function main() {
  data = await loadData();
  commits = processCommits(data);

  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([0, 100]);

  updateCommitTimeLabel();

  const filteredCommits = getFilteredCommits();
  updateScatterPlot(data, filteredCommits);
  renderCommitInfo(data, filteredCommits);

  renderItems(0);
  renderFiles(0);

}

main();



