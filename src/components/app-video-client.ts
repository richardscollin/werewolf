import mediasoupClient from "mediasoup-client";
import { html } from "../scripts/utils";

export class AppVideoClient extends HTMLElement {
  addVideoStream(mediaStream: MediaStreamTrack) {
    const video = document.createElement("video");
    video.setAttribute("autoplay", "true");
  }
  requestMedia() {}

  constructor() {
    super();
    let t = document.createElement("template");
    t.innerHTML = html`<style>
        .root {
          width: 100%;
          height: 100%;
          border: 1px solid black;
          box-sizing: border-box;
        }
      </style>
      <div class="root">
        <div class="video-grid">
          <video style="background: black;"></video>
          <video style="background: red;"></video>
        </div>
      </div>`;
    this.attachShadow({ mode: "open" }).appendChild(t.content.cloneNode(true));
  }
}
