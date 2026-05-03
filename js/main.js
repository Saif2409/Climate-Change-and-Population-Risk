import { loadDatasets } from "./dataLoader.js";
import ScatterPlot from "./scatterPlot.js";
import PopulationBarChart from "./barChart.js";
import EventsBarChart from "./eventsChart.js";
import LineChart from "./lineChart.js";
import RegionChart from "./regionChart.js";
import { initialState, wireInteractions } from "./interactions.js";

const app = async () => {
  const statusNode = document.getElementById("selection-status");
  const insightNode = document.getElementById("dynamic-insight");
  const tooltip = d3.select("#tooltip");
  const resetButton = document.getElementById("reset-selection");

  try {
    const allData = await loadDatasets();

    const dispatcher = d3.dispatch(
      "countryHover",
      "countryOut",
      "countryClick",
      "regionHover",
      "regionOut",
      "regionClick",
      "trendHover",
      "trendOut",
      "resetSelection"
    );
    const state = { ...initialState };

    const lineChart = new LineChart({
      selector: "#line-chart",
      dispatcher,
    });

    const scatterPlot = new ScatterPlot({
      selector: "#scatter-chart",
      dispatcher,
      tooltipSelector: "#tooltip",
    });

    const populationBarChart = new PopulationBarChart({
      selector: "#population-bar-chart",
      dispatcher,
    });

    const eventsBarChart = new EventsBarChart({
      selector: "#events-bar-chart",
      dispatcher,
    });

    const regionChart = new RegionChart({
      selector: "#region-chart",
      dispatcher,
    });

    const charts = {
      lineChart,
      regionChart,
      countryCharts: [scatterPlot, populationBarChart, eventsBarChart],
    };

    const { applyFilterAndRender } = wireInteractions({
      dispatcher,
      charts,
      allData,
      state,
      statusNode,
      insightNode,
      tooltip,
    });

    resetButton.addEventListener("click", () => {
      dispatcher.call("resetSelection", null);
    });

    applyFilterAndRender();
  } catch (error) {
    statusNode.textContent = "Data loading error";
    insightNode.textContent =
      "Unable to load one or more CSV files. Ensure the data files exist in the expected folders and your browser allows local file access for CSV requests.";
    console.error("Application initialization failed:", error);
  }
};

app();
