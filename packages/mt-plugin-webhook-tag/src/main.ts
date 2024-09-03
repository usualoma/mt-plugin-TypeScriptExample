const screenId = document.querySelector("html")?.dataset.screenId ?? "";
if (/^(edit-content-type-data|edit-entry)$/.test(screenId)) {
  import("./edit-content-type-data").then((module) => {
    module.default();
  });
}
