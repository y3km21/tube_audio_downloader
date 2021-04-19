const util = require("util");
const process = require("process");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");
const path = require("path");
const { dialog } = require("electron");
const rmfr = require("rmfr");

const unpackedPyroot = path
  .resolve(__dirname, "venv")
  .replace("app.asar", "app.asar.unpacked");

const unpackedSrcroot = path
  .resolve(__dirname)
  .replace("app.asar", "app.asar.unpacked");

function isValidJson(val) {
  try {
    JSON.parse(val);
  } catch (e) {
    return false;
  }
  return true;
}

const platform = process.platform;

async function pypath_input() {
  /*
    PATH Setting
  */
  const oldEnvPath = process.env.PATH;
  const jsonpath = path.resolve(unpackedSrcroot, "pypath.json");
  var newEnvPath = oldEnvPath;
  if (fs.existsSync(jsonpath)) {
    const readfile = fs.readFileSync(jsonpath, "utf8");
    if (isValidJson(readfile)) {
      const jsonObj = JSON.parse(readfile);
      if (platform === "darwin") {
        newEnvPath = jsonObj.python + ":" + oldEnvPath;
      } else if (platform === "win32") {
        newEnvPath = jsonObj.python + ";" + oldEnvPath;
      }
    }
  } else {
    fs.writeFileSync(jsonpath, "");
  }

  process.env.PATH = newEnvPath;
  var pypath;
  while (true) {
    try {
      if (platform === "darwin") {
        const { stdout, stderr } = await exec("which python3.8");
        return stdout;
      } else if (platform === "win32") {
        const { stdout, stderr } = await exec("where.exe python3.8");
        return stdout;
      } else {
        var notSupported = new Error("Not Supported Platform");
        notSupported.name = "NotSupported";
        throw notSupported;
      }
    } catch (error) {
      /*
        'which python3.8' fails... 
      */
      dialogOption = {
        title: "Select Directory with 'python3.8'",
        defaultPath:
          process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"],
        properties: ["openDirectory"],
        message: "Choose Directory including 'python3.8'",
      };
      pypatharr = dialog.showOpenDialogSync(dialogOption);
      /*
        App will quit when you don't select a folder.
      */
      if (typeof pypatharr === "undefined") {
        var cancel = new Error("Select Directory Error");
        cancel.name = "Cancel";
        throw cancel;
      }
      pypath = pypatharr[0];
      const obj = { python: pypath };
      fs.writeFileSync(jsonpath, JSON.stringify(obj));
      newEnvPath = obj.python + ":" + oldEnvPath;
      process.env.PATH = newEnvPath;
      //dialog.showErrorBox("pypath", pypath);
      //dialog.showErrorBox("envPATH", process.env.PATH);
    }
  }
}

async function venv_create(pypath) {
  console.log(unpackedPyroot);
  var venvpath = unpackedPyroot;
  if (!fs.existsSync(venvpath)) {
    var cmd_arr = [pypath.replace(/\r?\n/g, ""), "-m", "venv", venvpath];
    console.log(cmd_arr.join(" "));
    const { venv_out, venv_err } = await exec(cmd_arr.join(" "));

    if (platform === "darwin") {
      const pip3_update = await exec(venvpath + "/bin/pip install -U pip");
      const pip3 = await exec(
        venvpath + "/bin/pip3 install pytube pydub certifi"
      );
    } else if (platform === "win32") {
      const pip3_update = await exec(
        venvpath + "\\Scripts\\python.exe -m pip install --upgrade pip "
      );
      const pip3 = await exec(
        venvpath + "\\Scripts\\pip3.exe install pytube pydub certifi"
      );
    }
  }
  //console.log(pip3.stdout);
}

async function config_rm() {
  var venvpath = unpackedPyroot;
  var jsonpath = path.resolve(unpackedSrcroot, "pypath.json");
  await rmfr(venvpath);
  await rmfr(jsonpath);
}

module.exports = { venv_create, pypath_input, config_rm };
