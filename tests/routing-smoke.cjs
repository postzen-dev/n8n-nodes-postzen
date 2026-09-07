const assert = require('node:assert/strict');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
if (!process.argv[2]) throw new Error('Pass the node_modules directory of a locally installed n8n instance');
const { RoutingNode } = require(path.resolve(process.argv[2], 'n8n-core/dist/execution-engine/routing-node.js'));
const { Postzen } = require(base + '/dist/nodes/Postzen/Postzen.node');
const { Expression } = require(base + '/node_modules/n8n-workflow');
const nodeType = new Postzen();
const expression = new Expression('UTC');
async function run(resource, parameters, response) {
 const node = { name: 'PostZen', type: 'n8n-nodes-postzen.postzen', typeVersion: 1, parameters: { resource, ...parameters } };
 const router = new RoutingNode({ node, nodeType }, nodeType);
 const evaluate = (value, data = {}) => {
  if (typeof value === 'string' && value.startsWith('=')) return expression.resolveSimpleParameterValue(value, { $parameter: node.parameters, ...data });
  if (Array.isArray(value)) return value.map(v => evaluate(v, data));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,evaluate(v,data)]));
  return value;
 };
 router.getParameterValue = (value,i,r,e,data) => evaluate(value,data);
 const calls = [];
 const ctx = {
  getNode: () => node, getExecuteData: () => ({}),
  getNodeParameter: (name, fallback) => {
   let value = name.split('.').reduce((v,k) => v?.[k], node.parameters);
   if (value !== undefined) return value;
   if (fallback !== undefined) return fallback;
   return nodeType.description.properties.find(p => p.name === name && (!p.displayOptions?.show?.resource || p.displayOptions.show.resource.includes(resource)))?.default;
  },
  helpers: { httpRequest: async req => { calls.push(structuredClone(req)); assert.ok(calls.length < 8, 'Pagination failed to terminate'); return { body: response(req,calls.length), statusCode: 200, headers: {} }; } },
 };
 const data = { options: {...nodeType.description.requestDefaults,body:{},qs:{}},preSend:[],postReceive:[],requestOperations:{} };
 // Apply actual n8n visibility, option routing, collection fields, and merge logic.
 for (const prop of nodeType.description.properties) router.mergeOptions(data,router.getRequestOptionsFromParameters(ctx,prop,0,0,''));
 const result = await router.makeRequest(data,ctx,0,0,undefined,data.requestOperations);
 if (data.maxResults) result.splice(data.maxResults);
 return {calls,result};
}
(async () => {
 for (const resource of ['post','account']) {
  const {calls,result}=await run(resource,{operation:'getAll',returnAll:false,limit:150,simplify:true,filters:{profileId:'profile-1'}},(req,page)=>({[resource+'s']:Array.from({length:100},(_,i)=>({_id: `${page}-${i}`,platform:'linkedin'})),pagination:{page: req.qs.page,limit:100,totalPages:3}}));
  assert.deepEqual(calls.map(c=>c.qs.page),[1,2]);
  assert.ok(calls.every(c=>c.qs.profileId==='profile-1' && c.qs.limit===100));
  assert.equal(result.length,150);
  assert.equal(result[0].json._id,'1-0');
 }
 const {calls,result}=await run('post',{operation:'create',postingMode:'draft',content:'Hello',additionalFields:{},targets:{},media:{}},()=>({post:{_id:'draft-1'}}));
 assert.deepEqual(calls[0].body,{content:'Hello',isDraft:true,platforms:[]});
 assert.equal(result[0].json._id,'draft-1');
 console.log('Actual n8n RoutingNode: post/account pagination, filters, limits, request hooks, and response hooks passed');
})().catch(error=>{ console.error(error);process.exitCode=1; });
