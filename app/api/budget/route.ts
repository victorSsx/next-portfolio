import { NextResponse } from "next/server";

export const runtime = "nodejs";

type BudgetPayload = {
  channel?: string;
  message?: string;
  onceTotal?: number;
  monthlyTotal?: number;
};

const channelLabels: Record<string, string> = {
  workana: "Cliente Workana",
  upwork: "Cliente Upwork",
  direto: "Cliente direto",
};

export async function POST(request: Request) {
  let payload: BudgetPayload;

  try {
    payload = (await request.json()) as BudgetPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BUDGET_TO_EMAIL || "contato@dunkarley.dev";
  const from = process.env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>";
  const channel = payload.channel || "direto";
  const subject = `Novo orçamento - ${channelLabels[channel] || channel}`;

  if (!apiKey) {
    return NextResponse.json({ emailSent: false, reason: "RESEND_API_KEY not configured" }, { status: 202 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: [
        payload.message,
        "",
        "---",
        `Origem: ${channelLabels[channel] || channel}`,
        `Total único: R$ ${payload.onceTotal || 0}`,
        `Mensal: R$ ${payload.monthlyTotal || 0}`,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: "Email provider failed", details: errorText }, { status: 502 });
  }

  return NextResponse.json({ emailSent: true });
}
