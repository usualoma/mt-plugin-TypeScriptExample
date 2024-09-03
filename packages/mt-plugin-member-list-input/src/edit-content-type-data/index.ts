import { mount } from "svelte";
import Editor from "./Editor.svelte";

const init = () => {
  document.querySelectorAll<HTMLLabelElement>("label").forEach((label) => {
    if (label.textContent?.trim() !== "メンバー一覧") {
      return;
    }
    const container: HTMLDivElement = label.parentElement as HTMLDivElement;
    const textarea: HTMLTextAreaElement | null =
      container?.querySelector<HTMLTextAreaElement>("textarea");
    if (!container || !textarea) {
      return;
    }
    textarea.style.display = "none";

    const editorElement = document.createElement("div");
    container.appendChild(editorElement);
    mount(Editor, {
      target: editorElement,
      props: {
        value: textarea.value,
        onChange: (value: string) => {
          textarea.value = value;
          textarea.dispatchEvent(new Event("change"));
        },
      },
    });
  });
};

export default init;
