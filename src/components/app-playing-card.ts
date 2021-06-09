import { html } from "../scripts/utils";

export class AppPlayingCard extends HTMLElement {
  constructor() {
    super();
    let t = document.createElement("template");
    t.innerHTML = html`<style>
        .playing-card {
          --card-width: 300px;
          --card-color: rgba(0, 0, 0, .5);
          font-size: 14px;
          display: flex;
          flex-direction: column;
          width: var(--card-width);
          height: calc(var(--card-width) * (3.5 / 2.5));
          border-radius: 7px;
          box-shadow: 2px 2px 7px 4px rgba(0, 0, 0, 0.5);
        }

        .playing-card__villager-team {
          --card-color: rgba(0, 0, 255, .5);
        }

        .playing-card__werewolf-team {
          --card-color: rgba(255, 0, 0, .5);
        }

        .playing-card__title-bar {
          display: flex;
          align-items: baseline;
          margin: 0.5rem 1rem;
          font-weight: bold;
          font-size: 1.3rem;
        }

        .playing-card__title {
          text-transform: uppercase;
        }

        .playing-card__img {
          border: 4px outset rgba(0, 0, 0, 0.6);
          background-color: rgba(0, 0, 0, .5);
          border-radius: 7px;
          height: 50%;
          margin: .25rem 1rem;
          display: grid;
          place-items: center;
        }

        .playing-card__description {
          line-height: 1.1;
          height: 26%;
          margin: 1em;
          margin-top: auto;
          font-size: 18px;
        }
      </style>
      <div class="playing-card">
        <div class="playing-card__title-bar">
          <span class="playing-card__title"></span>
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
    //console.log("playing card connected");
  }

  static get observedAttributes() {
    return ["data-icon", "data-description", "data-name", "data-team"];
  }

  attributeChangedCallback(attrName: string, oldVal: string, newVal: string) {
    //console.log("playing card updated");
    const root = this.shadowRoot!;
    switch (attrName) {
      case "data-icon":
        const href = `/svg/werewolf-icons.svg#${newVal}`;
        root.querySelector("use")?.setAttribute("href", href);
        break;
      case "data-description":
        (
          root.querySelector(".playing-card__description") as HTMLElement
        ).innerText = newVal;
        break;
      case "data-name":
        (
          root.querySelector(".playing-card__title") as HTMLSpanElement
        ).innerText = newVal;
        break;
      case "data-team":
        const classList = (
          root.querySelector(".playing-card") as HTMLElement
        ).classList;
        classList.toggle("playing-card__werewolf-team", newVal === "werewolf");
        classList.toggle("playing-card__villager-team", newVal === "villager");

        break;
    }
  }
}
