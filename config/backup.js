const  spawn  = require("child_process").spawn;

module.exports = function () {
  const child = spawn("mongodump", [
    '--uri mongodb+srv://project1640:project1640@cluster0.xlyjd.mongodb.net/myFirstDatabase',
  ]);
  child.stdout.on("data", (data) => {
    console.log("stdout:\n", data);
  });
  child.stderr.on("data", (data) => {
    console.log("stderr:\n", data);
  });
  child.on("error", (err) => {
    console.log("error:\n", err);
  });
  child.on("exit", (code, signal) => {
    if (code) console.log("process exit with code", code);
    else if (signal) console.log("process killed with signal", signal);
    else console.log("Back up successfully");
  });
};
