const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const safeDivide = (value, divisor) => {
  if (value == null || divisor === 0) return null;
  return value / divisor;
};

// Parse row for the primary linked-chart dataset and normalize units.
const parseCountryComparisonRow = (row) => {
  const population = toNumber(row.population_2022);
  const affectedRaw = toNumber(row.total_population_affected_m);
  const events = toNumber(row.extreme_events);
  const co2 = toNumber(row.total_co2_emissions_mt);

  return {
    country: row.country?.trim(),
    region: row.region?.trim(),
    continent: row.continent?.trim() || "Unknown",
    populationRaw: population,
    affectedRaw,
    extremeEvents: events,
    co2EmissionsMt: co2,
    densityPerKm2: toNumber(row.density_per_km2),
    growthRate: toNumber(row.growth_rate),
    avgTemperatureChangeC: toNumber(row.avg_temperature_change_c),
    populationMillions: safeDivide(population, 1_000_000),
    affectedMillions: safeDivide(affectedRaw, 1_000),
  };
};

// Parse row for aggregated climate metrics per country.
const parseClimateAggregateRow = (row) => ({
  country: row.country?.trim(),
  region: row.region?.trim(),
  extremeEvents: toNumber(row.extreme_events),
  totalPopulationAffectedRaw: toNumber(row.total_population_affected_m),
  totalPopulationAffectedMillions: safeDivide(toNumber(row.total_population_affected_m), 1_000),
  totalCo2EmissionsMt: toNumber(row.total_co2_emissions_mt),
  avgTemperatureChangeC: toNumber(row.avg_temperature_change_c),
});

// Parse row for cleaned population reference data.
const parsePopulationRow = (row) => ({
  country: row.country?.trim(),
  continent: row.continent?.trim() || "Unknown",
  population2022Raw: toNumber(row.population_2022),
  population2022Millions: safeDivide(toNumber(row.population_2022), 1_000_000),
  growthRate: toNumber(row.growth_rate),
  densityPerKm2: toNumber(row.density_per_km2),
});

// Parse row for regional-level derived summary.
const parseRegionalRow = (row) => ({
  region: row.region?.trim(),
  extremeEvents: toNumber(row.extreme_events),
  totalPopulationAffectedRaw: toNumber(row.total_population_affected_m),
  totalPopulationAffectedMillions: safeDivide(toNumber(row.total_population_affected_m), 1_000),
});

// Parse row for historical global population trend.
const parseTrendRow = (row) => ({
  year: toNumber(row.year),
  globalPopulationRaw: toNumber(row.global_population),
  globalPopulationMillions: safeDivide(toNumber(row.global_population), 1_000_000),
});

export async function loadDatasets() {
  // Load every required CSV in parallel.
  const [
    climateCleaned,
    populationCleaned,
    countryComparison,
    climateAggregates,
    populationTrend,
    regionalImpact,
  ] = await Promise.all([
    d3.csv("./data/cleaned/climate_extreme_weather_cleaned.csv"),
    d3.csv("./data/cleaned/world_population_cleaned.csv", parsePopulationRow),
    d3.csv("./data/derived/country_comparison_population_climate.csv", parseCountryComparisonRow),
    d3.csv("./data/derived/climate_country_aggregates.csv", parseClimateAggregateRow),
    d3.csv("./data/derived/global_population_trend.csv", parseTrendRow),
    d3.csv("./data/derived/regional_impact_summary.csv", parseRegionalRow),
  ]);

  const cleanCountryComparison = countryComparison
    .filter(
      (d) =>
        d.country &&
        d.populationMillions != null &&
        d.affectedMillions != null &&
        d.extremeEvents != null
    )
    .sort((a, b) => d3.descending(a.populationMillions, b.populationMillions));

  // Climate cleaned file is retained for extensibility in future narrative sections.
  const cleanClimateRows = climateCleaned.map((row) => ({
    country: row.country?.trim(),
    region: row.region?.trim(),
    year: toNumber(row.year),
    temperatureChangeC: toNumber(row.temperature_change_c),
    co2EmissionsMt: toNumber(row.co2_emissions_mt),
    affectedRaw: toNumber(row.population_affected_m),
    affectedMillions: safeDivide(toNumber(row.population_affected_m), 1_000),
  }));

  return {
    countryComparison: cleanCountryComparison,
    climateAggregates,
    populationCleaned,
    regionalImpact,
    populationTrend,
    climateCleaned: cleanClimateRows,
  };
}
