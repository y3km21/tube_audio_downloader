const { app, BrowserWindow, protocol, dialog } = require("electron");
const path = require("path");
const url = require("url");
const os = require("os");
const fs = require("fs");
const process = require("process");
const { ipcMain } = require("electron");
const { get } = require("https");
const { takeHeapSnapshot } = require("process");
const { PythonShell } = require("python-shell");
const pyinit = require("./python/python_init");

/*
    asar unpacked Directory

*/
const platform = process.platform;

let unpackedPythonPath;

if (platform === "darwin") {
  unpackedPythonPath = path
    .resolve(__dirname, "python/venv/bin/python")
    .replace("app.asar", "app.asar.unpacked");
} else if (platform === "win32") {
  unpackedPythonPath = path
    .resolve(__dirname, "python/venv/Scripts/python.exe")
    .replace("app.asar", "app.asar.unpacked");
}
const unpackedmainPyPath = path
  .resolve(__dirname, "python/py/__main__.py")
  .replace("app.asar", "app.asar.unpacked");
/* 
    function
*/

function getHomeDir() {
  var homeDir = os.homedir();
  return homeDir;
}

async function chooseDir(defaultPath) {
  let dirpath = await dialog.showOpenDialog(null, {
    properties: ["openDirectory"],
    title: "Select Output Directory...",
    defaultPath: defaultPath,
  });
  console.log(dirpath);
  if (dirpath.canceled) {
    return defaultPath;
  } else {
    return dirpath.filePaths[0];
  }
}

function createWindow() {
  const win = new BrowserWindow({
    //width: 800,
    height: 326,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  let indexUrl = new URL("file:///index.html");
  win.loadURL(indexUrl.toString());
  //-----
  //win.webContents.openDevTools();
}

/*
    ipc Sender Receiver
*/
ipcMain.on("toMain", (event, arg) => {
  if (arg.method === "GetHomeDir") {
    /*
        GetHomeDir
    */
    //console.log(arg);
    var homeDir = { outputDir: getHomeDir() };
    event.sender.send("toRenderer", { method: "HomeDir", data: homeDir });
  } else if (arg.method === "OpenDirDialog") {
    /*
        OpenDirDialog 
    */
    let dir = arg.data;
    if (!fs.existsSync(dir)) {
      dir = os.homedir();
    }

    chooseDir(dir).then(function (res) {
      const outputObj = { outputDir: res };
      event.sender.send("toRenderer", {
        method: "ChosenDir",
        data: outputObj,
      });
    });
  } else if (arg.method === "ConvertStart") {
    /*
        Convert
    */
    let outputDir = arg.data.outputDir;
    let youtubeUrl = arg.data.youtubeUrl;

    // Validator
    if (!fs.existsSync(outputDir)) {
      event.sender.send("toRenderer", {
        method: "Convert",
        data: { status: "Error", logmessage: "Noexists Directory" },
      });
      return;
    }
    if (!youtubeUrl) {
      event.sender.send("toRenderer", {
        method: "Convert",
        data: { status: "Error", logmessage: "Url Empty" },
      });
      return;
    }

    // Python Scripts
    /*
        Turning on Unbufferd option activates "pyshell.on" 
        every time you receive a message from the python side.
        ref : https://stackoverflow.com/questions/29196440/node-js-python-shell-while-true-loop-not-working

        I could only pass text to pythonshell.
        Is this bug?
    */
    var pyshell_options = {
      pythonOptions: ["-u"],
      pythonPath: unpackedPythonPath,
    };
    let pyshell = new PythonShell(unpackedmainPyPath, pyshell_options);

    const argstr = JSON.stringify({ args: [outputDir, youtubeUrl] });
    pyshell.send(argstr);

    pyshell.on("message", function (message) {
      //console.log(message);
      //console.log("------");
      var jsonobj = JSON.parse(message);

      event.sender.send("toRenderer", {
        method: "Convert",
        data: { status: jsonobj.status, logmessage: jsonobj.message },
      });
    });

    pyshell.end((err) => {
      //console.log(arg.data);
      if (err) {
        event.sender.send("toRenderer", {
          method: "Convert",
          data: { status: "Error", logmessage: err.toString() },
        });
      } else {
        event.sender.send("toRenderer", {
          method: "Convert",
          data: { status: "Finish", logmessage: "Complete!" },
        });
      }
    });
  } else if (arg.method === "AppQuit") {
    /*
      App Quit
    */
    app.quit();
  }
});

/*
    App
*/

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
  //app.quit();
});

app.on("ready", () => {
  protocol.interceptFileProtocol("file", (req, callback) => {
    const requestedUrl = req.url.substr(7);

    if (path.isAbsolute(requestedUrl)) {
      callback(path.normalize(path.join(__dirname, requestedUrl)));
    } else {
      callback(requestedUrl);
    }
  });
});

app.on("ready", () => {
  async function pyc() {
    let pypath;
    while (true) {
      try {
        //dialog.showErrorBox("PathCheck", process.env.PATH);
        pypath = await pyinit.pypath_input();
        console.log(pypath);
        await pyinit.venv_create(pypath);
      } catch (e) {
        if (e.name === "Cancel") {
          app.quit();
        } else {
          dialog.showErrorBox("Initialize Error", e.toString());
          //await pyinit.config_rm();
        }
      }
      break;
    }
  }
  pyc().then(() => {
    createWindow();
  });
  console.log("file://" + __dirname + "/index.html");
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
