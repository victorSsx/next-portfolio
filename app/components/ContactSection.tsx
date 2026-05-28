const WHATSAPP_URL = "https://wa.me/5521975990988";
const INSTAGRAM_URL = "https://www.instagram.com/__devictor";

export function ContactSection() {
  return (
    <section className="section contact" id="contato">
      <div data-animate>
        <p className="eyebrow">Contato</p>
        <h2>Seu projeto pode ser a próxima história de sucesso.</h2>
        <div className="hero__actions contact__actions">
          <a className="button button--primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            WhatsApp <span aria-hidden="true">-&gt;</span>
          </a>
          <a className="button button--ghost" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            Instagram <span aria-hidden="true">-&gt;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
