type ChildAnalytics = {
  child: { name: string; avatarEmoji: string }
  dailyUsage: { date: string; label: string; count: number }[]
  todayUsage: number
  totalQuestionsAllTime: number
  exams: { subject: string; score: number; total: number; pct: number; timeTaken: number | null; createdAt: string | Date }[]
  practiceBySubject: { subject: string; correct: number; total: number; pct: number }[]
  overallAccuracy: number | null
  totalPracticeQuestions: number
  totalExams: number
}

export async function downloadChildReport(analytics: ChildAnalytics) {
  const { jsPDF } = await import("jspdf")
  // @ts-ignore
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const navy = [0, 9, 54] as [number, number, number]
  const gold = [253, 200, 0] as [number, number, number]
  const grey = [100, 116, 139] as [number, number, number]

  // Header
  doc.setFillColor(...navy)
  doc.rect(0, 0, 210, 36, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("SelectEd", 14, 14)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Sharpen · Sit · Succeed", 14, 21)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(`${analytics.child.avatarEmoji} ${analytics.child.name} — Progress Report`, 14, 31)

  // Date
  doc.setTextColor(...grey)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`Generated: ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`, 210 - 14, 31, { align: "right" })

  // Summary stats row
  let y = 46
  const stats = [
    { label: "Questions today", value: String(analytics.todayUsage) },
    { label: "Total questions", value: String(analytics.totalQuestionsAllTime) },
    { label: "Practice accuracy", value: analytics.overallAccuracy !== null ? `${analytics.overallAccuracy}%` : "—" },
    { label: "Exams completed", value: String(analytics.totalExams) },
  ]
  const colW = (210 - 28) / stats.length
  stats.forEach((s, i) => {
    const x = 14 + i * colW
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, colW - 4, 22, 3, 3, "F")
    doc.setTextColor(...navy)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(s.value, x + (colW - 4) / 2, y + 12, { align: "center" })
    doc.setTextColor(...grey)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.text(s.label, x + (colW - 4) / 2, y + 19, { align: "center" })
  })
  y += 30

  // 7-day usage section
  if (analytics.dailyUsage.length > 0) {
    doc.setTextColor(...navy)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Questions — Last 7 Days", 14, y)
    y += 6
    const dayData = analytics.dailyUsage.map(d => [d.label, d.date, String(d.count)])
    autoTable(doc, {
      startY: y,
      head: [["Day", "Date", "Questions"]],
      body: dayData,
      theme: "striped",
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 2: { halign: "center" } },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Exam results section
  if (analytics.exams.length > 0) {
    doc.setTextColor(...navy)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Exam Results", 14, y)
    y += 6
    autoTable(doc, {
      startY: y,
      head: [["Date", "Subject", "Score", "%", "Time"]],
      body: analytics.exams.map(e => [
        new Date(e.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
        e.subject,
        `${e.score} / ${e.total}`,
        `${e.pct}%`,
        e.timeTaken ? `${Math.floor(e.timeTaken / 60)}m ${e.timeTaken % 60}s` : "—",
      ]),
      theme: "striped",
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center" } },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Practice by subject
  if (analytics.practiceBySubject.length > 0) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setTextColor(...navy)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Practice — Accuracy by Subject", 14, y)
    y += 6
    autoTable(doc, {
      startY: y,
      head: [["Subject", "Correct", "Total", "Accuracy"]],
      body: analytics.practiceBySubject.map(p => [p.subject, String(p.correct), String(p.total), `${p.pct}%`]),
      theme: "striped",
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" } },
      margin: { left: 14, right: 14 },
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...navy)
    doc.rect(0, 285, 210, 12, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text("selected-ed.vercel.app", 14, 292)
    doc.text(`Page ${i} of ${pageCount}`, 210 - 14, 292, { align: "right" })
  }

  doc.save(`${analytics.child.name.replace(/\s+/g, "-")}-SelectEd-Report.pdf`)
}
