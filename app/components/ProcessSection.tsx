export function ProcessSection() {
  return (
    <section className="section process">
      <div className="process__header" data-animate>
        <p className="eyebrow">Como eu construo</p>
        <h2>Estratégia, interface e entrega em uma experiência só.</h2>
      </div>
      <div className="process__steps">
        <article data-animate style={{ "--animate-delay": "0ms" } as React.CSSProperties}>
          <span>01</span>
          <h3>Diagnóstico</h3>
          <p>Entendo o objetivo e separo o que é essencial do que pode ser opcional.</p>
        </article>
        <article data-animate style={{ "--animate-delay": "120ms" } as React.CSSProperties}>
          <span>02</span>
          <h3>Construção</h3>
          <p>Transformo a solução em interface responsiva, clara e com boa performance.</p>
        </article>
        <article data-animate style={{ "--animate-delay": "240ms" } as React.CSSProperties}>
          <span>03</span>
          <h3>Apresentação</h3>
          <p>Organizo o resultado para o cliente entender o valor e aprovar com segurança.</p>
        </article>
      </div>
    </section>
  );
}
