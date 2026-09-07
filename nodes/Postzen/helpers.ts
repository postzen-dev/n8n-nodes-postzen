import {
	NodeOperationError,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type IN8nHttpFullResponse,
} from 'n8n-workflow';

function fail(context: IExecuteSingleFunctions, message: string): never {
	throw new NodeOperationError(context.getNode(), message);
}

function object(value: unknown, context: IExecuteSingleFunctions, label: string): IDataObject {
	let parsed = value;
	if (typeof value === 'string') {
		try {
			parsed = JSON.parse(value);
		} catch {
			fail(context, `${label} must contain valid JSON`);
		}
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		fail(context, `${label} must be a JSON object`);
	}
	return parsed as IDataObject;
}

export async function preparePost(
	this: IExecuteSingleFunctions,
	request: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const operation = this.getNodeParameter('operation') as string;
	const update = operation === 'update';
	const fields = this.getNodeParameter(
		update ? 'updateFields' : 'additionalFields',
		{},
	) as IDataObject;
	const body: IDataObject = {};
	for (const key of ['title', 'content', 'timezone']) {
		if (fields[key] !== undefined) body[key] = fields[key];
	}
	if (!update) body.content = this.getNodeParameter('content', '') as string;
	if (fields.tags !== undefined)
		body.tags = (fields.tags as string)
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean);
	const mode = this.getNodeParameter('postingMode', update ? 'keep' : 'draft') as string;
	if (mode === 'draft') body.isDraft = true;
	else if (mode === 'now') body.publishNow = true;
	else if (mode === 'schedule') {
		const date = new Date(this.getNodeParameter('scheduledFor') as string);
		if (!Number.isFinite(date.getTime()) || date.getTime() < Date.now() + 60_000) {
			fail(this, 'Scheduled For must be at least 60 seconds in the future');
		}
		body.scheduledFor = date.toISOString();
	} else if (mode === 'queue') {
		const profile = (this.getNodeParameter('queueProfileId', '') as string).trim();
		if (!profile) fail(this, 'Profile ID is required to add a post to a queue');
		body.queuedFromProfile = profile;
		const queue = (this.getNodeParameter('queueId', '') as string).trim();
		if (queue) body.queueId = queue;
	} else if (mode !== 'keep' || !update) fail(this, 'Choose a posting mode');

	const replaceTargets = !update || this.getNodeParameter('replaceTargets', false);
	if (replaceTargets) {
		const collection = this.getNodeParameter('targets', {}) as {
			target?: Array<{
				platform: string;
				accountId: string;
				customContent?: string;
				settings?: unknown;
			}>;
		};
		const targets = collection.target ?? [];
		if (targets.length === 0 && mode !== 'draft')
			fail(this, 'Add at least one target account, or choose Save as Draft');
		body.platforms = targets.map((target) => {
			if (!target.accountId?.trim()) fail(this, 'Account ID is required for each target');
			const result: IDataObject = { platform: target.platform, accountId: target.accountId.trim() };
			// Empty override means use shared text; do not send an empty override by default.
			if (target.customContent) result.customContent = target.customContent;
			const settings = object(target.settings ?? {}, this, 'Platform Settings');
			if (Object.keys(settings).length) result.settings = settings;
			return result;
		});
	}
	const replaceMedia = !update || this.getNodeParameter('replaceMedia', false);
	if (replaceMedia) {
		const collection = this.getNodeParameter('media', {}) as {
			item?: Array<{ url: string; title?: string }>;
		};
		const media = collection.item ?? [];
		if (media.length > 10) fail(this, 'A post can contain at most 10 media items');
		for (const item of media) {
			if (!/^https?:\/\/[^\s]+$/i.test(item.url))
				fail(this, 'Each media URL must start with http:// or https://');
		}
		if (update || media.length) body.mediaItems = media;
	}
	if (update && Object.keys(body).length === 0) fail(this, 'Choose at least one field to update');
	const result = { ...request, body };
	if (!update) {
		const requestId = (this.getNodeParameter('requestId', '') as string).trim();
		if (requestId) result.headers = { ...request.headers, 'x-request-id': requestId };
	}
	return result;
}

export async function prepareProfile(
	this: IExecuteSingleFunctions,
	request: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const update = this.getNodeParameter('operation') === 'update';
	const body = {
		...(this.getNodeParameter(
			update ? 'profileUpdateFields' : 'profileAdditionalFields',
			{},
		) as IDataObject),
	};
	if (!update) body.name = this.getNodeParameter('profileName') as string;
	if (
		body.name !== undefined &&
		(typeof body.name !== 'string' || !body.name.trim() || body.name.length > 80)
	)
		fail(this, 'Name must contain 1 to 80 characters');
	if (body.description !== undefined && String(body.description).length > 240)
		fail(this, 'Description must contain at most 240 characters');
	if (body.color !== undefined && !/^#[0-9a-f]{6}$/i.test(String(body.color)))
		fail(this, 'Color must be a six-digit hex color, such as #ffeda0');
	if (!Object.keys(body).length) fail(this, 'Choose at least one field to update');
	return { ...request, body };
}

export async function postResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const body = response.body as IDataObject;
	const post = body.post ?? body.existingPost;
	if (!post || typeof post !== 'object') fail(this, 'PostZen returned no post in the response');
	return [{ json: post as IDataObject, pairedItem: items[0]?.pairedItem }];
}

export async function deletedResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	return [{ json: { deleted: true }, pairedItem: items[0]?.pairedItem }];
}

export async function simplifyAccounts(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	if (!this.getNodeParameter('simplify', true)) return items;
	const keys = [
		'_id',
		'platform',
		'providerAccountId',
		'profileId',
		'username',
		'displayName',
		'status',
		'isActive',
		'defaultBoardId',
		'connectedAt',
	];
	return items.map((item) => ({
		...item,
		json: Object.fromEntries(
			keys.filter((key) => item.json[key] !== undefined).map((key) => [key, item.json[key]]),
		),
	}));
}

export async function toolAccountOutput(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const output = this.getNodeParameter('output', 'simplified');
	if (output === 'raw') return items;
	const fields =
		output === 'selected'
			? ['_id', ...(this.getNodeParameter('outputFields', []) as string[])]
			: [
					'_id',
					'platform',
					'providerAccountId',
					'profileId',
					'username',
					'displayName',
					'status',
					'isActive',
					'defaultBoardId',
					'connectedAt',
				];
	return items.map((item) => ({
		...item,
		json: Object.fromEntries(
			fields.filter((key) => item.json[key] !== undefined).map((key) => [key, item.json[key]]),
		),
	}));
}
