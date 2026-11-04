(function () {
'use strict';
const client = window.NuvioCloud?.client;
if (!client) return;
const TABLE = 'user_data';
let userId = null, ready = false, timer = null, busy = false, applying = false, lastRemote = 0;

function snapshot() {
 const a = window.app;
 return {version:1,tasks:a?.tasks||[],focusSessions:a?.focusSessions||[],settings:a?.settings||{},notifications:a?.notifications||[],habits:a?.habits||[],notes:a?.notes||[],sleepRecords:a?.sleepRecords||[],waterData:a?.waterData||{},prayerData:a?.prayerData||{},userProfile:a?.userProfile||{}};
}
function applySnapshot(d) {
 if(!d||typeof d!=='object'||!window.app)return;
 applying=true;
 try {
  const a=window.app;
  if(Array.isArray(d.tasks))a.tasks=d.tasks;
  if(Array.isArray(d.focusSessions))a.focusSessions=d.focusSessions;
  if(d.settings&&typeof d.settings==='object')a.settings={...a.settings,...d.settings};
  if(Array.isArray(d.notifications))a.notifications=d.notifications;
  if(Array.isArray(d.habits))a.habits=d.habits;
  if(Array.isArray(d.notes))a.notes=d.notes;
  if(Array.isArray(d.sleepRecords))a.sleepRecords=d.sleepRecords;
  if(d.waterData&&typeof d.waterData==='object')a.waterData=d.waterData;
  if(d.prayerData&&typeof d.prayerData==='object')a.prayerData=d.prayerData;
  if(d.userProfile&&typeof d.userProfile==='object')a.userProfile=d.userProfile;
  const pairs={nuvio_tasks:a.tasks,nuvio_sessions:a.focusSessions,nuvio_settings:a.settings,nuvio_notifications:a.notifications,nuvio_habits:a.habits,nuvio_notes:a.notes,nuvio_sleep:a.sleepRecords,nuvio_water:a.waterData,nuvio_prayer:a.prayerData,nuvio_user_profile:a.userProfile};
  Object.entries(pairs).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));
  a.applyTheme?.();a.applyLanguage?.();a.renderAll?.();a.renderHabits?.();a.renderNotes?.();
 } finally { applying=false; }
}
async function syncNow() {
 if(!userId||!ready||busy||!navigator.onLine)return;
 busy=true;
 try {
  const {data:row,error}=await client.from(TABLE).select('data,updated_at').eq('user_id',userId).maybeSingle();
  if(error)throw error;
  if(!row){
   const payload={user_id:userId,data:snapshot(),updated_at:new Date().toISOString()};
   const {error:writeError}=await client.from(TABLE).upsert(payload,{onConflict:'user_id'});
   if(writeError)throw writeError;
   lastRemote=Date.parse(payload.updated_at);
  } else {
   const stamp=Date.parse(row.updated_at||'')||0;
   if(stamp>lastRemote){applySnapshot(row.data);lastRemote=stamp;}
  }
 } catch(e){console.error('Nuvio cloud sync:',e);window.dispatchEvent(new CustomEvent('nuvio:sync-error',{detail:e.message}));}
 finally{busy=false;}
}
function scheduleSave(){
 if(!userId||!ready||applying)return;
 clearTimeout(timer);
 timer=setTimeout(async()=>{
  try{
   const payload={user_id:userId,data:snapshot(),updated_at:new Date().toISOString()};
   const {error}=await client.from(TABLE).upsert(payload,{onConflict:'user_id'});
   if(error)throw error;
   lastRemote=Date.parse(payload.updated_at);
  }catch(e){console.error('Nuvio cloud save:',e);window.dispatchEvent(new CustomEvent('nuvio:sync-error',{detail:e.message}));}
 },650);
}
async function start(session){
 userId=session?.user?.id||null;ready=false;lastRemote=0;
 if(!userId)return;
 try{
  const {data:row,error}=await client.from(TABLE).select('data,updated_at').eq('user_id',userId).maybeSingle();
  if(error)throw error;
  if(row){applySnapshot(row.data);lastRemote=Date.parse(row.updated_at||'')||Date.now();}
  else{
   const payload={user_id:userId,data:snapshot(),updated_at:new Date().toISOString()};
   const {error:writeError}=await client.from(TABLE).upsert(payload,{onConflict:'user_id'});
   if(writeError)throw writeError;
   lastRemote=Date.parse(payload.updated_at);
  }
  ready=true;
 }catch(e){console.error('Nuvio initial cloud sync:',e);window.dispatchEvent(new CustomEvent('nuvio:sync-error',{detail:e.message}));}
}
client.auth.onAuthStateChange((event,session)=>{
 if(event==='SIGNED_OUT'){userId=null;ready=false;return;}
 if(session&&['SIGNED_IN','INITIAL_SESSION','TOKEN_REFRESHED','USER_UPDATED'].includes(event))setTimeout(()=>start(session),0);
});
window.addEventListener('focus',syncNow);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncNow();});
window.addEventListener('online',syncNow);
window.NuvioSync={scheduleSave,syncNow};
client.auth.getSession().then(({data,error})=>{if(error)throw error;return start(data.session);}).catch(e=>console.error('Nuvio sync session:',e));
})();