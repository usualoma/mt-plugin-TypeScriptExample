import { mount } from "svelte";
import Editor from "./Editor.svelte";

const init = async () => {
  const container = document.querySelector(".mt-secondaryPanel");
  if (!container) {
    return;
  }

  const editor = document.createElement("div");
  container.insertBefore(editor, container.firstChild);

  // content_data フォームまたは entry フォームから ID を取得
  const contentDataForm = document.getElementById(
    "edit-content-type-data-form"
  ) as HTMLFormElement;
  const entryForm = document.getElementById("entry_form") as HTMLFormElement;

  let screenId: string | undefined;

  if (contentDataForm) {
    const contentId =
      contentDataForm.querySelector<HTMLInputElement>(
        'input[name="id"]'
      )?.value;
    if (contentId) {
      screenId = `content-${contentId}`;
    }
  } else if (entryForm) {
    const entryId =
      entryForm.querySelector<HTMLInputElement>('input[name="id"]')?.value;
    if (entryId) {
      screenId = `entry-${entryId}`;
    }
  }

  if (!screenId) {
    return;
  }

  mount(Editor, {
    target: editor,
    props: {
      screenId,
    },
  });
};

export default init;
