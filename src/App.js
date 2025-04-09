"use client"

import { useState, useEffect } from "react"
import BarChart from "./BarChart"
import ScatterPlot from "./ScatterPlot"
import LineChart from "./LineChart"
import "./App.css"

function App() {
  const [data, setData] = useState([])
  const [timeSeriesData, setTimeSeriesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeChart, setActiveChart] = useState("bar") // "bar", "scatter", or "line"

  useEffect(() => {
    // Load and parse the CSV data
    const fetchData = async () => {
      try {
        const response = await fetch("/data.csv")
        const csvText = await response.text()

        // Parse CSV manually to keep dependencies minimal
        const lines = csvText.split("\n")
        const headers = lines[0].split(",")

        // Find the indices of the columns we need
        const locationIndex = headers.indexOf("location")
        const dateIndex = headers.indexOf("date")
        const totalCasesIndex = headers.indexOf("total_cases")
        const totalDeathsIndex = headers.indexOf("total_deaths")
        const newCasesIndex = headers.indexOf("new_cases")
        const newCasesSmoothedIndex = headers.indexOf("new_cases_smoothed")

        // Process the data for bar chart and scatter plot (latest data per country)
        const countryData = {}
        const timeSeriesRows = []

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i]) continue

          const values = lines[i].split(",")
          const location = values[locationIndex]
          const date = values[dateIndex]
          const totalCases = Number.parseFloat(values[totalCasesIndex]) || 0
          const totalDeaths = Number.parseFloat(values[totalDeathsIndex]) || 0
          const newCases = Number.parseFloat(values[newCasesIndex]) || 0
          const newCasesSmoothed = Number.parseFloat(values[newCasesSmoothedIndex]) || 0

          // Store time series data for line chart
          if (location && date) {
            timeSeriesRows.push({
              location,
              date,
              newCases,
              newCasesSmoothed,
              totalCases,
              totalDeaths,
            })
          }

          // Only keep the latest data for each country for bar/scatter
          if (!countryData[location] || date > countryData[location].date) {
            countryData[location] = {
              location,
              date,
              totalCases,
              totalDeaths,
            }
          }
        }

        // Convert to array and filter out countries with missing data
        const processedData = Object.values(countryData)
          .filter((d) => d.totalCases > 0 && d.totalDeaths > 0) // Filter out countries with 0 cases or deaths
          .sort((a, b) => b.totalCases - a.totalCases) // Sort by total cases
          .slice(0, 20) // Take top 20 countries

        // Filter time series data to include only countries in the top 20
        const topCountries = processedData.map((d) => d.location)
        const filteredTimeSeriesData = timeSeriesRows
          .filter((d) => topCountries.includes(d.location))
          // Only include data points with valid dates and from the last year
          .filter((d) => {
            const dataDate = new Date(d.date)
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
            return dataDate instanceof Date && !isNaN(dataDate) && dataDate > oneYearAgo
          })

        setData(processedData)
        setTimeSeriesData(filteredTimeSeriesData)
        setLoading(false)
      } catch (err) {
        console.error("Error loading or parsing CSV:", err)
        setError("Failed to load data")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="loading">Loading data...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="App">
      <header className="App-header">
        <h1>COVID-19 Data Visualization</h1>
        <div className="chart-toggle">
          <button className={activeChart === "bar" ? "active" : ""} onClick={() => setActiveChart("bar")}>
            Bar Chart
          </button>
          <button className={activeChart === "scatter" ? "active" : ""} onClick={() => setActiveChart("scatter")}>
            Scatter Plot
          </button>
          <button className={activeChart === "line" ? "active" : ""} onClick={() => setActiveChart("line")}>
            Line Chart
          </button>
        </div>
      </header>
      <main>
        {data.length > 0 ? (
          <>
            {activeChart === "bar" && (
              <div>
                <h2>Total Cases by Country</h2>
                <BarChart data={data} />
              </div>
            )}
            {activeChart === "scatter" && (
              <div>
                <h2>Cases vs Deaths Correlation</h2>
                <ScatterPlot data={data} />
              </div>
            )}
            {activeChart === "line" && (
              <div>
                <h2>New Cases Trend Over Time</h2>
                <LineChart data={timeSeriesData} />
              </div>
            )}
          </>
        ) : (
          <p>No data available</p>
        )}
      </main>
    </div>
  )
}

export default App
