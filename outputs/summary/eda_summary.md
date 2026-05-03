# Climate + Population EDA Summary

## 1) Safe cleaning and transformation completed

- Original files were **not overwritten**.
- Cleaned datasets were saved to `outputs/cleaned/`.
- Standardization done:
  - column names normalized (snake_case)
  - numeric parsing enforced for all metric columns
  - whitespace cleaned on categorical fields
  - duplicates removed safely using unique identifiers (`country` for population, `record_id` for climate)
  - two helper features added in population data:
    - `population_change_2010_2022`
    - `population_change_pct_2010_2022`

### Data quality checks

| dataset | rows | columns | missing_values | duplicate_rows |
| --- | --- | --- | --- | --- |
| world_population_cleaned | 234 | 19 | 0 | 0 |
| climate_extreme_weather_cleaned | 5000 | 17 | 0 | 0 |

## 2) Step 1 - Basic understanding (univariate)

### Population dataset

- Population distribution is highly right-skewed.
  - Skewness: **9.15**
- Density distribution is also strongly right-skewed.
  - Skewness: **8.95**
- Growth rate distribution is slightly left-skewed in this sample.
  - Skewness: **-1.10**

Top 3 population outliers by IQR method:

| country | population_2022 |
| --- | --- |
| China | 1425887337 |
| India | 1417173173 |
| United States | 338289857 |

Top 3 density outliers by IQR method:

| country | density_per_km2 |
| --- | --- |
| Macau | 23172.267 |
| Monaco | 18234.500 |
| Singapore | 8416.463 |

### Climate dataset

Top 3 countries by total extreme events:

| country | extreme_events |
| --- | --- |
| Germany | 542 |
| Brazil | 520 |
| Australia | 502 |

Top 3 countries by total emissions:

| country | total_co2_emissions_mt |
| --- | --- |
| Germany | 1683782 |
| Brazil | 1650847 |
| United States | 1611988 |

Top 3 countries by total people affected:

| country | total_population_affected_m |
| --- | --- |
| Germany | 80110.200 |
| Brazil | 78494.200 |
| United States | 75886.500 |

Temperature change distribution:

- Mean temperature change: **1.49 C**
- Median temperature change: **1.48 C**
- IQR outlier count: **0** records

Regional concentration (events and affected people):

| region | extreme_events | total_population_affected_m |
| --- | --- | --- |
| Asia | 1453 | 221875.200 |
| Europe | 1041 | 155668.100 |
| North America | 998 | 149729.200 |
| South America | 520 | 78494.200 |
| Oceania | 502 | 73272.300 |
| Africa | 486 | 71846.800 |

## 3) Step 2 - Bivariate analysis (country-level merged view)

Correlations (Pearson):

| relationship | pearson_correlation |
| --- | --- |
| population_2022 vs total_population_affected_m | -0.174 |
| density_per_km2 vs extreme_events | -0.316 |
| total_co2_emissions_mt vs population_2022 | -0.494 |

Interpretation:

- Population size vs affected people: weak/negative relationship in this dataset.
- Population density vs extreme events: weak/negative relationship.
- Emissions vs population size: weak/negative relationship.

These weak patterns suggest event impacts are not explained by population-only variables in this sample.

## 4) Step 3 - Time-based trends

- Climate dataset year values present: **2026**
- Since only one year exists, line trends for climate over time are **not statistically valid**.
- Population trend over historical years (1970-2022) was created and saved as a line chart.

## 5) Slide-ready chart recommendation (2-3 charts)

Use these 3 files directly in slides:

1. `outputs/charts/slide_chart_1_top10_population.png`
2. `outputs/charts/slide_chart_2_extreme_events.png`
3. `outputs/charts/slide_chart_3_population_vs_affected.png`

Additional charts are available in `outputs/charts/` for backup analysis.
