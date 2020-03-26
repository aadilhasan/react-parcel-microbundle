const { spawn } = require("child_process");
var fs = require("fs");

let content = `import Calendar from "./Calendar";
import "./Calendar.css";
export default Calendar;
`;

const microbundleCommand =
  "microbundle -f esm --jsx React.createElement --no-sourcemap --alias utils=lib/utils/index.js,const=lib/const/index.js";

function runCommand(_command) {
  return new Promise((resolve, reject) => {
    let command = _command.split(" ");
    let options = command.splice(1);
    const child = spawn(command[0], options, {
      stdio: "inherit"
    });

    child.on("error", () => {
      console.error({
        command: `Process failed : ${options.join(" ")}`
      });
      reject();
    });

    child.on("close", code => {
      if (code !== 0) {
        console.error({
          command: `node ${options.join(" ")}`
        });
        return;
      }
      resolve();
    });
  });
}

function replaceFiles() {
  fs.renameSync(
    `${process.cwd()}/dist/index.js`,
    `${process.cwd()}/dist/Calendar.js`
  );
  fs.renameSync(
    `${process.cwd()}/dist/index.css`,
    `${process.cwd()}/dist/Calendar.css`
  );

  fs.writeFile(`${process.cwd()}/dist/index.js`, content, error => {
    if (error) {
      console.error(" error ", error);
    } else {
      console.log(" success ");
    }
  });
}

async function init() {
  try {
    console.log("removing dist ✄ ✄ ✄ ");
    await runCommand("rm -rf dist");
    console.log("microbundle running 🏃🏻‍♂️🏃🏻‍♂️🏃🏻‍♂️ ");
    await runCommand(microbundleCommand);
    console.log("finishing build 😎😎😎 ");
    replaceFiles();
    console.log("build complete 🥳🥳🥳 ");
  } catch (e) {
    // log error
  }
}

init();
