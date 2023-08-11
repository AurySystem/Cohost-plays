
//note always escape these before entering
let Buttons = [
  "A",
  "B",
  "Up",
  "Left",
  "Down",
  "Right",
  "Start",
  "Select",
  ];

let mapUnderArray = [
    ["nil", "" ],
    ["A", "A" ],
    ["B", "B" ],
    ["UP", "Up" ],
    ["LEFT", "Left" ],
    ["DOWN", "Down" ],
    ["RIGHT", "Right" ],
    ["START", "Start" ],
    ["SELECT", "Select" ],
    ["Up", "Up" ],
    ["Left", "Left" ],
    ["Down", "Down" ],
    ["Right", "Right" ],
    ["Start", "Start" ],
    ["Select", "Select" ],
    ["a", "A" ],
    ["b", "B" ],
    ["up", "Up" ],
    ["left", "Left" ],
    ["down", "Down" ],
    ["right", "Right" ],
    ["start", "Start" ],
    ["select", "Select" ],
    ["🅰", "A" ],
    ["🅱", "B" ],
    ["⬆️", "Up" ],
    ["⬅️", "Left" ],
    ["⬇", "Down" ],
    ["➡", "Right" ],
    ["▶", "Start" ],
    ["◀", "Select" ]
  ];
let ControlMap = new Map(mapUnderArray);

let makeAliases = function(){
  let arr = [];
  for (x of mapUnderArray) {
    arr.push(x.join("->"))
  }
  return arr.join(", ")
} 

let Aliases = makeAliases();
module.exports = {
  Buttons,
  ControlMap,
  Aliases
};