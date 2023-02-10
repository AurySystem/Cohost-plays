
//note always escape these before entering
let ControlAliases = [
  "A",
  "B",
  "Up",
  "Left",
  "Down",
  "Right",
  "Start",
  "Select"
  ];

let ControlMap = new Map([
  ["","nil"],
  ["A","A"],
  ["B","B"],
  ["Up","Up"],
  ["Left","Left"],
  ["Down","Down"],
  ["Right","Right"],
  ["Start","Start"],
  ["Select","Select"]
  ]);

module.exports = {
  ControlAliases,
  ControlMap
};