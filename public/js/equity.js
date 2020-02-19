const chartSize = { width: 1200, height: 600 };
const margin = { left: 100, right: 10, top: 20, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const removePaths = () => d3.selectAll("path").remove();
const initChart = () => {
  const svg = d3
    .select("#chart-area svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);
  const g = svg
    .append("g")
    .attr("class", "prices")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .text("Dates");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("class", "y axis-label")
    .attr("y", -60)
    .attr("x", -height / 2)
    .text("Closed Price");

  g.append("g").attr("class", "y-axis");

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);
};

const update = quotes => {
  const line = d3
    .line()
    .x(q => x(q.Time))
    .y(q => y(q.Close));

  const smaLine = d3
    .line()
    .x(q => x(q.Time))
    .y(q => y(q.sma));
  const svg = d3.select("#chart-area svg");

  const firstQuote = _.first(quotes);
  const lastQuote = _.last(quotes);
  const maxValue = _.get(_.maxBy(quotes, "Close"), "Close", 0);
  const minValue = _.get(_.minBy(quotes, "Close"), "Close", 0);

  const x = d3
    .scaleTime()
    .range([0, width])
    .domain([new Date(firstQuote.Date), new Date(lastQuote.Date)]);

  const x_axis = d3.axisBottom(x);
  svg.select(".x-axis").call(x_axis);

  const y = d3
    .scaleLinear()
    .domain([minValue, maxValue])
    .range([height, 0]);
  const y_axis = d3.axisLeft(y).ticks(10);

  svg.select(".y-axis").call(y_axis);

  const g = svg.select(".prices");
  g.append("path")
    .attr("class", "close")
    .attr("d", line(quotes));

  g.append("path")
    .attr("class", "sma")
    .attr("d", smaLine(quotes.slice(99)));
};

const parseNumerics = ({ Date, Volume, AdjClose, ...numerics }) => {
  _.forEach(numerics, (v, k) => (numerics[k] = +v));
  const Time = new window.Date(Date);
  return { Date, Time, ...numerics };
};

const analysedata = quotes => {
  for (let index = 100; index <= quotes.length; index++) {
    const hundredQuotes = quotes.slice(index - 100, index);
    const hundredDayAverage = _.sum(_.map(hundredQuotes, "Close")) / 100;
    quotes[index - 1].sma = _.round(hundredDayAverage);
  }
};

const formatDate = time => {
  return new Date(time).toJSON().split("T")[0];
};

const showSlider = (Times, quotes) => {
  const firstQuoteTime = _.first(Times).getTime();
  const lastQuoteTime = _.last(Times).getTime();
  const slider = createD3RangeSlider(
    firstQuoteTime,
    lastQuoteTime,
    "#slider-container"
  );

  slider.onChange(newRange => {
    d3.select("#range-label").text(
      formatDate(newRange.begin) + " to " + formatDate(newRange.end)
    );
    const quotesBetweenRange = quotes.filter(
      quote =>
        quote.Time.getTime() >= newRange.begin &&
        quote.Time.getTime() <= newRange.end
    );
    removePaths();
    update(quotesBetweenRange);
  });

  slider.range(firstQuoteTime, firstQuoteTime + 10);
};

const visualizeQuotes = quotes => {
  analysedata(quotes);
  initChart();
  showSlider(_.map(quotes, "Time"), quotes);
  update(quotes);
};

const main = () => {
  d3.csv("data/equity.csv", parseNumerics).then(visualizeQuotes);
};

window.onload = main;
