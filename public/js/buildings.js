const drawBuildings = buildings => {
  const chartSize = { width: 600, height: 400 };
  const margin = { left: 100, right: 10, top: 10, bottom: 150 };

  const width = chartSize.width - margin.left - margin.right;
  const maxHeight = _.maxBy(buildings, building => building.height).height;
  const height = chartSize.height - margin.top - margin.bottom;

  const toLine = b => `<strong>${b.name}</strong> <i>${b.height}</i>`;
  document.querySelector("#chart-area").innerHTML = buildings
    .map(toLine)
    .join("<hr/>");

  const container = d3.select("#chart-data");

  const y = d3
    .scaleLinear()
    .domain([0, maxHeight])
    .range([0, height]);

  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(_.map(buildings, "name"))
    .padding(0.3);

  const svg = container
    .append("svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .text("tall_buildings");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("class", "y axis-label")
    .attr("y", -60)
    .attr("x", -height / 2)
    .text("height(m)");

  const y_axis = d3
    .axisLeft(y)
    .tickFormat(d => d + "m")
    .ticks(4);

  const x_axis = d3.axisBottom(x);

  g.append("g")
    .attr("class", "y-axis")
    .call(y_axis);

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(x_axis);
  g.selectAll(".x-axis text")
    .attr("x", -5)
    .attr("y", 10)
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end");
  const rectangles = g.selectAll("rect").data(buildings);

  const newRects = rectangles
    .enter()
    .append("rect")
    .attr("x", b => x(b.name))
    .attr("width", x.bandwidth)
    .attr("height", b => y(b.height));
};
const main = () => {
  d3.json("data/buildings.json").then(drawBuildings);
};
window.onload = main;
