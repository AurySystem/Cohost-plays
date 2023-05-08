const cohost = require("cohost");
const _fetch = require("node-fetch");
const FormData = require('form-data')
const fs = require("fs/promises");
const controls = require("./controls");

let api_url="https://cohost.org/api/v1";

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
    readline.close();
    core();
  });

});


async function core() {
  // Create User and authenticate
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
  
  let swapToProject = await _fetch(api_url+"/trpc/projects.switchProject?batch=1", {method:"POST", body: JSON.stringify({0: {'projectId': project.id}}), headers:{'User-Agent': 'cohost.js','Content-Type': 'application/json', 'cookie': user.sessionCookie}, credentials:'include'});
  // console.log(swapToProject)
  // console.log(await swapToProject.text())

  let [prevPost] = await project.getPosts();
  // Get lastest post of Project
  // console.log(prevPost);

  let notifsRaw = await _fetch(api_url+"/notifications/list?limit=40", {method:"GET", headers:{'User-Agent': 'cohost.js', 'Content-Type': 'application/json', 'cookie': user.sessionCookie}, credentials:'include'});
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
  // console.log(comments)

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


  fs.writeFile('./test.txt', highestKey).catch(er => {
    if (er) {
      console.error(er);
    }
  });

  //wait and then read new screenshot, then post the new frame
  let abort = new AbortController();
  
  try{
    let watcher = fs.watch("./",{signal:abort.signal});
    for await (const event of watcher){
      console.log(event)
      if(event.filename == "screenshot.png"){
        abort.abort("stop watching");
      }
    }
  }
  catch(e){} //ignore abort errors, why doesn't promise based fs.watch come with a way to close it
  
  let postdata = {
    postState: 0,
    headline: highestKey+" ===>",
    adultContent: false,
    blocks: [{"type":"attachment","attachment":{"attachmentId":"00000000-0000-0000-0000-000000000000","altText":"a frame of a video game"}},{"type":"markdown","markdown":{"content":"Vote on the next frame inputs in the comments."}}],
    cws: [],
    tags: ["videogames","bot","The Cohost Bot feed","botchosting", "Cohost Plays"]
  };
  let postId = await cohost.Post.create(project, postdata).catch(er => {
    if (er) {
      console.error(er);
      throw("er"); //stop if can't post
    }
  }
  );
  
  let attachmentImage = await fs.readFile('screenshot.png').catch(er => {
    if (er) {
      console.error(er);
    }
  });
  
  
  let attachmentstart = await _fetch(api_url+`/project/${project.handle}/posts/${postId}/attach/start`, {method:"POST", body: JSON.stringify({
            'filename': "screenshot.png",
            'content_type': "image/png",
            'content_length': attachmentImage.length
        }), headers:{'User-Agent': 'cohost.js','Content-Type': 'application/json', 'cookie': user.sessionCookie}, credentials:'include'});
  
  let parsedCredentuals = JSON.parse(await attachmentstart.text());// if it throws here it throws here we can make it catch later
  
  let imageData = new FormData();
  for (key in parsedCredentuals.requiredFields) {
    imageData.append(key, parsedCredentuals.requiredFields[key], {name:key});
  }
  imageData.append('file', attachmentImage, {contentType: 'image/png', name: 'file', filename: "screenshot.png"})
  await _fetch(parsedCredentuals.url, {method:"POST", body: imageData});
  
  let attachmentfinish = await _fetch(api_url+`/project/${project.handle}/posts/${postId}/attach/finish${parsedCredentuals.attachmentId}`,
   {method:"POST", headers:{'User-Agent': 'cohost.js','Content-Type': 'application/json', 'cookie': user.sessionCookie}, credentials:'include'});
  
  postdata.blocks[0].attachment.attachmentId = parsedCredentuals.attachmentId;
  postdata.postState = 1;
  
  cohost.Post.update(project, postId, postdata).catch(er => {
    if (er) {
      console.error(er);
    }
  });
 
  fs.unlink("./screenshot.png").catch(er => {
    if (er) {
      console.error(er);
    }
  });
  
  setTimeout(core, 3600000);
  
}


