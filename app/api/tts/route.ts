// Voz neural (humana) via ElevenLabs. Se ELEVENLABS_API_KEY não estiver
// configurada, responde 503 e o cliente cai de volta na voz do navegador.
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // troque via ELEVENLABS_VOICE_ID (escolha uma voz PT-BR)
const DEFAULT_MODEL_ID = "eleven_turbo_v2_5"; // multilíngue, baixa latência

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return new Response(null, { status: 503 });

  let text = "";
  try {
    const body = (await req.json()) as { text?: string };
    text = (body.text ?? "").toString().trim().slice(0, 800); // limita p/ proteger a cota
  } catch {
    return new Response("bad request", { status: 400 });
  }
  if (!text) return new Response(null, { status: 204 });

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true },
      }),
    });
    if (!r.ok) return new Response(null, { status: 502 });
    const audio = await r.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: { "content-type": "audio/mpeg", "cache-control": "no-store" },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
