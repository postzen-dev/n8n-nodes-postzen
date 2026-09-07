const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Expression } = require('n8n-workflow');
const { preparePost, prepareProfile, postResponse, deletedResponse, simplifyAccounts } = require('../dist/nodes/Postzen/helpers');
const { Postzen } = require('../dist/nodes/Postzen/Postzen.node');
const { PostzenApi } = require('../dist/credentials/PostzenApi.credentials');

const context = (parameters) => ({
 getNodeParameter(name, fallback) { return Object.hasOwn(parameters, name) ? parameters[name] : fallback; },
 getNode() { return { name: 'PostZen', type: 'n8n-nodes-postzen.postzen', typeVersion: 1, position: [0, 0], parameters }; },
});
const target = { platform: 'linkedin', accountId: 'account-1', settings: '{}' };
const create = (extra = {}) => context({ operation: 'create', postingMode: 'draft', content: 'Hello', ...extra });
const request = { method: 'POST', url: 'https://api.postzen.dev/v1/posts', headers: { Accept: 'application/json' } };

test('drafts accept no targets and do not publish', async () => {
 const result = await preparePost.call(create(), request);
 assert.deepEqual(result.body, { content: 'Hello', isDraft: true, platforms: [] });
});
test('publishing maps target settings and idempotency header', async () => {
 const result = await preparePost.call(create({ postingMode: 'now', targets: { target: [target] }, requestId: 'item-1', media: { item: [{ url: 'https://example.com/photo.png' }] } }), request);
 assert.equal(result.body.publishNow, true);
 assert.equal(result.body.isDraft, undefined);
 assert.deepEqual(result.body.platforms, [{ platform: 'linkedin', accountId: 'account-1' }]);
 assert.equal(result.headers['x-request-id'], 'item-1');
 assert.equal(result.headers.Accept, 'application/json');
});
test('queue mode claims a slot through create, with no scheduledFor', async () => {
 const result = await preparePost.call(create({ postingMode: 'queue', queueProfileId: 'profile-1', queueId: 'queue-1', targets: { target: [target] } }), request);
 assert.equal(result.body.queuedFromProfile, 'profile-1');
 assert.equal(result.body.queueId, 'queue-1');
 for (const key of ['isDraft', 'publishNow', 'scheduledFor']) assert.equal(result.body[key], undefined);
});
test('scheduled posts normalize timezone offsets and reject past or invalid dates', async () => {
 const scheduledFor = '2099-10-01T10:00:00-06:00';
 const result = await preparePost.call(create({ postingMode: 'schedule', scheduledFor, targets: { target: [target] } }), request);
 assert.equal(result.body.scheduledFor, '2099-10-01T16:00:00.000Z');
 for (const value of ['yesterday', '2000-01-01T00:00:00Z']) {
  await assert.rejects(preparePost.call(create({ postingMode: 'schedule', scheduledFor: value }), request), /at least 60 seconds/);
 }
});
test('updates preserve omitted content, timing, targets, and media', async () => {
 const result = await preparePost.call(context({ operation: 'update', updateFields: { title: 'Updated' } }), request);
 assert.deepEqual(result.body, { title: 'Updated' });
});
test('explicit empty content and media clear those fields on update', async () => {
 const result = await preparePost.call(context({ operation: 'update', updateFields: { content: '', tags: '' }, replaceMedia: true }), request);
 assert.deepEqual(result.body, { content: '', tags: [], mediaItems: [] });
});
test('rejects empty updates, missing targets, invalid settings, and excessive media', async () => {
 await assert.rejects(preparePost.call(context({ operation: 'update' }), request), /at least one field/);
 await assert.rejects(preparePost.call(create({ postingMode: 'now' }), request), /at least one target/);
 for (const settings of ['{', '[]', 'null']) {
  await assert.rejects(preparePost.call(create({ targets: { target: [{ ...target, settings }] } }), request), /JSON/);
 }
 await assert.rejects(preparePost.call(create({ media: { item: Array.from({ length: 11 }, () => ({ url: 'https://example.com/a.png' })) } }), request), /at most 10/);
});
test('created and idempotent replay responses return the same post shape and item pairing', async () => {
 const post = { _id: 'post-1', content: 'Hello' };
 for (const body of [{ post }, { existingPost: post }]) {
  assert.deepEqual(await postResponse.call(create(), [{ json: {}, pairedItem: { item: 2 } }], { body }), [{ json: post, pairedItem: { item: 2 } }]);
 }
});
test('delete output confirms success and retains item pairing', async () => {
 assert.deepEqual(await deletedResponse.call(create(), [{ json: {}, pairedItem: { item: 0 } }]), [{ json: { deleted: true }, pairedItem: { item: 0 } }]);
});
test('profile updates validate fields and preserve explicit empty descriptions', async () => {
 const result = await prepareProfile.call(context({ operation: 'update', profileUpdateFields: { description: '' } }), request);
 assert.deepEqual(result.body, { description: '' });
 await assert.rejects(prepareProfile.call(context({ operation: 'create', profileName: '' }), request), /1 to 80/);
 await assert.rejects(prepareProfile.call(context({ operation: 'update', profileUpdateFields: { color: 'red' } }), request), /hex color/);
});
test('account simplification retains at most ten useful fields and supports raw output', async () => {
 const items = [{ json: { _id: 'account-1', platform: 'linkedin', avatarUrl: 'https://example.com/avatar.png', defaultBoardId: 'board-1' } }];
 assert.deepEqual((await simplifyAccounts.call(context({ simplify: true }), items))[0].json, { _id: 'account-1', platform: 'linkedin', defaultBoardId: 'board-1' });
 assert.equal(await simplifyAccounts.call(context({ simplify: false }), items), items);
});

test('pagination expressions advance pages and stop at requested limits or last page', () => {
 const node = new Postzen();
 const expression = new Expression('UTC');
 for (const resource of ['account', 'post']) {
  const prop = node.description.properties.find(p => p.name === 'returnAll' && p.displayOptions.show.resource.includes(resource));
  assert.equal(prop.routing.send.paginate, true);
  const pagination = prop.routing.operations.pagination.properties;
  const evaluate = (value, parameters, page = 1, totalPages = 3) => expression.resolveSimpleParameterValue(value, {
   $parameter: parameters, $request: { qs: { limit: 100, profileId: 'profile-1' } },
   $response: { body: { pagination: { page, limit: 100, totalPages } } },
  });
  assert.equal(expression.resolveSimpleParameterValue(pagination.request.qs.page, { $response: {} }), 1);
  assert.equal(evaluate(pagination.request.qs.limit, {}), 100);
  assert.equal(evaluate(pagination.request.qs.profileId, {}), 'profile-1');
  assert.equal(evaluate(pagination.request.qs.page, {}, 1), 2);
  assert.equal(evaluate(pagination.continue, { returnAll: true }), true);
  assert.equal(evaluate(pagination.continue, { returnAll: false, limit: 50 }), false);
  assert.equal(evaluate(pagination.continue, { returnAll: false, limit: 150 }), true);
  assert.equal(evaluate(pagination.continue, { returnAll: false, limit: 150 }, 2), false);
  assert.equal(evaluate(pagination.continue, { returnAll: true }, 3), false);
 }
});
test('credentials test uses a read-only endpoint and authentication stays in credentials', () => {
 const credential = new PostzenApi();
 assert.equal(credential.test.request.url, '/v1/profiles');
 assert.equal(credential.test.request.method, 'GET');
 assert.equal(credential.properties[0].typeOptions.password, true);
 assert.equal(credential.authenticate.properties.headers.Authorization, '=Bearer {{$credentials.apiKey}}');
 assert.equal(new Postzen().description.requestDefaults.baseURL, 'https://api.postzen.dev');
});
test('resource IDs are encoded in URLs', () => {
 const expression = new Expression('UTC');
 const operation = new Postzen().description.properties.find(p => p.name === 'operation' && p.displayOptions.show.resource[0] === 'post');
 const url = operation.options.find(o => o.value === 'get').routing.request.url;
 assert.equal(expression.resolveSimpleParameterValue(url, { $parameter: { postId: 'a/b?x=1' } }), '/v1/posts/a%2Fb%3Fx%3D1');
});
