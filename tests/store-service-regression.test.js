import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCheckoutReadPlan, mergeFreshDocuments } from '../js/catalog-read-plan.js';

function makeSnap(id, data) {
  return { id, exists:()=>Boolean(data), data:()=>data };
}
function makeQuerySnap(collection) {
  return { docs:Object.entries(collection).map(([id,data])=>({id,data:()=>data})) };
}

function serviceHarness({failDirectPath=null}={}) {
  const data={
    stores:{'acai-da-bea':{name:'Açaí da Bea',whatsapp:'5585921455990'}},
    products:{'acai-330':{storeId:'acai-da-bea',name:'Açaí 330',priceCents:1484,available:true,order:1}},
    optionGroups:{'acai-cremes':{storeId:'acai-da-bea',name:'Açaí e cremes',available:true,order:1}},
    options:{base:{storeId:'acai-da-bea',groupId:'acai-cremes',name:'Açaí tradicional',available:true,extraPriceCents:0,order:1}}
  };
  const directReads=[], fullReads=[], warnings=[];
  const source=fs.readFileSync(new URL('../js/store-service.js',import.meta.url),'utf8');
  const body=source.slice(source.indexOf('const normalize'))
    .replace(/export /g,'')+
    '\nreturn {getCollectionData,getCurrentCatalog};';
  const env={
    db:{},firebaseConfigured:true,STORE_ID:'acai-da-bea',buildCheckoutReadPlan,mergeFreshDocuments,
    collection:(_,name)=>({name}),doc:(_,name,id)=>({name,id}),query:ref=>ref,where:()=>({}),
    getDoc:async ref=>makeSnap(ref.id,data[ref.name]?.[ref.id]),
    getDocs:async ref=>makeQuerySnap(data[ref.name]||{}),
    getDocFromServer:async ref=>{
      directReads.push(`${ref.name}/${ref.id}`);
      if(failDirectPath===`${ref.name}/${ref.id}`)throw new Error('falha seletiva simulada');
      return makeSnap(ref.id,data[ref.name]?.[ref.id]);
    },
    getDocsFromServer:async ref=>{fullReads.push(ref.name);return makeQuerySnap(data[ref.name]||{});},
    onSnapshot:()=>()=>{},
    console:{error(){},warn:(...args)=>warnings.push(args.join(' '))}
  };
  const api=new Function(...Object.keys(env),body)(...Object.values(env));
  return {api,directReads,fullReads,warnings};
}

const cart=[{id:'acai-330',selectionIds:{'acai-cremes':['base']},selections:{'acai-cremes':['Açaí tradicional']}}];

test('conferência seletiva lê diretamente apenas os documentos usados',async()=>{
  const h=serviceHarness();
  await h.api.getCollectionData('products');
  await h.api.getCollectionData('optionGroups');
  await h.api.getCollectionData('options');
  const result=await h.api.getCurrentCatalog(cart);
  assert.equal(result.products[0].id,'acai-330');
  assert.ok(h.directReads.includes('stores/acai-da-bea'));
  assert.ok(h.directReads.includes('products/acai-330'));
  assert.ok(h.directReads.includes('optionGroups/acai-cremes'));
  assert.ok(h.directReads.includes('options/base'));
  assert.deepEqual(h.fullReads,[]);
});

test('falha seletiva cai para catálogo completo em vez de quebrar o checkout',async()=>{
  const h=serviceHarness({failDirectPath:'options/base'});
  await h.api.getCollectionData('products');
  await h.api.getCollectionData('optionGroups');
  await h.api.getCollectionData('options');
  const result=await h.api.getCurrentCatalog(cart);
  assert.equal(result.products[0].id,'acai-330');
  assert.ok(h.fullReads.includes('products'));
  assert.ok(h.fullReads.includes('optionGroups'));
  assert.ok(h.fullReads.includes('options'));
  assert.equal(h.warnings.length,1);
});
