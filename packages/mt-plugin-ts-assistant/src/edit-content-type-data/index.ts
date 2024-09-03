import { mount, unmount } from "svelte";
import Editor from "./Editor.svelte";

const iconMap: WeakMap<HTMLElement, HTMLDivElement> = new WeakMap();

const init = () => {
  document.body.addEventListener(
    "focus",
    (event) => {
      const target = event.target as HTMLTextAreaElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        return;
      }
      if (target.closest(".chat-container")) {
        return;
      }

      let icon = iconMap.get(target);
      if (icon) {
        icon.style.display = "block";
      } else {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = `
          position: relative;
        `;

        icon = document.createElement("div");
        icon.style.cssText = `
          position: absolute;
          top: ${target.tagName === "INPUT" ? "8px" : "4px"};
          right: ${target.tagName === "INPUT" ? "8px" : "4px"};
          width: 16px;
          height: 16px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23666' d='M8 1.2c-2.2 0-4 1.8-4 4 0 1.3.6 2.5 1.6 3.2.3.3.6.6.7 1l.2 1.6h3l.2-1.6c.1-.4.4-.7.7-1 1-.8 1.6-2 1.6-3.2 0-2.2-1.8-4-4-4zm0 10.8c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z'/%3E%3C/svg%3E");
          background-size: cover;
          background-repeat: no-repeat;
          z-index: 1000;
          cursor: pointer;
        `;

        target.parentElement?.insertBefore(wrapper, target);
        wrapper.appendChild(icon);
        wrapper.appendChild(target);
        iconMap.set(target, icon);
        target.focus();
        target.addEventListener("blur", () => {
          setTimeout(() => {
            if (icon) {
              icon.style.display = "none";
            }
          }, 300);
        });

        let editor: any;
        icon.addEventListener(
          "click",
          () => {
            editor ??= mount(Editor, {
              target: wrapper,
              props: {
                value:
                  target.selectionStart !== target.selectionEnd
                    ? target.value.substring(
                        target.selectionStart,
                        target.selectionEnd
                      )
                    : target.value,
                onChange: (value) => {
                  if (target.selectionStart !== target.selectionEnd) {
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    target.value =
                      target.value.substring(0, start) +
                      value +
                      target.value.substring(end);
                  } else {
                    target.value = value;
                  }

                  unmount(editor);
                  editor = undefined;
                },
              },
            });
          },
          { capture: true }
        );
      }
    },
    { capture: true }
  );
};

export default init;
