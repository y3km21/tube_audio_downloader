let ipcRenderer;
if (!__DISABLE_ELECTRON__) {
  const electron = require("electron");
  ipcRenderer = electron.ipcRenderer;
}

import "./style/reset.scss";
import "./style/app.scss";

// Elm
const { Elm } = require("./Main.elm");

const app = Elm.Main.init({
  node: document.body.appendChild(document.createElement("div")),
  flags: null,
});

if (!__DISABLE_ELECTRON__) {
  /*
  ipcRenderer Receive
  */
  ipcRenderer.on("toRenderer", (event, arg) => {
    if (arg.method === "HomeDir") {
      //console.log(arg.data);
      app.ports.getDirReceiver.send(arg.data);
    } else if (arg.method === "ChosenDir") {
      //console.log(arg.data);
      app.ports.getDirReceiver.send(arg.data);
    } else if (arg.method === "Convert") {
      //console.log(arg.data);
      app.ports.convertStatusReceiver.send(arg.data);
    }
  });

  /*
  ipc Renderer Send
  */

  // initGet
  app.ports.getHomeDir.subscribe(function (data) {
    ipcRenderer.send("toMain", { method: "GetHomeDir" });
  });

  // opneDirDialog
  app.ports.chooseDir.subscribe(function (dirstring) {
    ipcRenderer.send("toMain", { method: "OpenDirDialog", data: dirstring });
  });

  // ConvertStart
  app.ports.convert.subscribe(function (dirurlObj) {
    ipcRenderer.send("toMain", { method: "ConvertStart", data: dirurlObj });
  });

  // AppQuit
  app.ports.appquit.subscribe(function (data) {
    ipcRenderer.send("toMain", { method: "AppQuit" });
  });

  // Paste
  app.ports.paste.subscribe(function (data) {
    document.execCommand("paste");
  });
}

if (!__DISABLE_ELECTRON__) {
  console.log("Flag OFF");
} else {
  console.log("Flag ON");
}
