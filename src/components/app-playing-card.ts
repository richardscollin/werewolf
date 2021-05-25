import { html } from "../scripts/utils";

export class AppPlayingCard extends HTMLElement {
  constructor() {
    super();
    let t = document.createElement("template");
    t.innerHTML = html`<style>
        .playing-card {
          --card-width: 200px;
          font-size: 14px;
          display: flex;
          flex-direction: column;
          width: var(--card-width);
          height: calc(var(--card-width) * (3.5 / 2.5));
          background-image: url("/images/card-texture.png");
          background-size: cover;
          border-radius: 7px;
          box-shadow: 2px 2px 7px 4px rgba(0, 0, 0, 0.5);
          color: white;
        }
        .playing-card__title-bar {
          display: flex;
          background-color: var(--card-color);
          align-items: baseline;
          margin: 0.5rem 1rem;
          padding: 0.5rem 1rem;
          font-weight: bold;
          letter-spacing: 0.013em;
          border: 4px outset rgba(0, 0, 0, 0.6);
        }

        .playing-card__title {
          text-transform: uppercase;
        }

        .playing-card__value {
          margin-left: auto;
        }

        .playing-card__img {
          border: 4px outset rgba(0, 0, 0, 0.6);
          background-color: var(--card-color);
          border-radius: 7px;
          height: 50%;
          margin: 1rem;
          display: grid;
          place-items: center;
        }

        .playing-card__description {
          line-height: 1.1;
          background-color: var(--card-color);
          height: 26%;
          margin: 1em;
          margin-top: auto;
          font-size: 18px;
          padding: 1rem;
          border-radius: 7px;
          border: 4px outset rgba(0, 0, 0, 0.6);
        }
      </style>
      <div class="playing-card">
        <div class="playing-card__title-bar">
          <span class="playing-card__title"></span>
          <div class="playing-card__value">-1</div>
        </div>
        <div class="playing-card__img">
          <svg height="100%" viewBox="0 0 100 100">
            <use href="/svg/werewolf-icons.svg#seer"></use>
          </svg>
        </div>
        <div class="playing-card__description"></div>
      </div>`;
    this.attachShadow({ mode: "open" }).appendChild(t.content.cloneNode(true));
  }

  connectedCallback() {
    console.log("playing card connected");
  }

  static get observedAttributes() {
    return ["data-icon", "data-description"];
  }

  attributeChangedCallback(attrName: string, oldVal: string, newVal: string) {
    console.log("playing card updated");
    const root = this.shadowRoot!;
    switch (attrName) {
      case "data-icon":
        const href = `/svg/werewolf-icons.svg#${newVal}`;
        (
          root.querySelector(".playing-card__title") as HTMLSpanElement
        ).innerText = newVal;
        root.querySelector("use")?.setAttribute("href", href);
        break;
      case "data-description":
        (
          root.querySelector(".playing-card__description") as HTMLElement
        ).innerText = newVal;
        break;
    }
  }
}
