const styles = String.raw`
two-sum-demo {
  display: block;
  width: min(100%, 1160px);
  max-width: 1160px;
  margin: 0.9rem 0 1.55rem;
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
  gap: 0.8rem;
  margin-bottom: 0.65rem;
}
.two-sum-demo__toolbar > strong {
  color: var(--gray);
  font-size: 0.8rem;
  font-weight: 620;
}
.two-sum-demo__controls { gap: 0.35rem; }
.two-sum-demo__controls button {
  min-height: 32px;
  padding: 0 0.68rem;
  border: 1px solid var(--lightgray);
  border-radius: 9px;
  background: transparent;
  color: var(--darkgray);
  cursor: pointer;
}
.two-sum-demo__controls button:first-child {
  border-color: var(--secondary);
  color: var(--secondary);
}

.two-sum-demo__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) 44px minmax(220px, 0.72fr);
  gap: 10px;
  min-height: 150px;
  align-items: stretch;
}
.two-sum-demo__array-panel,
.two-sum-demo__hash-panel {
  min-width: 0;
  min-height: 150px;
  padding: 0.75rem;
  border: 1px solid var(--lightgray);
  border-radius: 10px;
  background: transparent;
}
.two-sum-demo__stage {
  position: relative;
  min-height: 5.25rem;
  padding-top: 2rem;
  overflow-x: auto;
}
.two-sum-demo__array {
  flex-wrap: nowrap;
  gap: 0.5rem;
  width: max-content;
}
.two-sum-demo__cell {
  display: grid;
  width: 3.8rem;
  min-height: 3.55rem;
  place-items: center;
  gap: 0.04rem;
  flex: 0 0 auto;
  border: 1px solid var(--lightgray);
  border-radius: 9px;
  background: color-mix(in srgb, var(--light) 98%, var(--secondary) 2%);
  transition: transform 240ms ease, border-color 240ms ease, box-shadow 240ms ease;
}
.two-sum-demo__cell > span { color: var(--gray); font-size: 0.66rem; }
.two-sum-demo__cell > strong { color: var(--dark); font-size: 1.08rem; }
.two-sum-demo__cell.is-current {
  transform: translateY(-3px);
  border-color: var(--secondary);
}
.two-sum-demo__cell.is-answer {
  box-shadow: inset 0 0 0 2px var(--secondary);
}

.two-sum-demo__pointer {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  width: 3.8rem;
  justify-items: center;
  color: var(--secondary);
  opacity: 0;
  transition: transform 480ms cubic-bezier(.2,.8,.2,1), opacity 160ms ease;
  will-change: transform;
}
.two-sum-demo__pointer.is-visible { opacity: 1; }
.two-sum-demo__pointer span {
  display: grid;
  width: 1.55rem;
  height: 1.55rem;
  place-items: center;
  border-radius: 50%;
  background: var(--secondary);
  color: var(--light);
  font-weight: 800;
}
.two-sum-demo__pointer b { margin-top: -0.2rem; }

.two-sum-demo__calc {
  min-height: 1.55rem;
  flex-wrap: wrap;
  gap: 0.38rem;
  margin-top: 0.3rem;
  color: var(--gray);
  font-size: 0.82rem;
}
.two-sum-demo__calc strong { color: var(--dark); }

.two-sum-demo__probe {
  justify-content: center;
  gap: 0.2rem;
  color: var(--secondary);
  opacity: 0.18;
  transition: opacity 220ms ease, transform 220ms ease;
}
.two-sum-demo__probe.is-active {
  opacity: 1;
  transform: translateX(2px);
}
.two-sum-demo__probe i {
  width: 24px;
  height: 1px;
  background: var(--secondary);
  transform: scaleX(.35);
  transform-origin: left;
  transition: transform 320ms ease;
}
.two-sum-demo__probe.is-active i { transform: scaleX(1); }
.two-sum-demo__probe b { font-size: 0.9rem; }

.two-sum-demo__hash-panel > strong {
  display: block;
  margin-bottom: 0.45rem;
  color: var(--dark);
  font-size: 0.88rem;
}
.two-sum-demo__hash { display: grid; gap: 0.3rem; }
.two-sum-demo__hash-row {
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.4rem 0.1rem;
  border-bottom: 1px solid var(--lightgray);
  transition: transform 220ms ease, border-color 220ms ease, background 220ms ease;
}
.two-sum-demo__hash-row.is-new {
  transform: translateX(3px);
  border-color: var(--secondary);
}
.two-sum-demo__hash-row.is-match {
  transform: translateX(-2px);
  border-color: var(--secondary);
  background: var(--highlight);
}
.two-sum-demo__hash-row span { color: var(--gray); font-size: 0.75rem; }
.two-sum-demo__empty {
  padding: 0.55rem 0;
  color: var(--gray);
  text-align: center;
}
.two-sum-demo__status {
  margin-top: 0.4rem;
  color: var(--gray);
  font-size: 0.8rem;
}
.two-sum-demo__status:empty { display: none; }

@media (max-width: 980px) {
  .two-sum-demo__workspace {
    grid-template-columns: minmax(0, 1fr) 36px minmax(190px, 0.7fr);
  }
}
@media (max-width: 760px) {
  .two-sum-demo__workspace { grid-template-columns: 1fr; }
  .two-sum-demo__probe {
    min-height: 26px;
    justify-content: flex-start;
    transform: rotate(90deg);
    transform-origin: center;
  }
  .two-sum-demo__probe.is-active { transform: rotate(90deg) translateX(2px); }
}
@media (max-width: 600px) {
  .two-sum-demo__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .two-sum-demo__controls { width: 100%; }
  .two-sum-demo__controls button { flex: 1; }
}
`

export default styles
