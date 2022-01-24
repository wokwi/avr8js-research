import {compile} from "./compile";

compile("./src/compile/program.ino").catch((error) => console.log(error))
