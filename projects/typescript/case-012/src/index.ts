import { exec } from "child_process";

const value = process.argv[2] || "echo sample";
exec(value, (_err, stdout, stderr) => {
  process.stdout.write(stdout);
  process.stderr.write(stderr);
});
