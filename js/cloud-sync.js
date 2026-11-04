(function () {
'use strict';
const client = window.NuvioCloud?.client;
if (!client) {
 console.error('Nuvio sync: Supabase client is unavailable.');
 return;
}
const TABLE = 'nuvio_data';
let userId = null, ready = false, timer = null, busy = false, applying = false;
let lastRemote = 0, channel = null, pendingBeforeReady = false;

function snapshot() {
 const a = window.app;
 return {
  nuvio_tasks:a?.tasks||[], nuvio_sessions:a?.focusSessions||[],
  nuvio_settings:a?.settings||{}, nuvio_notifications:a?.notifications||[],
  nuvio_habits:a?.habits||[], nuvio_notes:a?.notes||[],
  nuvio_sleep:a?.sleepRecords||[], nuvio_water:a?.waterData||{},
  nuvio_prayer:a?.prayerData||{}, nuvio_user_profile:a?.userProfile||{},
  version:18
 };
}
function applySnapshot(data) {
 if(!data || typeof data!=='object' || !window.app) return;
 applying=true;
 try {
  const a=window.app;
  const get=(key,oldKey)=>data[key]!==undefined?data[key]:data[oldKey];
  const tasks=get('tasks','nuvio_tasks');
  const sessions=get('focusSessions','nuvio_sessions');
  const settings=get('settings','nuvio_settings');
  const notifications=get('notifications','nuvio_notifications');
  const habits=get('habits','nuvio_habits');
  const notes=get('notes','nuvio_notes');
  const sleep=get('sleepRecords','nuvio_sleep');
  const water=get('waterData','nuvio_water');
  const prayer=get('prayerData','nuvio_prayer');
  const profile=get('userProfile','nuvio_user_profile');
  if(Array.isArray(tasks))a.tasks=tasks;
  if(Array.isArray(sessions))a.focusSessions=sessions;
  if(settings&&typeof settings==='object')a.settings={...a.settings,...settings};
  if(Array.isArray(notifications))a.notifications=notifications;
  if(Array.isArray(habits))a.habits=habits;
  if(Array.isArray(notes))a.notes=notes;
  if(Array.isArray(sleep))a.sleepRecords=sleep;
  if(water&&typeof water==='object')a.waterData=water;
  if(prayer&&typeof prayer==='object')a.prayerData=prayer;
  if(profile&&typeof profile==='object')a.userProfile=profile;
  const pairs={nuvio_tasks:a.tasks,nuvio_sessions:a.focusSessions,nuvio_settings:a.settings,
   nuvio_notifications:a.notifications,nuvio_habits:a.habits,nuvio_notes:a.notes,
   nuvio_sleep:a.sleepRecords,nuvio_water:a.waterData,nuvio_prayer:a.prayerData,
   nuvio_user_profile:a.userProfile};
  Object.entries(pairs).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));
  a.applyTheme?.();a.applyLanguage?.();a.renderAll?.();a.renderHabits?.();a.renderNotes?.();
 } finally { applying=false; }
}
async function writeSnapshot() {
 if(!userId || !ready || applying || !navigator.onLine) return;
 const {data:row,error:readError}=await client.from(TABLE)
  .select('version').eq('user_id',userId).maybeSingle();
 if(readError) throw readError;
 const nextVersion=(Number(row?.version)||0)+1;
 const payload={user_id:userId,data:snapshot(),version:nextVersion,updated_at:new Date().toISOString()};
 const {error}=await client.from(TABLE).upsert(payload,{onConflict:'user_id'});
 if(error) throw error;
 lastRemote=Date.parse(payload.updated_at);
}
async function syncNow() {
 if(!userId || !ready || busy || !navigator.onLine) return;
 busy=true;
 try {
  const {data:row,error}=await client.from(TABLE)
   .select('data,updated_at,version').eq('user_id',userId).maybeSingle();
  if(error) throw error;
  const stamp=Date.parse(row?.updated_at||'')||0;
  if(row && stamp>lastRemote) {
   applySnapshot(row.data);
   lastRemote=stamp;
  }
 } catch(e) {
  console.error('Nuvio cloud sync failed:',e);
  window.dispatchEvent(new CustomEvent('nuvio:sync-error',{detail:e.message}));
 } finally {busy=false;}
}
function scheduleSave() {
 if(!userId || applying) { if(!ready) pendingBeforeReady=true; return; }
 clearTimeout(timer);
 timer=setTimeout(async()=>{
  try { await writeSnapshot(); }
  catch(e) {
   console.error('Nuvio cloud save failed:',e);
   window.dispatchEvent(new CustomEvent('nuvio:sync-error',{detail:e.message}));
  }
 },700);
}
async function start(session) {
 const nextUserId=session?.user?.id||null;
 if(nextUserId!==userId) {userId=nextUserId;lastRemote=0;ready=false;}
 if(!userId) return;
 try {
  const {data:row,error}=await client.from(TABLE)
   .select('data,updated_at,version').eq('user_id',userId).maybeSingle();
  if(error) throw error;
  if(row) {
   applySnapshot(row.data);
   lastRemote=Date.parse(row.updated_at||'')||Date.now();
  } else {
   ready=true;
   await writeSnapshot();
  }
  ready=true;
  if(pendingBeforeReady){pendingBeforeReady=false;await writeSnapshot();}
  if(channel) await client.removeChannel(channel);
  channel=client.channel('nuvio-data-'+userId)
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:TABLE,filter:'user_id=eq.'+userId},payload=>{
    const stamp=Date.parse(payload.new?.updated_at||'')||0;
    if(stamp>lastRemote && !applying){applySnapshot(payload.new.data);lastRemote=stamp;}
   }).subscribe();
 } catch(e) {
  ready=false;
  console.error('Nuvio initial sync failed:',e);
  window.dispatchEvent(new CustomEvent('nuvio:sync-error',{detail:e.message}));
 }
}
client.auth.onAuthStateChange((event,session)=>{
 if(event==='SIGNED_OUT'){
  userId=null;ready=false;lastRemote=0;
  if(channel){client.removeChannel(channel);channel=null;}
  return;
 }
 if(session && ['SIGNED_IN','INITIAL_SESSION','TOKEN_REFRESHED','USER_UPDATED'].includes(event))
  setTimeout(()=>start(session),0);
});
window.addEventListener('focus',syncNow);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncNow();});
window.addEventListener('online',syncNow);
window.NuvioSync={scheduleSave,syncNow};
client.auth.getSession().then(({data,error})=>{if(error)throw error;return start(data.session);})
 .catch(e=>console.error('Nuvio sync session failed:',e));
})();