const drawBuildings = buildings => {
  const width = 400;
  const maxHeight = _.maxBy(buildings, building => building.height).height;
  const height = 400;

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
    .attr("width", width)
    .attr("height", height);

  const rectangles = svg.selectAll("rect").data(buildings);

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
