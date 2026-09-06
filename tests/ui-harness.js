import fs from 'node:fs';
import * as utils from '../js/order-utils.js';

function element() {
  const children=new Map(),listeners={};
  return {value:'',checked:false,disabled:false,hidden:false,open:false,innerHTML:'',textContent:'',fields:{},dataset:{},listeners,
    classList:{add(){},remove(){},toggle(){}},
    querySelector(selector){if(!children.has(selector))children.set(selector,element());return children.get(selector);},
    querySelectorAll(){return [];},closest(){return this;},setAttribute(name,value){this[name]=value;},getAttribute(name){return this[name]??null;},removeAttribute(name){delete this[name];},
    setCustomValidity(message){this.validationMessage=message;},reportValidity(){return !this.validationMessage;},
    addEventListener(name,callback){listeners[name]=callback;},showModal(){this.open=true;},close(){this.open=false;}
  };
}
export function harness(type,initial={}) {
  const nodes=new Map(),writes=[],opened=[],callbacks={},dbData={stores:{'acai-da-bea':{}},products:{},optionGroups:{},options:{},admins:{},...structuredClone(initial)};
  const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
  const docSnap=ref=>({id:ref.id,exists:()=>Boolean(dbData[ref.name]?.[ref.id]),data:()=>dbData[ref.name]?.[ref.id]});
  const querySnap=ref=>{const docs=Object.entries(dbData[ref.name]||{}).map(([id,data])=>({id,data:()=>data}));return {docs,empty:!docs.length};};
  const env={
    document:{getElementById:get,querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,clearTimeout(){},console:{error(){}},firebaseConfigured:true,db:{},auth:{currentUser:{uid:'qa-owner'}},STORE_ID:'acai-da-bea',
    FormData:class{constructor(form){this.fields=form.fields;}get(id){return this.fields[id]??null;}getAll(id){const value=this.fields[id];return value==null?[]:Array.isArray(value)?value:[value];}},
    window:{open:()=>{const popup={closed:false,location:{replace:url=>popup.url=url},close(){this.closed=true;}};opened.push(popup);return popup;}},
    watchStoreData:callback=>callbacks.store=callback,watchCollectionData:(name,callback)=>callbacks[name]=callback,
    getCurrentCatalog:async()=>({store:dbData.stores['acai-da-bea'],products:Object.entries(dbData.products).map(([id,d])=>({...d,id})),groups:Object.entries(dbData.optionGroups).map(([id,d])=>({...d,id})),options:Object.entries(dbData.options).map(([id,d])=>({...d,id}))}),
    doc:(_,name,id)=>({name,id}),collection:(_,name)=>({name}),query:ref=>ref,where:()=>({}),getDoc:async ref=>docSnap(ref),getDocsFromServer:async ref=>querySnap(ref),onSnapshot:()=>()=>{},
    setDoc:async(ref,data,options)=>{writes.push({ref,data,options});dbData[ref.name]??={};dbData[ref.name][ref.id]=options?.merge?{...dbData[ref.name][ref.id],...data}:data;},
    updateDoc:async(ref,data)=>{writes.push({ref,data,update:true});dbData[ref.name]??={};dbData[ref.name][ref.id]={...dbData[ref.name][ref.id],...data};},
    runTransaction:async(_,callback)=>{
      const pending=[];
      await callback({get:async ref=>{if(ref.name!=='stores'&&!dbData[ref.name]?.[ref.id])throw Error('rules: cannot read absent document');return docSnap(ref);},set:(ref,data,options)=>pending.push({ref,data,options})});
      for(const entry of pending){writes.push(entry);dbData[entry.ref.name]??={};dbData[entry.ref.name][entry.ref.id]=entry.options?.merge?{...dbData[entry.ref.name][entry.ref.id],...entry.data}:entry.data;}
    },onAuthStateChanged(){},signInWithEmailAndPassword:async()=>{},signOut:async()=>{}
  };
  const names=type==='app'?['state','els','init','openProduct','addCurrentProduct','renderCart','updateProductPrice','reconcileCurrentCart','handleCheckout','syncCatalog','checkoutPayload']:['state','bind','readPrice','saveRecord','seedEmptyCollections','updateSeedButtons','verify','renderRules'];
  const path=type==='app'?'../js/app.js':'../admin/admin.js';
  const source=fs.readFileSync(new URL(path,import.meta.url),'utf8');
  const code=source.replace(/^import .*;\n/gm,'').replace(/init\(\);\s*$/,'')+'\nreturn {'+names.join(',')+'};';
  const api=new Function(...Object.keys(env),...Object.keys(utils),code)(...Object.values(env),...Object.values(utils));
  return {api,get,writes,opened,callbacks,dbData,env};
}
