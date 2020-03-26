const { spawn } = require("child_process");
var fs = require("fs");

let content = `import Calendar from "./Calendar";
import "./Calendar.css";
export default Calendar;
`;

const commandOptions =
  "-f esm --jsx React.createElement --no-sourcemap --alias utils=lib/utils/index.js";

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

function init() {
  const child = spawn("microbundle", commandOptions.split(" "), {
    stdio: "inherit"
  });

  child.on("error", () => {
    console.error({
      command: `Process failed : ${options.join(" ")}`
    });
  });

  child.on("close", code => {
    if (code !== 0) {
      console.error({
        command: `node ${options.join(" ")}`
      });
      return;
    }
    replaceFiles();
  });
}

init();
