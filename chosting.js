const cohost = require("cohost");
const _fetch = require("node-fetch");
const FormData = require('form-data')
const fs = require("fs/promises");
const fss = require("fs")
const controls = require("./controls");

let api_url="https://cohost.org/api/v1";


let name;
let pass;

try{
  let a = fss.readFileSync("./fastlogin.txt",{encoding:"utf8"});
  name = a.split(" ")[0];
  pass = a.split(" ")[1];
}catch(e){
  
}

let lastpost;

try{
  lastpost = fss.readFileSync("./lastpost.txt",{encoding:"utf8"});
}catch(e){
  console.log("no last post using first in feed")
}

if(name === undefined || pass === undefined){
    
  const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
  });
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
} else core();

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
  
  try{
    lastpost = fss.readFileSync("./lastpost.txt",{encoding:"utf8"});
  }catch(e){
    console.log("no last post using first in feed")
  }
  
  if(lastpost === undefined){
   let [prevPost] = project.getPosts();
   lastpost = prevPost.id;
  }
  // Get lastest post of Project
  // console.log(prevPost);
  let projectpostencoding = encodeURI(JSON.stringify({0: {'handle': project.handle,'postId':parseInt(lastpost)}}));
    
  let postRaw = await _fetch(api_url+`/trpc/posts.singlePost?batch=1&input=${projectpostencoding}`, {method:"GET", headers:{'User-Agent': 'cohost.js', 'Content-Type': 'application/json', 'cookie': user.sessionCookie}, credentials:'include'});
  let posty = await postRaw.json();
  
  
  // let notifsRaw = await _fetch(api_url+"/notifications/list?limit=40", {method:"GET", headers:{'User-Agent': 'cohost.js', 'Content-Type': 'application/json', 'cookie': user.sessionCookie}, credentials:'include'});
  // let notifs = await notifsRaw.json();
  // console.log(notifs);
  
  let commentToplevel = posty?.[0]?.result?.data?.comments;
  
  let uniquePages = [];
  let comments = [];
  function commentTree(spot){
    if(spot.children?.length != undefined && spot.children?.length !=0){
      for(var key of spot.children){
        var comment = key.comment;
        if(!comment.body.charAt(0)!="?" && !uniquePages.includes(key.poster.projectId)){
          comments.push(comment.body);
          uniquePages.push(key.poster.projectId);
          if(comment.children?.length != undefined && comment.children?.length !=0){
            commentTree(comment);
          }
        }
      }
    }
  }
  
  if(commentToplevel != undefined){
    for(id in commentToplevel){
      for(var key of commentToplevel[id]){
        var comment = key.comment;
        if(!comment.body.charAt(0)!="?" && !uniquePages.includes(key.poster.projectId)){
          comments.push(comment.body);
          uniquePages.push(key.poster.projectId);
          if(comment.children?.length != undefined && comment.children?.length !=0){
            commentTree(comment);
          }
        }
      }
    }
  }
  
  let votes = new Map();

  for (let comm of comments){
    let vote = [];
    for(let key of controls.ControlMap.keys()){
      if (comm.match(new RegExp('\\b'+key+'\\b',"g")) !== null){
        if(!vote.includes(controls.ControlMap.get(key))){
          vote[controls.Buttons.indexOf(controls.ControlMap.get(key))] = controls.ControlMap.get(key);
        }
      }
    }
    let mid = [];
    for (i = 0; i < vote.length; i++) {
        if (vote[i] !== undefined) {
          mid.push(vote[i]);
        }
    }
    let out = mid.join(" ")
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
  if(highestKey === "nil") highestKey = "";


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
    blocks: [{"type":"attachment","attachment":{"attachmentId":"00000000-0000-0000-0000-000000000000","altText":"a frame of a video game"}},
      {"type":"markdown","markdown":{"content":"Vote on the next frame inputs in the comments below, using any of the provided keys with a space between them. Note, if you're discussing things instead of voting put a '?' at the start of your comment to make it ignored for voting. One voter per project/profile"}},
      {"type":"markdown","markdown":{"content":"What text converts to which buttons can be found here <a>https://cohost.org/CohostPlaysFramePerfectly/post/1479578-inputs-and-the-contr</a>"}}],
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
  
  fs.writeFile('./lastpost.txt', postId+"").catch(er => {
    if (er) {
      console.error(er);
    }
  });
  
  setTimeout(core, 3600000);
  
}


