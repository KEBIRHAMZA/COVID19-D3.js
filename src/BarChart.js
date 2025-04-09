"use client"

import { useRef, useEffect } from "react"
import * as d3 from "d3"

const BarChart = ({ data }) => {
  const svgRef = useRef()

  useEffect(() => {
    if (!data || data.length === 0) return

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up dimensions
    const margin = { top: 30, right: 30, bottom: 70, left: 100 }
    const width = 800 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // X axis
    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(data.map((d) => d.location))
      .padding(0.2)

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")

    // Find the maximum value for the y-axis
    const maxCases = d3.max(data, (d) => d.totalCases)

    // Y axis
    const y = d3.scaleLinear().domain([0, maxCases]).range([height, 0])

    svg.append("g").call(
      d3
        .axisLeft(y)
        .ticks(10)
        .tickFormat((d) => {
          if (d >= 1000000) return `${d / 1000000}M`
          if (d >= 1000) return `${d / 1000}K`
          return d
        }),
    )

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Total COVID-19 Cases by Country")

    // Add bars
    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.location))
      .attr("y", (d) => y(d.totalCases))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.totalCases))
      .attr("fill", "#69b3a2")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "#2a9d8f")

        // Add tooltip
        svg
          .append("text")
          .attr("class", "tooltip")
          .attr("x", x(d.location) + x.bandwidth() / 2)
          .attr("y", y(d.totalCases) - 10)
          .attr("text-anchor", "middle")
          .text(`${d.totalCases.toLocaleString()}`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "#69b3a2")
        svg.selectAll(".tooltip").remove()
      })
  }, [data])

  return (
    <div className="chart-container">
      <svg ref={svgRef}></svg>
    </div>
  )
}

export default BarChart
