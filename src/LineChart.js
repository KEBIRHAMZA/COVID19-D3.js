"use client"

import { useRef, useEffect, useState } from "react"
import * as d3 from "d3"

const LineChart = ({ data }) => {
  const svgRef = useRef()
  const [selectedCountries, setSelectedCountries] = useState([])
  const [availableCountries, setAvailableCountries] = useState([])

  useEffect(() => {
    if (!data || data.length === 0) return

    // Extract unique countries
    const countries = [...new Set(data.map((d) => d.location))].sort()
    setAvailableCountries(countries)

    // Initialize with top 5 countries by cases if no selection
    if (selectedCountries.length === 0) {
      const topCountries = [...data]
        .sort((a, b) => {
          const maxCasesA = Math.max(...data.filter((d) => d.location === a.location).map((d) => d.newCases || 0))
          const maxCasesB = Math.max(...data.filter((d) => d.location === b.location).map((d) => d.newCases || 0))
          return maxCasesB - maxCasesA
        })
        .slice(0, 5)
        .map((d) => d.location)

      // Get unique countries
      const uniqueTopCountries = [...new Set(topCountries)]
      setSelectedCountries(uniqueTopCountries)
    }
  }, [data])

  useEffect(() => {
    if (!data || data.length === 0 || selectedCountries.length === 0) return

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    // Filter data for selected countries
    const filteredData = data.filter((d) => selectedCountries.includes(d.location))

    // Group data by country
    const groupedData = d3.group(filteredData, (d) => d.location)

    // Set up dimensions
    const margin = { top: 30, right: 80, bottom: 60, left: 80 }
    const width = 800 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Add X axis
    const dates = [...new Set(filteredData.map((d) => d.date))].sort()
    const x = d3
      .scaleTime()
      .domain(d3.extent(dates, (d) => new Date(d)))
      .range([0, width])

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %Y")))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .text("Date")
      .style("font-size", "14px")

    // Add Y axis
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.newCasesSmoothed * 1.1) || 100])
      .range([height, 0])

    svg.append("g").call(
      d3.axisLeft(y).tickFormat((d) => {
        if (d >= 1000000) return `${d / 1000000}M`
        if (d >= 1000) return `${d / 1000}K`
        return d
      }),
    )

    // Add Y axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -60)
      .text("New Cases (7-day avg)")
      .style("font-size", "14px")

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("COVID-19: New Cases Trend Over Time")

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(selectedCountries)

    // Add the lines
    const line = d3
      .line()
      .defined((d) => !isNaN(d.newCasesSmoothed) && d.newCasesSmoothed !== null)
      .x((d) => x(new Date(d.date)))
      .y((d) => y(d.newCasesSmoothed || 0))
      .curve(d3.curveMonotoneX)

    // Add lines for each country
    groupedData.forEach((countryData, country) => {
      // Sort data by date
      countryData.sort((a, b) => new Date(a.date) - new Date(b.date))

      svg
        .append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", color(country))
        .attr("stroke-width", 2.5)
        .attr("d", line)
        .attr("class", "line")
        .on("mouseover", function () {
          d3.select(this).attr("stroke-width", 4)
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke-width", 2.5)
        })
    })

    // Add legend
    const legend = svg
      .selectAll(".legend")
      .data(selectedCountries)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0,${i * 20})`)

    legend
      .append("rect")
      .attr("x", width + 10)
      .attr("width", 15)
      .attr("height", 15)
      .style("fill", (d) => color(d))

    legend
      .append("text")
      .attr("x", width + 30)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text((d) => d)
  }, [data, selectedCountries])

  const handleCountryToggle = (country) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter((c) => c !== country))
    } else {
      setSelectedCountries([...selectedCountries, country])
    }
  }

  return (
    <div>
      <div className="country-selector">
        <p>Select countries to display (max 5):</p>
        <div className="country-checkboxes">
          {availableCountries.slice(0, 15).map((country) => (
            <label key={country} className="country-checkbox">
              <input
                type="checkbox"
                checked={selectedCountries.includes(country)}
                onChange={() => handleCountryToggle(country)}
                disabled={!selectedCountries.includes(country) && selectedCountries.length >= 5}
              />
              {country}
            </label>
          ))}
        </div>
      </div>
      <div className="chart-container">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  )
}

export default LineChart
