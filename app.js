const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let me=null, currentProfile=null, currentCommunity=null;

async function api(url,opts={}){
  const r=await fetch(url,opts);
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||"Erro.");
  return data;
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.style.display="block";clearTimeout(window.tt);window.tt=setTimeout(()=>t.style.display="none",3000)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function img(src,cls="avatar"){return src?`<img class="${cls}" src="${esc(src)}">`:`<div class="${cls}" style="display:grid;place-items:center">☠</div>`}
function userCard(u){return `<div class="member-card"><div class="user-line">${img(u.avatar)}<div><div class="username">@${esc(u.username)}</div><div class="muted"><span class="online-dot ${u.online?'':'off'}"></span>${u.online?'online':'offline'}</div></div></div><p>${esc(u.bio||"sem bio")}</p><button onclick="openProfile(${u.id})">VER PERFIL</button></div>`}
function formDataFrom(form){return new FormData(form)}

async function boot(){
  const d=await api("/api/me"); me=d.user;
  if(me) showApp(); else showAuth();
}
function showAuth(){$("#authView").classList.remove("hidden");$("#appView").classList.add("hidden");$("#nav").classList.add("hidden")}
function showApp(){$("#authView").classList.add("hidden");$("#appView").classList.remove("hidden");$("#nav").classList.remove("hidden");$("#miniProfile").innerHTML=`<div class="user-line">${img(me.avatar)}<div><b>@${esc(me.username)}</b><br><span class="muted">${esc(me.status)}</span></div></div>`;loadHome();loadMembers();loadCommunities();}

$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();try{const d=await api("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});me=d.user;showApp();toast("Login feito ★")}catch(x){$("#authMsg").textContent=x.message}});
$("#registerForm").addEventListener("submit",async e=>{e.preventDefault();try{const d=await api("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});me=d.user;showApp();toast("Conta criada ★")}catch(x){$("#authMsg").textContent=x.message}});
$("#logoutBtn").onclick=async()=>{await api("/api/logout",{method:"POST"});me=null;showAuth()};
$$("[data-page]").forEach(b=>b.onclick=()=>go(b.dataset.page));
function go(page){
  $$(".page").forEach(p=>p.classList.add("hidden"));
  const el=$("#page"+page[0].toUpperCase()+page.slice(1));if(el)el.classList.remove("hidden");
  if(page==="home")loadHome();if(page==="members")loadMembers();if(page==="communities")loadCommunities();if(page==="music")loadMusic();if(page==="profile")openProfile(me.id);
}
async function loadHome(){
  const d=await api("/api/posts");
  $("#feed").innerHTML=d.posts.map(postHTML).join("")||`<div class="box">Ainda não tem nada aqui. Seja o primeiro a postar.</div>`;
  const u=await api("/api/users?q=a");$("#onlineUsers").innerHTML=u.users.filter(x=>x.online).slice(0,8).map(x=>`<div>@${esc(x.username)}</div>`).join("")||"ninguém online";
}
function postHTML(p){
  return `<article class="box post"><div class="post-actions">${p.user.id===me.id?`<button onclick="del('/api/posts/${p.id}')">APAGAR</button>`:""}</div>
  <div class="user-line">${img(p.user.avatar)}<div><span class="username">@${esc(p.user.username)}</span><div class="muted">${new Date(p.created_at).toLocaleString()}</div></div></div>
  <p>${esc(p.body).replace(/\n/g,"<br>")}</p>${p.image?`<img class="post-image" src="${esc(p.image)}">`:""}
  <div class="comments">${p.comments.map(c=>`<div class="comment"><b>@${esc(c.user.username)}</b> ${esc(c.body)} ${c.image?`<img class="post-image" src="${esc(c.image)}">`:""} ${c.user.id===me.id?`<button onclick="del('/api/comments/${c.id}')">x</button>`:""}</div>`).join("")}</div>
  <form class="comment-form" onsubmit="comment(event,${p.id})"><input name="body" placeholder="comentar..."><input type="file" name="image" accept="image/*,.gif" aria-label="Anexar foto ou GIF"><button>↩</button></form></article>`;
}
$("#sendPost").onclick=async()=>{try{const fd=new FormData();fd.append("body",$("#postBody").value);if($("#postImage").files[0])fd.append("image",$("#postImage").files[0]);await api("/api/posts",{method:"POST",body:fd});$("#postBody").value="";$("#postImage").value="";loadHome();toast("Postado ★")}catch(x){toast(x.message)}};
$("#stickerBtn").onclick=()=>$("#stickerTray").classList.toggle("hidden");
$$(".sticker").forEach(b=>b.onclick=()=>{$("#postBody").value+=($("#postBody").value?" ":"")+b.dataset.sticker});
async function comment(e,id){e.preventDefault();const fd=new FormData(e.target);await api(`/api/posts/${id}/comments`,{method:"POST",body:fd});loadHome()}
async function del(url){if(!confirm("Apagar isso? Essa ação não pode ser desfeita."))return;try{await api(url,{method:"DELETE"});loadHome();if(currentProfile)openProfile(currentProfile.id);if(currentCommunity)openCommunity(currentCommunity.id);toast("Apagado ★")}catch(x){toast(x.message)}}

$("#searchInput").oninput=async e=>{const q=e.target.value.trim();if(!q)return $("#searchResults").innerHTML="";const d=await api("/api/users?q="+encodeURIComponent(q));$("#searchResults").innerHTML=d.users.map(u=>`<div><button onclick="openProfile(${u.id})">@${esc(u.username)}</button></div>`).join("")};
$("#membersSearch").oninput=loadMembers;
async function loadMembers(){const q=$("#membersSearch")?.value.trim()||"";const d=await api("/api/users?q="+encodeURIComponent(q||"a"));$("#membersGrid").innerHTML=d.users.map(userCard).join("")||"nenhum membro encontrado";}

window.openProfile=async id=>{
  const d=await api("/api/profile/"+id);currentProfile=d.user;
  go("profile");
  const mine=id===me.id;
  $("#profilePage").innerHTML=`<div class="box" class="box profile-wallpaper" style="background-image:${d.user.profile_bg?`url('${esc(d.user.profile_bg)}')`:"none"}">
    <div class="profile-header">${img(d.user.avatar,"avatar big")}<div class="profile-info"><h1>@${esc(d.user.username)}</h1><div>${esc(d.user.status)} · <span class="online-dot ${d.user.online?'':'off'}"></span>${d.user.online?'online':'offline'}</div><p>${esc(d.user.bio)}</p><div class="muted">seguindo ${d.following} · seguidores ${d.followers}</div>
    <div class="profile-actions">${mine?`<button onclick="editProfile()">EDITAR PERFIL</button><button onclick="deleteAccount()" class="danger">APAGAR CONTA</button>`:`<button onclick="friend(${id})">${d.isFriend?'REMOVER AMIGO':'ADICIONAR AMIGO'}</button><button onclick="follow(${id})">${d.followingMe?'DEIXAR DE SEGUIR':'SEGUIR'}</button><button onclick="scrap(${id})">SCRAP</button><button onclick="blockUser(${id})">BLOQUEAR</button>`}</div></div></div>
    <div class="tabs"><button onclick="profileTab('about')">ABOUT</button><button onclick="profileTab('photos')">PHOTOS</button><button onclick="profileTab('albums')">ALBUMS</button><button onclick="profileTab('music')">MUSIC</button><button onclick="profileTab('scraps')">SCRAPS</button><button onclick="profileTab('comments')">COMMENTS</button><button onclick="profileTab('top8')">TOP 8</button></div>
    <div id="profileTabContent" class="tab-content"></div>
  </div>`;
  profileTab("about",d);
};
async function profileTab(tab,d0=null){
  const d=d0||await api("/api/profile/"+currentProfile.id), c=$("#profileTabContent"), mine=currentProfile.id===me.id;
  if(tab==="about") c.innerHTML=`<h3>★ ABOUT</h3><p>${esc(d.user.bio).replace(/\n/g,"<br>")||"nada escrito..."}</p><p class="muted">membro desde ${new Date(d.user.created_at).toLocaleDateString()}</p>`;
  if(tab==="photos") c.innerHTML=`${mine?`<form id="photoForm" class="inline-form"><input type="file" name="image" accept="image/*" required><input name="caption" placeholder="legenda"><button>UPLOAD</button></form>`:""}<div class="photo-grid">${d.photos.map(p=>`<div class="photo-wrap"><img class="photo" src="${esc(p.file)}">${mine?`<button class="delete-x" onclick="del('/api/photos/${p.id}')">x</button>`:""}<div class="muted">${esc(p.caption)}</div></div>`).join("")||"<p>sem fotos.</p>"}</div>`;
  if(tab==="albums") c.innerHTML=`${mine?`<button onclick="newAlbum()">+ NOVO ÁLBUM</button>`:""}${d.albums.map(a=>`<div class="box"><b>${esc(a.name)}</b><p>${esc(a.description)}</p><div class="photo-grid">${a.photos.map(p=>`<div class="photo-wrap"><img class="photo" src="${esc(p.file)}">${mine?`<button class="delete-x" onclick="del('/api/photos/${p.id}')">x</button>`:""}</div>`).join("")}</div>${mine?`<button onclick="del('/api/albums/${a.id}')">APAGAR ÁLBUM</button>`:""}</div>`).join("")||"<p>sem álbuns.</p>"}`;
  if(tab==="music") c.innerHTML=d.songs.map(s=>`<div class="box"><b>${esc(s.title)}</b><br><a target="_blank" href="${esc(s.url)}">${esc(s.url)}</a>${mine?`<button onclick="del('/api/songs/${s.id}')">APAGAR</button>`:""}</div>`).join("")||"<p>nenhuma música pública.</p>";
  if(tab==="scraps") {const x=await api("/api/scraps/"+currentProfile.id);c.innerHTML=`${!mine?`<button onclick="scrap(${currentProfile.id})">+ DEIXAR SCRAP</button>`:""}${x.scraps.map(s=>`<div class="comment"><b>@${esc(s.from_user_name)}</b> ${esc(s.body)} ${s.image?`<img class="post-image" src="${esc(s.image)}">`:""}<button onclick="del('/api/scraps/${s.id}')">x</button></div>`).join("")||"<p>nenhum scrap.</p>"}`;}
  if(tab==="comments") c.innerHTML=`${!mine?`<button onclick="profileComment(${currentProfile.id})">+ COMENTAR PERFIL</button>`:""}${d.comments.map(x=>`<div class="comment"><b>@${esc(x.user.username)}</b> ${esc(x.body)} ${x.image?`<img class="post-image" src="${esc(x.image)}">`:""} ${(x.user.id===me.id||mine)?`<button onclick="del('/api/profile-comments/${x.id}')">x</button>`:""}</div>`).join("")||"<p>nenhum comentário.</p>"}`;
  if(tab==="top8") c.innerHTML=`<h3>★ TOP 8</h3><div class="top8-grid">${Array.from({length:8},(_,i)=>{const x=d.top.find(t=>t.position===i+1);return `<div class="top8-card"><b>#${i+1}</b>${x?`${img(x.user.avatar)}<div>@${esc(x.user.username)}</div>${mine?`<button onclick="removeTop8(${x.user.id})">x</button>`:""}`:"<div class='muted'>vazio</div>"}</div>`}).join("")}</div>${mine?`<p class="muted">Para colocar alguém: use um amigo e escolha a posição.</p><button onclick="setTop8()">EDITAR TOP 8</button>`:""}`;
  if(tab==="photos"&&mine) $("#photoForm").onsubmit=async e=>{e.preventDefault();await api("/api/photos",{method:"POST",body:new FormData(e.target)});profileTab("photos");toast("Foto enviada ★")};
}
window.editProfile=()=>modal(`<h2>★ EDIT PROFILE</h2><form id="editProfileForm"><textarea name="bio" placeholder="bio">${esc(me.bio)}</textarea><select name="theme"><option value="black">black</option><option value="purple">purple</option><option value="red">red</option><option value="blue">blue</option><option value="green">green</option></select><label>Wallpaper do perfil (URL opcional)<input name="profile_bg" placeholder="URL da imagem/GIF" value="${esc(me.profile_bg)}"></label><label>Ou envie uma imagem/GIF para o wallpaper<input name="wallpaper" type="file" accept="image/*,.gif"></label><input name="profile_music" placeholder="URL de música (opcional)" value="${esc(me.profile_music)}"><input name="status" placeholder="status" value="${esc(me.status)}"><input name="avatar" type="file" accept="image/*"><button>SALVAR</button></form>`);
document.addEventListener("submit",async e=>{if(e.target.id!=="editProfileForm")return;e.preventDefault();try{const fd=new FormData(e.target);await api("/api/me/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({bio:fd.get("bio"),theme:fd.get("theme"),profile_bg:fd.get("profile_bg"),profile_music:fd.get("profile_music"),status:fd.get("status")})});if(e.target.avatar.files[0]){const x=new FormData();x.append("image",e.target.avatar.files[0]);await api("/api/me/avatar",{method:"POST",body:x})}if(e.target.wallpaper.files[0]){const x=new FormData();x.append("image",e.target.wallpaper.files[0]);await api("/api/me/wallpaper",{method:"POST",body:x})}me=(await api("/api/me")).user;closeModal();showApp();openProfile(me.id);toast("Perfil atualizado ★")}catch(x){toast(x.message)}});

window.friend=async id=>{await api("/api/friend/"+id,{method:"POST"});openProfile(id);toast("Amizade atualizada ★")};
window.follow=async id=>{await api("/api/follow/"+id,{method:"POST"});openProfile(id);toast("Follow atualizado ★")};
window.blockUser=async id=>{if(confirm("Bloquear este usuário?")){await api("/api/block/"+id,{method:"POST"});toast("Bloqueio atualizado ★")}};
window.scrap=id=>modal(`<h2>★ SCRAP</h2><form id="scrapForm"><textarea name="body" placeholder="deixe seu recado..."></textarea><input type="file" name="image" accept="image/*"><button>ENVIAR SCRAP</button></form>`,async()=>{});
document.addEventListener("submit",async e=>{if(e.target.id!=="scrapForm")return;e.preventDefault();const id=currentProfile.id;await api("/api/scraps/"+id,{method:"POST",body:new FormData(e.target)});closeModal();profileTab("scraps");toast("Scrap enviado ★")});
window.profileComment=id=>modal(`<h2>★ PROFILE COMMENT</h2><form id="pcForm"><textarea name="body" placeholder="comentário..."></textarea><input type="file" name="image" accept="image/*"><button>ENVIAR</button></form>`);
document.addEventListener("submit",async e=>{if(e.target.id!=="pcForm")return;e.preventDefault();await api("/api/profile-comments/"+currentProfile.id,{method:"POST",body:new FormData(e.target)});closeModal();profileTab("comments")});
window.newAlbum=()=>modal(`<h2>★ NEW ALBUM</h2><form id="albumForm"><input name="name" placeholder="nome" required><textarea name="description" placeholder="descrição"></textarea><button>CRIAR</button></form>`);
document.addEventListener("submit",async e=>{if(e.target.id!=="albumForm")return;e.preventDefault();await api("/api/albums",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target))),headers:{"Content-Type":"application/json"}});closeModal();profileTab("albums")});
window.setTop8=async()=>{const d=await api("/api/profile/"+me.id);const friends=d.friends;if(!friends.length)return toast("Você ainda não tem amigos.");modal(`<h2>★ EDIT TOP 8</h2>${friends.map(u=>`<div class="inline-form"><b>@${esc(u.username)}</b><select id="pos${u.id}">${Array.from({length:8},(_,i)=>`<option>${i+1}</option>`).join("")}</select><button onclick="saveTop8(${u.id})">COLOCAR</button></div>`).join("")}`)};
window.saveTop8=async id=>{const pos=Number($("#pos"+id).value);await api("/api/top8",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({friend_id:id,position:pos})});toast("Top 8 atualizado ★");closeModal();profileTab("top8")};
window.removeTop8=async id=>{await api("/api/top8/"+id,{method:"DELETE"});profileTab("top8")};
window.deleteAccount=async()=>{if(confirm("APAGAR A CONTA, posts, fotos e tudo? Isso não pode ser desfeito.")){await api("/api/me",{method:"DELETE"});me=null;showAuth();toast("Conta apagada.")}};

$("#newCommunityBtn").onclick=()=>modal(`<h2>★ CREATE COMMUNITY</h2><form id="communityForm"><input name="name" placeholder="nome" required><textarea name="description" placeholder="descrição"></textarea><select name="theme"><option value="dark">dark</option><option value="pink">pink</option><option value="purple">purple</option><option value="red">red</option><option value="blue">blue</option><option value="green">green</option></select><input type="file" name="banner" accept="image/*"><button>CRIAR ★</button></form>`);
document.addEventListener("submit",async e=>{if(e.target.id!=="communityForm")return;e.preventDefault();try{const d=await api("/api/communities",{method:"POST",body:new FormData(e.target)});closeModal();loadCommunities();openCommunity(d.id)}catch(x){toast(x.message)}});
async function loadCommunities(){const d=await api("/api/communities");$("#communitiesGrid").innerHTML=d.communities.map(c=>`<div class="community-card theme-${esc(c.theme)}" onclick="openCommunity(${c.id})"><h3>★ ${esc(c.name)}</h3><p>${esc(c.description)}</p><div class="muted">${c.members} membros · @${esc(c.owner_name)}</div></div>`).join("")||"<p>nenhuma comunidade ainda.</p>"}
window.openCommunity=async id=>{const d=await api("/api/communities/"+id);currentCommunity=d.community;go("community");const c=$("#communityPage");c.innerHTML=`<div class="box theme-${esc(d.community.theme)}">${d.community.banner?`<img class="community-banner" src="${esc(d.community.banner)}">`:""}<h1>★ ${esc(d.community.name)}</h1><p>${esc(d.community.description)}</p><p class="muted">dono: @${esc(d.community.owner_name)} · ${d.members.length} membros</p><button onclick="joinCommunity(${id})">${d.joined?"SAIR":"ENTRAR"} ★</button>${d.community.owner_id===me.id?`<button onclick="deleteCommunity(${id})">APAGAR COMUNIDADE</button>`:""}<hr>${d.joined?`<form id="communityPostForm"><textarea name="body" placeholder="postar na comunidade..."></textarea><input type="file" name="image" accept="image/*"><button>POSTAR</button></form>`:"<p>Entre na comunidade para postar.</p>"}<div>${d.posts.map(p=>`<div class="community-post"><b>@${esc(p.user.username)}</b><p>${esc(p.body)}</p>${p.image?`<img class="post-image" src="${esc(p.image)}">`:""}${p.user.id===me.id||d.community.owner_id===me.id?`<button onclick="del('/api/communities/posts/${p.id}')">APAGAR</button>`:""}</div>`).join("")||"<p>nenhum post.</p>"}</div><h3>★ MEMBERS</h3><div class="members-grid">${d.members.map(userCard).join("")}</div></div>`;
if($("#communityPostForm"))$("#communityPostForm").onsubmit=async e=>{e.preventDefault();await api("/api/communities/"+id+"/posts",{method:"POST",body:new FormData(e.target)});openCommunity(id)}};
window.joinCommunity=async id=>{await api("/api/communities/"+id+"/join",{method:"POST"});openCommunity(id);loadCommunities()};
window.deleteCommunity=async id=>{if(confirm("Apagar esta comunidade e os posts dela?")){await api("/api/communities/"+id,{method:"DELETE"});go("communities");loadCommunities()}};

async function loadMusic(){const d=await api("/api/profile/"+me.id);$("#mySongs").innerHTML=d.songs.map(s=>`<div class="box"><b>${esc(s.title)}</b><br><a href="${esc(s.url)}" target="_blank">${esc(s.url)}</a><button onclick="delSong(${s.id})">APAGAR</button></div>`).join("")||"<p>nenhuma música pública.</p>"}
$("#songForm").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);await api("/api/songs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:fd.get("title"),url:fd.get("url"),is_public:fd.has("is_public")})});e.target.reset();loadMusic();toast("Música adicionada ★")};
window.delSong=async id=>{await api("/api/songs/"+id,{method:"DELETE"});loadMusic()};

function modal(html){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden");$("#modalBody").innerHTML=""}
$("#closeModal").onclick=closeModal;$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};

boot().catch(()=>showAuth());
setInterval(()=>{if(me)api("/api/me").then(d=>{if(d.user)me=d.user}).catch(()=>{})},60000);
