import './app.css'

document.querySelector('#app').innerHTML = `
  <main class="workspace">
    <section class="hero">
      <p class="eyebrow">windylib workspace</p>
      <h1>src / lib / storybook</h1>
      <p class="summary">
        Root app, ESM library package, and React Storybook debugger are now split into independent units.
      </p>
    </section>
    <section class="grid">
      <article class="card">
        <h2>src</h2>
        <p>Root Vite app. Keep demos or docs that belong to the application itself here.</p>
        <pre>pnpm dev</pre>
      </article>
      <article class="card">
        <h2>lib</h2>
        <p>deck.gl + luma.gl shader layer package, exported as ESM.</p>
        <pre>pnpm build:lib</pre>
      </article>
      <article class="card">
        <h2>storybook</h2>
        <p>React-based GLSL debugger for MapLibre stories, consuming the lib package.</p>
        <pre>pnpm storybook</pre>
      </article>
    </section>
  </main>
`
