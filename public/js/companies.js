const drawCompanies = companies => {
  const chartSize = { width: 800, height: 600 };
  const margin = { left: 100, right: 10, top: 10, bottom: 150 };
  const width = chartSize.width - margin.left - margin.right;
  const maxHeight = _.maxBy(companies, "CMP").CMP;
  const height = chartSize.height - margin.top - margin.bottom;

  const container = d3.select("#chart-data");
  const y = d3
    .scaleLinear()
    .domain([0, maxHeight])
    .range([height, 0]);

  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(_.map(companies, "Name"))
    .padding(0.3);
  const c = d3.scaleOrdinal(d3.schemeCategory10)
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
    .text("Companies");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("class", "y axis-label")
    .attr("y", -60)
    .attr("x", -height / 2)
    .text("CMP");

  const y_axis = d3
    .axisLeft(y)
    .tickFormat(d => "₹" + d)
    .ticks(8);

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
  const rectangles = g.selectAll("rect").data(companies);

  const newRects = rectangles
    .enter()
    .append("rect")
    .attr("x", b => x(b.Name))
    .attr("y", b => y(b.CMP))
    .attr("width", x.bandwidth)
    .attr("height", b => y(0) - y(b.CMP))
    .attr("fill", b => c(b.Name));
};

const parseCompany = ({ Name, ...numerics }) => {
  _.forEach(numerics, (v, k) => (numerics[k] = +v));
  return { Name, ...numerics };
};

const main = () => {
  d3.csv("data/companies.csv", parseCompany).then(drawCompanies);
};
window.onload = main;
