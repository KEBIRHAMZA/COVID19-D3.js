"use client"

import { useRef, useEffect } from "react"
import * as d3 from "d3"

const ScatterPlot = ({ data }) => {
  const svgRef = useRef()

  useEffect(() => {
    if (!data || data.length === 0) return

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up dimensions
    const margin = { top: 30, right: 30, bottom: 60, left: 80 }
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
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.totalCases * 1.1)])
      .range([0, width])
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(x).tickFormat((d) => {
          if (d >= 1000000) return `${d / 1000000}M`
          if (d >= 1000) return `${d / 1000}K`
          return d
        }),
      )

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .text("Total Cases")
      .style("font-size", "14px")

    // Add Y axis
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.totalDeaths * 1.1)])
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
      .text("Total Deaths")
      .style("font-size", "14px")

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("COVID-19: Cases vs Deaths by Country")

    // Add dots
    svg
      .append("g")
      .selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.totalCases))
      .attr("cy", (d) => y(d.totalDeaths))
      .attr("r", 6)
      .style("fill", "#e76f51")
      .style("opacity", 0.7)
      .style("stroke", "white")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 8).style("fill", "#e63946").style("opacity", 1)

        // Add tooltip
        svg
          .append("text")
          .attr("class", "tooltip")
          .attr("x", x(d.totalCases) + 10)
          .attr("y", y(d.totalDeaths) - 10)
          .style("font-size", "12px")
          .text(`${d.location}: ${d.totalCases.toLocaleString()} cases, ${d.totalDeaths.toLocaleString()} deaths`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 6).style("fill", "#e76f51").style("opacity", 0.7)
        svg.selectAll(".tooltip").remove()
      })

    // Add a diagonal line representing the global case fatality rate (for reference)
    const avgDeathRate = d3.mean(data, (d) => d.totalDeaths / d.totalCases)
    if (!isNaN(avgDeathRate)) {
      const lineData = [
        { x: 0, y: 0 },
        { x: d3.max(data, (d) => d.totalCases), y: d3.max(data, (d) => d.totalCases) * avgDeathRate },
      ]

      const line = d3
        .line()
        .x((d) => x(d.x))
        .y((d) => y(d.y))

      svg
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,5")
        .attr("d", line)

      // Add text for the average death rate
      svg
        .append("text")
        .attr("x", x(lineData[1].x * 0.7))
        .attr("y", y(lineData[1].y * 0.7) - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#666")
        .text(`Avg. Death Rate: ${(avgDeathRate * 100).toFixed(2)}%`)
    }
  }, [data])

  return (
    <div className="chart-container">
      <svg ref={svgRef}></svg>
    </div>
  )
}

export default ScatterPlot
