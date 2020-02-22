const chartSize = { width: 1000, height: 600 };
const margin = { left: 100, right: 10, top: 20, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const removePaths = () =>
  d3
    .select("#chart-area")
    .selectAll("path")
    .remove();

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

const update = (quotes, noOfAverageDays) => {
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
    .attr("d", smaLine(quotes.slice(noOfAverageDays - 1)));
};

const parseNumerics = ({ Date, Volume, AdjClose, ...numerics }) => {
  _.forEach(numerics, (v, k) => (numerics[k] = +v));
  const Time = new window.Date(Date);
  return { Date, Time, ...numerics };
};

const calculateAverages = transactions => {
  let totalWinAmount = 0;
  let totalLossAmount = 0;
  let totalWins = 0;
  let totalLosses = 0;
  for (let index = 0; index < transactions.length; index++) {
    const transaction = transactions[index];
    const net = transaction.sell.Close - transaction.buy.Close;
    if (net > 0) {
      totalWinAmount += net;
      totalWins++;
    } else {
      totalLossAmount += net;
      totalLosses++;
    }
  }
  const totalTransactions = transactions.length;
  const averageWinAmount = totalWinAmount / totalWins;
  const averageLossAmount = totalLossAmount / totalLosses;
  const netAmount = totalWinAmount + totalLossAmount;
  const winPercentage = _.round((totalWins / totalTransactions) * 100, 2);

  return {
    totalLossAmount,
    totalWinAmount,
    totalLosses,
    totalWins,
    averageWinAmount,
    averageLossAmount,
    netAmount,
    winPercentage,
    totalTransactions
  };
};

const removeStatsTable = () => {
  d3.select(".statTable")
    .selectAll("tbody")
    .remove();
};

const drawStatsTable = transactions => {
  const statFields = [
    "played",
    "wins",
    "losses",
    "win %",
    "loss multiple",
    "",
    "average win",
    "average loss",
    "win multiple",
    "",
    "net",
    "expectancy"
  ];
  const {
    totalWinAmount,
    totalLosses,
    totalWins,
    averageWinAmount,
    averageLossAmount,
    netAmount,
    winPercentage,
    totalTransactions
  } = calculateAverages(transactions);

  const table = d3.selectAll(".statTable");

  const tableBody = table.append("tbody");
  const stats = [
    totalTransactions,
    totalWins,
    totalLosses,
    `${winPercentage}%`,
    _.round(totalLosses / totalWins, 2),
    "",
    _.round(averageWinAmount),
    _.round(-averageLossAmount),
    _.round(averageWinAmount / -averageLossAmount, 2),
    "",
    _.round(netAmount),
    _.round(totalWinAmount / totalTransactions)
  ];
  const rows = tableBody
    .selectAll("tr")
    .data(statFields)
    .enter()
    .append("tr")
    .text(d => d)
    .append("td")
    .text((d, i) => stats[i]);
};

const removeTransactionTable = () => {
  const table = d3.select("#transactions");
  table.selectAll("tbody").remove();
};

const drawTransactionTable = transactions => {
  const table = d3.select("#transactions");
  const tableBody = table.append("tbody");
  const rows = tableBody
    .selectAll("tr")
    .data(transactions)
    .enter()
    .append("tr");
  const cells = rows
    .selectAll("td")
    .data(d => {
      const buyPrice = _.round(d.buy.Close);
      const sellPrice = _.round(d.sell.Close);
      const difference = sellPrice - buyPrice;
      return [d.buy.Date, buyPrice, d.sell.Date, sellPrice, difference];
    })
    .enter()
    .append("td")
    .text(d => d);
};

const transaction = (buy, sell) => {
  return { buy, sell };
};

const detectTransaction = (quotes, noOfDays) => {
  const transactions = [];
  let stockBought = false;
  let buy = [];
  for (let index = noOfDays; index < quotes.length; index++) {
    const { sma, Close } = quotes[index];
    if (Close > sma && !stockBought) {
      stockBought = true;
      buy = quotes[index];
    }
    if ((Close < sma || index == quotes.length - 1) && stockBought) {
      stockBought = false;
      transactions.push(transaction(buy, quotes[index]));
    }
  }
  return transactions;
};

const analysedata = (quotes, noOfDays) => {
  for (let index = noOfDays; index <= quotes.length; index++) {
    const hundredQuotes = quotes.slice(index - noOfDays, index);
    const hundredDayAverage = _.sum(_.map(hundredQuotes, "Close")) / noOfDays;
    quotes[index - 1].sma = _.round(hundredDayAverage);
  }
  return detectTransaction(quotes, noOfDays);
};

const formatDate = time => {
  return new Date(time).toJSON().split("T")[0];
};

const showSlider = (times, quotes) => {
  const slider = d3
    .sliderHorizontal()
    .min(0)
    .max(times.length - 1)
    .width(800)
    .default([0, times.length - 1])
    .tickFormat(index => times[_.floor(index)].toString().split(" ")[3])
    .on("onchange", val => {
      const startDate = quotes[_.floor(val[0])].Date;
      const endDate = quotes[_.floor(val[1])].Date;
      d3.select("#range-label").text(`${startDate} to ${endDate}`);
      const quotesBetweenRange = quotes.slice(_.floor(val[0]), _.floor(val[1]));
      removePaths();
      update(quotesBetweenRange, d3.select(".averageInput").property("value"));
    });

  d3.select("#slider-container")
    .append("svg")
    .attr("width", 1000)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(30,30)")
    .call(slider);
};

const showAverageInput = quotes => {
  a = d3
    .select(".some")
    .append("input")
    .attr("class", "averageInput")
    .attr("type", "number")
    .attr("min", "1")
    .attr("value", 100)
    .attr("max", "3000")
    .on("input", function() {
      analysedata(quotes, this.value);
      removePaths();
      update(quotes, this.value);
      const trans = detectTransaction(quotes, this.value);
      removeTransactionTable();
      removeStatsTable();
      drawTransactionTable(trans);
      drawStatsTable(trans);
    });
};

const visualizeQuotes = quotes => {
  const trans = analysedata(quotes, 100);
  initChart();
  showSlider(_.map(quotes, "Time"), quotes);
  update(quotes, 100);
  drawTransactionTable(trans);
  drawStatsTable(trans);
  showAverageInput(quotes);
};

const main = () => {
  d3.csv("data/equity.csv", parseNumerics).then(visualizeQuotes);
};

window.onload = main;
