import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface ExportData {
  metrics?: any
  trends?: any[]
  platforms?: any[]
  competitors?: any[]
  clusters?: any[]
}

export async function exportToCSV(data: ExportData, filename: string) {
  const workbook = XLSX.utils.book_new()

  // Metrics sheet
  if (data.metrics) {
    const metricsData = Object.entries(data.metrics).map(([key, value]) => ({
      Metric: formatMetricName(key),
      Value: value
    }))
    const metricsSheet = XLSX.utils.json_to_sheet(metricsData)
    XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics')
  }

  // Trends sheet
  if (data.trends && data.trends.length > 0) {
    const trendsSheet = XLSX.utils.json_to_sheet(data.trends)
    XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends')
  }

  // Platforms sheet
  if (data.platforms && data.platforms.length > 0) {
    const platformsSheet = XLSX.utils.json_to_sheet(data.platforms)
    XLSX.utils.book_append_sheet(workbook, platformsSheet, 'Platforms')
  }

  // Competitors sheet
  if (data.competitors && data.competitors.length > 0) {
    const competitorsSheet = XLSX.utils.json_to_sheet(data.competitors)
    XLSX.utils.book_append_sheet(workbook, competitorsSheet, 'Competitors')
  }

  // Clusters sheet
  if (data.clusters && data.clusters.length > 0) {
    const clustersSheet = XLSX.utils.json_to_sheet(data.clusters)
    XLSX.utils.book_append_sheet(workbook, clustersSheet, 'Prompt Clusters')
  }

  // Download the file
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export async function exportToPDF(
  data: ExportData,
  filename: string,
  chartRefs: { [key: string]: React.RefObject<HTMLDivElement> }
) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20

  // Title
  pdf.setFontSize(20)
  pdf.text('AEO Brand Monitoring Report', 20, yPosition)
  yPosition += 20

  // Date
  pdf.setFontSize(12)
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition)
  yPosition += 20

  // Metrics Summary
  if (data.metrics) {
    pdf.setFontSize(16)
    pdf.text('Key Metrics', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    Object.entries(data.metrics).forEach(([key, value]) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.text(`${formatMetricName(key)}: ${value}`, 20, yPosition)
      yPosition += 6
    })
    yPosition += 10
  }

  // Add charts as images
  for (const [chartName, chartRef] of Object.entries(chartRefs)) {
    if (chartRef.current && yPosition < pageHeight - 100) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = pageWidth - 40
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(14)
        pdf.text(formatChartName(chartName), 20, yPosition)
        yPosition += 10

        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
        yPosition += imgHeight + 20
      } catch (error) {
        console.error(`Failed to capture chart ${chartName}:`, error)
      }
    }
  }

  // Data tables
  if (data.platforms && data.platforms.length > 0) {
    if (yPosition > pageHeight - 50) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(14)
    pdf.text('Platform Performance', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    data.platforms.forEach(platform => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.text(
        `${platform.name}: ${platform.mentions} mentions, ${platform.citations || 0} citations`,
        20,
        yPosition
      )
      yPosition += 6
    })
  }

  pdf.save(`${filename}.pdf`)
}

function formatMetricName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function formatChartName(chartName: string): string {
  return chartName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}