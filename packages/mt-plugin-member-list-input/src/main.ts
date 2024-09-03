const screenId = document.querySelector("html")?.dataset.screenId;
if (screenId === "edit-content-type-data") {
  import("./edit-content-type-data").then((module) => {
    module.default();
  });
}
