import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { createRateLimiter, getIp } from "@/lib/ratelimit"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const checkRateLimit = createRateLimiter(10, 60, "chapter_theory")

const RICH_CONTENT_RULES = `Use LaTeX for all maths: inline $x^2$, display $$\\frac{a}{b}$$. Embed inline SVG (single quotes in attributes, dark stroke='#1e293b') for any diagrams or visual content. Use GitHub-flavoured markdown: headings, bold, bullet lists, numbered steps.`

export async function POST(req: Request) {
  const ip = getIp(req)
  const limited = await checkRateLimit(ip)
  if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const { exam, yearLevel, chapter } = await req.json()
  if (!exam || !chapter) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are a world-class textbook author writing for students preparing for the ${exam} at ${yearLevel || "appropriate"} level.

Write a clear, engaging textbook chapter on: **${chapter}**

Structure it as:
## Overview
(2-3 sentences explaining what this topic is and why it matters for ${exam})

## Key Concepts
(bullet list of 4-6 core ideas, each explained in 1-2 sentences)

## Theory
(Main explanation, 300-500 words. Work through the ideas step by step. Include formulas, rules, and any important terminology. Use examples woven into the explanations.)

## Key Formulas & Rules
(if applicable — present the most important formulas/rules in a summary box using markdown blockquote >)

## Summary
(3-4 bullet points: the most important takeaways)

${RICH_CONTENT_RULES}

Write in a direct, encouraging tone — like a great teacher, not a dry textbook. Total length: 400-700 words.`,
    }],
  })

  const markdown = msg.content[0].type === "text" ? msg.content[0].text : ""
  return NextResponse.json({ markdown })
}
