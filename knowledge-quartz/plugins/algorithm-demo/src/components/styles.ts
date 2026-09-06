const styles = String.raw`
two-sum-demo {
  display: block;
  margin: 1.2rem 0 2rem;
}

.two-sum-demo__toolbar,
.two-sum-demo__controls,
.two-sum-demo__array,
.two-sum-demo__calc,
.two-sum-demo__probe,
.two-sum-demo__hash-row {
  display: flex;
  align-items: center;
}

.two-sum-demo__toolbar {
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}
.two-sum-demo__toolbar > strong { color: var(--dark); font-size: 0.88rem; }
.two-sum-demo__controls { gap: 0.4rem; }
.two-sum-demo__controls button {
  min-height: 34px;
  padding: 0 0.72rem;
  border: 1px solid var(--lightgray);
  border-radius: 10px;
  background: transparent;
  color: var(--darkgray);
  cursor: pointer;
}
.two-sum-demo__controls button:first-child { border-color: var(--secondary); color: var(--secondary); }

.two-sum-demo__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(4rem, 0.16fr) minmax(13rem, 0.6fr);
  gap: 0.9rem;
  align-items: stretch;
}
.two-sum-demo__array-panel,
.two-sum-demo__hash-panel {
  min-width: 0;
  padding: 0.9rem;
  border: 1px solid var(--lightgray);
  border-radius: 12px;
  background: color-mix(in srgb, var(--light) 97%, var(--secondary) 3%);
}
.two-sum-demo__stage {
  position: relative;
  min-height: 6.8rem;
  padding-top: 2.35rem;
  overflow-x: auto;
}
.two-sum-demo__array { flex-wrap: nowrap; gap: 0.55rem; width: max-content; }
.two-sum-demo__cell {
  display: grid;
  width: 4.1rem;
  min-height: 4.1rem;
  place-items: center;
  gap: 0.08rem;
  flex: 0 0 auto;
  border: 1px solid var(--lightgray);
  border-radius: 10px;
  background: transparent;
  transition: transform 240ms ease, border-color 240ms ease, box-shadow 240ms ease;
}
.two-sum-demo__cell > span { color: var(--gray); font-size: 0.68rem; }
.two-sum-demo__cell > strong { color: var(--dark); font-size: 1.12rem; }
.two-sum-demo__cell.is-current { transform: translateY(-3px); border-color: var(--secondary); }
.two-sum-demo__cell.is-answer { box-shadow: inset 0 0 0 2px var(--secondary); }

.two-sum-demo__pointer {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  width: 4.1rem;
  justify-items: center;
  color: var(--secondary);
  opacity: 0;
  transition: transform 480ms cubic-bezier(.2,.8,.2,1), opacity 160ms ease;
  will-change: transform;
}
.two-sum-demo__pointer.is-visible { opacity: 1; }
.two-sum-demo__pointer span {
  display: grid;
  width: 1.6rem;
  height: 1.6rem;
  place-items: center;
  border-radius: 50%;
  background: var(--secondary);
  color: var(--light);
  font-weight: 800;
}
.two-sum-demo__pointer b { margin-top: -0.2rem; }
.two-sum-demo__calc { flex-wrap: wrap; gap: 0.4rem; margin-top: 0.7rem; color: var(--gray); font-size: 0.86rem; }
.two-sum-demo__calc strong { color: var(--dark); }
.two-sum-demo__probe { justify-content: center; gap: 0.35rem; color: var(--secondary); opacity: 0.24; transition: opacity 220ms ease, transform 220ms ease; }
.two-sum-demo__probe.is-active { opacity: 1; transform: translateX(4px); }
.two-sum-demo__probe span { font-size: 0.72rem; white-space: nowrap; }
.two-sum-demo__probe i { width: 100%; height: 1px; background: var(--secondary); transform: scaleX(.3); transform-origin: left; transition: transform 320ms ease; }
.two-sum-demo__probe.is-active i { transform: scaleX(1); }
.two-sum-demo__hash-panel > strong { display: block; margin-bottom: 0.6rem; }
.two-sum-demo__hash { display: grid; gap: 0.42rem; }
.two-sum-demo__hash-row {
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0.62rem;
  border-bottom: 1px solid var(--lightgray);
  transition: transform 220ms ease, border-color 220ms ease, background 220ms ease;
}
.two-sum-demo__hash-row.is-new { transform: translateX(4px); border-color: var(--secondary); }
.two-sum-demo__hash-row.is-match { transform: translateX(-3px); border-color: var(--secondary); background: var(--highlight); }
.two-sum-demo__hash-row span { color: var(--gray); font-size: 0.78rem; }
.two-sum-demo__empty { padding: 0.65rem; color: var(--gray); text-align: center; }
.two-sum-demo__status { margin-top: 0.7rem; color: var(--darkgray); font-size: 0.84rem; }

@media (max-width: 900px) {
  .two-sum-demo__workspace { grid-template-columns: 1fr; }
  .two-sum-demo__probe { justify-content: flex-start; }
  .two-sum-demo__probe i { max-width: 7rem; }
}
@media (max-width: 600px) {
  .two-sum-demo__toolbar { align-items: flex-start; flex-direction: column; }
  .two-sum-demo__controls { width: 100%; }
  .two-sum-demo__controls button { flex: 1; }
}
`

export default styles
