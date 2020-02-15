const chartSize = { width: 800, height: 600 };
const margin = { left: 100, right: 10, top: 20, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;
const colors = d3.scaleOrdinal(d3.schemeCategory10);

const init = () => {
  const svg = d3
    .select("#chart-area svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);

  const g = svg
    .append("g")
    .attr("class", "companies")
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
    .attr("x", -height / 2);

  g.append("g").attr("class", "y-axis");

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);

  g.selectAll(".x-axis text")
    .attr("x", -5)
    .attr("y", 10)
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end");
};

const percentageFormat = d => `${d}%`;
const kCroresFormat = d => `${d / 1000}k cr ₹`;
const rupeeFormat = d => `₹ ${d}`;
const formats = {
  MarketCap: kCroresFormat,
  DivYld: percentageFormat,
  ROCE: percentageFormat,
  QNetProfit: kCroresFormat,
  QSales: kCroresFormat,
  CMP: rupeeFormat
};

const updateCompanies = function(companies, fieldName) {
  const maxValue = _.get(_.maxBy(companies, fieldName), fieldName, 0);

  const svg = d3.select("#chart-area svg");
  svg.select(".y.axis-label").text(fieldName);

  const y = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([height, 0]);

  const y_axis = d3
    .axisLeft(y)
    .tickFormat(formats[fieldName])
    .ticks(8);

  svg.select(".y-axis").call(y_axis);

  const t = d3
    .transition()
    .duration(1000)
    .ease(d3.easeLinear);

  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(_.map(companies, "Name"))
    .padding(0.3);

  const x_axis = d3.axisBottom(x);
  svg.select(".x-axis").call(x_axis);

  const rectangleG = svg.select("g");
  const rectangles = rectangleG.selectAll("rect").data(companies, c => c.Name);
  rectangles.exit().remove();

  svg
    .selectAll(".x-axis text")
    .attr("x", -5)
    .attr("y", 10)
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end");

  rectangles
    .enter()
    .append("rect")
    .attr("y", () => y(0))
    .attr("x", c => x(c.Name))
    .merge(rectangles)
    .transition(t)
    .attr("y", c => y(c[fieldName]))
    .attr("x", c => x(c.Name))
    .attr("fill", c => colors(c.Name))
    .attr("width", x.bandwidth)
    .attr("height", c => y(0) - y(c[fieldName]));
};

const frequentlyMoveCompanies = (src, dest) => {
  setInterval(() => {
    const c = src.shift();
    if (c) {
      dest.push(c);
    } else {
      [src, dest] = [dest, src];
    }
  }, 5000);
};

const parseCompany = ({ Name, ...numerics }) => {
  _.forEach(numerics, (v, k) => (numerics[k] = +v));
  return { Name, ...numerics };
};

const animateCompanies = companies => {
  init(companies);
  const fields = "CMP,PE,MarketCap,DivYld,QNetProfit,QSales,ROCE".split(",");
  let step = 0;
  setInterval(
    () => updateCompanies(companies, fields[step++ % fields.length]),
    2000
  );
  frequentlyMoveCompanies(companies, []);
};

const main = () => {
  d3.csv("data/companies.csv", parseCompany).then(animateCompanies);
};
window.onload = main;
