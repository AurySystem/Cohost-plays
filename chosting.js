const cohost = require("cohost");
const _fetch = require("node-fetch");
const fs = require("fs");
const controls = require("./controls");

let api_url="https://cohost.org/api/v1";
let active = true;


const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
const entry = function(prompt){new Promise((a)=>{readline.question(prompt, a)})}

let name;
let pass;

readline.question(`Enter Username: `, en => {
  console.log(`Confirmed`);
  name = en;
  
  readline.question(`Enter Password: `, en => {
    console.log(`Await validation`);
    pass = en;
    core();
    readline.close();
  });

});
async function core() {
  // Create User and authenticate
  readline.close;
  let user = new cohost.User();
  await user.login(name, pass);

  // Get first Project of user
  let projects = await user.getProjects();
  let project = null;
  for(let proj of projects){
    if(proj.handle == "CohostPlaysFramePerfectly"){
      project = proj;
      break;
    }
  }
  if(project == null) throw("Handle not found");
  
  
  while (true) {
    if(active){
      let swapToProject = await _fetch(api_url+"/trpc/projects.switchProject?batch=1", {method:"POST", body: JSON.stringify({0: {'projectId': project.id}}), headers:{'User-Agent': 'cohost.js','Content-Type': 'application/json', 'cookie': user.sessionCookie}, credentials:'include'});
      // console.log(swapToProject)
      // console.log(await swapToProject.text())
      
      let [prevPost] = await project.getPosts();
      // Get lastest post of Project
      // console.log(prevPost);
      
      let notifsRaw = await _fetch(api_url+"/notifications/list?offset=0&limit=40", {method:"GET", headers:{'User-Agent': 'cohost.js', 'Content-Type': 'application/json', 'cookie': user.sessionCookie}, credentials:'include'});
      let notifs = await notifsRaw.json();
      // console.log(notifs);
      
      let commentids = [];
      let uniquePages = [];
      let comments = [];
      
      for(let comment of notifs.notifications){
        // console.log(comment)
        if(comment.type == "comment"){
          if(comment.toPostId == prevPost.id && comment.inReplyTo == null && !uniquePages.includes(comment.fromProjectId)){
            commentids.push(comment.commentId);
            uniquePages.push(comment.fromProjectId);
          }
        }
      }
      // console.log(commentids)
      // console.log(notifs.comments)
      for(let comment in notifs.comments){
        if(commentids.includes(comment)){
          comments.push(notifs.comments[comment]?.comment)
        }
      }
      console.log(comments)
      
      let votes = new Map();
      
      for (let comm of comments){
        let vote = [];
        for(let key of controls.ControlAliases){
          if (comm.body.match(new RegExp('\\b'+key+'\\b',"g")) !== null){
            if(!vote.includes(controls.ControlMap.get(key))){
              vote.push(controls.ControlMap.get(key));
            }
          }
        }
        let out = vote.join(" ")
        if(votes.has(out)){
          votes.set(out, votes.get(out)+1)
        }else{
          votes.set(out, 1);
        }
      }
      
      let highestVal = 0;
      let highestKey = "nil";
      for(let [vote, value] of votes){
        if(value > highestVal){
          highestKey = vote;
          highestVal = value;
        }
      }
      
      
      fs.writeFileSync('./test.txt', highestKey, er => {
        if (er) {
          console.error(er);
        }
      });
      
      //wait and then read new screenshot, then post the new frame
      
      
      
      active = false;
      setTimeout(()=>{active=true}, 3600000)
    }
  }
  
  
}
