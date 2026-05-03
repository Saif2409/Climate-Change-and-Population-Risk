const formatOneDecimal = d3.format(",.1f");
const formatInteger = d3.format(",.0f");

export const initialState = {
  selectedCountry: null,
  hoveredCountry: null,
  selectedRegion: null,
  hoveredRegion: null,
  linkedRegion: null,
};

export function getFilteredCountryData(allData, state) {
  let filtered = [...allData.countryComparison];

  if (state.selectedRegion) {
    filtered = filtered.filter((d) => d.region === state.selectedRegion);
  }

  if (state.selectedCountry) {
    filtered = filtered.filter((d) => d.country === state.selectedCountry);
  }

  return filtered;
}

export function computeNarrative(currentData, state) {
  // Dynamic storytelling text for the insight section.
  if (!currentData.length) {
    return "No country currently matches the active selection. Click reset to return to the full comparison view.";
  }

  const topPopulation = d3.max(currentData, (d) => d.populationMillions);
  const topAffected = d3.max(currentData, (d) => d.affectedMillions);
  const topEvents = d3.max(currentData, (d) => d.extremeEvents);

  if (state.selectedCountry) {
    const d = currentData[0];
    return `${d.country} has around ${formatOneDecimal(d.populationMillions)} million people, ${formatOneDecimal(
      d.affectedMillions
    )} million people affected, and ${formatInteger(
      d.extremeEvents
    )} extreme weather events. This focused view highlights that population size and climate impact are connected, but the intensity of exposure differs by country context.`;
  }

  if (state.selectedRegion) {
    const avgAffected = d3.mean(currentData, (d) => d.affectedMillions);
    return `${state.selectedRegion} is selected, covering ${formatInteger(
      currentData.length
    )} country-level records in this comparison. Within the region, affected populations average ${formatOneDecimal(
      avgAffected
    )} million per country entry, showing that regional vulnerability still varies strongly by country scale.`;
  }

  const corr = pearson(currentData, "populationMillions", "affectedMillions");
  const direction = corr > 0.2 ? "positive" : corr < -0.2 ? "negative" : "weak";

  return `In the full view, countries range up to ${formatOneDecimal(topPopulation)} million in population, ${formatOneDecimal(
    topAffected
  )} million people affected, and ${formatInteger(
    topEvents
  )} extreme events. The population-impact relationship is ${direction} (r = ${corr.toFixed(
    2
  )}), suggesting larger populations often face higher total impact, but not in a perfectly proportional way.`;
}

export function wireInteractions({ dispatcher, charts, allData, state, statusNode, insightNode, tooltip }) {
  // Keep all charts visually synchronized for hover/selected states.
  const renderHighlightsOnly = () => {
    charts.countryCharts.forEach((chart) => chart.setInteractionState(state));
    charts.regionChart.setInteractionState(state);
    charts.lineChart.setInteractionState(state);
  };

  const getRegionByCountry = (country) => {
    if (!country) return null;
    const row = allData.countryComparison.find((d) => d.country === country);
    return row?.region || null;
  };

  const syncLinkedRegionFromCountryState = () => {
    const countryFocus = state.hoveredCountry || state.selectedCountry;
    state.linkedRegion = getRegionByCountry(countryFocus);
  };

  const positionTooltip = (event) => {
    const x = event.clientX + 16;
    const y = event.clientY - 14;
    tooltip.style("left", `${x}px`).style("top", `${y}px`);
  };

  const showCountryTooltip = ({ event, datum }) => {
    if (!datum) return;

    tooltip
      .html(
        `<div class="name">${datum.country}</div>
         <div>Region: ${datum.region}</div>
         <div>Population: ${formatOneDecimal(datum.populationMillions)} million</div>
         <div>People affected: ${formatOneDecimal(datum.affectedMillions)} million</div>
         <div>Extreme events: ${formatInteger(datum.extremeEvents)}</div>`
      )
      .classed("visible", true);

    positionTooltip(event);
  };

  const showRegionTooltip = ({ event, datum }) => {
    if (!datum) return;

    tooltip
      .html(
        `<div class="name">${datum.region}</div>
         <div>People affected: ${formatOneDecimal(datum.totalPopulationAffectedMillions)} million</div>
         <div>Extreme events: ${formatInteger(datum.extremeEvents)}</div>`
      )
      .classed("visible", true);

    positionTooltip(event);
  };

  const showTrendTooltip = ({ event, datum }) => {
    if (!datum) return;

    tooltip
      .html(
        `<div class="name">Year ${formatInteger(datum.year)}</div>
         <div>Global population: ${formatOneDecimal(datum.globalPopulationMillions)} million</div>`
      )
      .classed("visible", true);

    positionTooltip(event);
  };

  const hideTooltip = () => tooltip.classed("visible", false);

  const updateStatus = () => {
    const labels = [];
    if (state.selectedRegion) labels.push(`Region: ${state.selectedRegion}`);
    if (state.selectedCountry) labels.push(`Country: ${state.selectedCountry}`);
    statusNode.textContent = labels.length ? `Selected -> ${labels.join(" | ")}` : "No country selected";
  };

  const applyFilterAndRender = () => {
    // Full rerender path used for click/reset filtering changes.
    syncLinkedRegionFromCountryState();
    const filteredCountries = getFilteredCountryData(allData, state);

    charts.countryCharts.forEach((chart) => chart.update(filteredCountries, state));
    charts.regionChart.update(allData.regionalImpact, state);
    charts.lineChart.update(allData.populationTrend, state);

    insightNode.textContent = computeNarrative(filteredCountries, state);
    updateStatus();
  };

  dispatcher.on("countryHover.interactions", (payload) => {
    state.hoveredCountry = payload.country;
    syncLinkedRegionFromCountryState();
    renderHighlightsOnly();
    showCountryTooltip(payload);
  });

  dispatcher.on("countryOut.interactions", () => {
    state.hoveredCountry = null;
    syncLinkedRegionFromCountryState();
    renderHighlightsOnly();
    hideTooltip();
  });

  dispatcher.on("countryClick.interactions", (payload) => {
    state.selectedCountry = state.selectedCountry === payload.country ? null : payload.country;
    state.hoveredCountry = null;
    syncLinkedRegionFromCountryState();
    hideTooltip();
    applyFilterAndRender();
  });

  dispatcher.on("regionHover.interactions", (payload) => {
    state.hoveredRegion = payload.region;
    renderHighlightsOnly();
    showRegionTooltip(payload);
  });

  dispatcher.on("regionOut.interactions", () => {
    state.hoveredRegion = null;
    renderHighlightsOnly();
    hideTooltip();
  });

  dispatcher.on("regionClick.interactions", (payload) => {
    const nextRegion = state.selectedRegion === payload.region ? null : payload.region;
    state.selectedRegion = nextRegion;

    if (nextRegion && state.selectedCountry) {
      const selectedCountryRegion = getRegionByCountry(state.selectedCountry);
      if (selectedCountryRegion !== nextRegion) {
        state.selectedCountry = null;
      }
    }

    state.hoveredRegion = null;
    state.hoveredCountry = null;
    syncLinkedRegionFromCountryState();
    hideTooltip();
    applyFilterAndRender();
  });

  dispatcher.on("trendHover.interactions", (payload) => {
    showTrendTooltip(payload);
  });

  dispatcher.on("trendOut.interactions", () => {
    hideTooltip();
  });

  dispatcher.on("resetSelection.interactions", () => {
    state.selectedCountry = null;
    state.hoveredCountry = null;
    state.selectedRegion = null;
    state.hoveredRegion = null;
    state.linkedRegion = null;
    hideTooltip();
    applyFilterAndRender();
  });

  return {
    applyFilterAndRender,
  };
}

function pearson(data, xKey, yKey) {
  // Lightweight Pearson correlation for dynamic narrative context.
  const values = data
    .map((d) => ({ x: d[xKey], y: d[yKey] }))
    .filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y));

  const n = values.length;
  if (n < 2) return 0;

  const sumX = d3.sum(values, (d) => d.x);
  const sumY = d3.sum(values, (d) => d.y);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  values.forEach(({ x, y }) => {
    const dx = x - meanX;
    const dy = y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  });

  const denom = Math.sqrt(denX * denY);
  return denom === 0 ? 0 : num / denom;
}
