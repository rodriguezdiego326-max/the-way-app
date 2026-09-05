const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./web-CYa6omDv.js","./index-BXJC4laN.js","./index-BVyTembb.css"])))=>i.map(i=>d[i]);
import { r as registerPlugin, _ as __vitePreload } from "./index-BXJC4laN.js";
const App = registerPlugin("App", {
  web: () => __vitePreload(() => import("./web-CYa6omDv.js"), true ? __vite__mapDeps([0,1,2]) : void 0, import.meta.url).then((m) => new m.AppWeb())
});
export {
  App
};
