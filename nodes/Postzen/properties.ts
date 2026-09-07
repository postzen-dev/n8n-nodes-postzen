import type { INodeProperties } from 'n8n-workflow';
import {
	preparePost,
	prepareProfile,
	postResponse,
	deletedResponse,
	simplifyAccounts,
	toolAccountOutput,
} from './helpers';

export const properties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		default: 'post',
		noDataExpression: true,
		options: [
			{
				name: 'Account',
				value: 'account',
			},
			{
				name: 'Media',
				value: 'media',
			},
			{
				name: 'Post',
				value: 'post',
			},
			{
				name: 'Profile',
				value: 'profile',
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'getAll',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: [
			{
				name: 'Disconnect',
				value: 'disconnect',
				action: 'Disconnect account',
				description: 'Disconnect a social account from PostZen',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/v1/accounts/{{encodeURIComponent($parameter.accountId)}}',
					},
					output: {
						postReceive: [deletedResponse],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get accounts',
				description: 'Get connected social accounts',
				routing: {
					request: {
						method: 'GET',
						url: '/v1/accounts',
						qs: {
							page: 1,
							limit: '={{$parameter.returnAll ? 100 : Math.min($parameter.limit, 100)}}',
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'accounts',
								},
							},
						],
					},
				},
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'createUploadUrl',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['media'],
			},
		},
		options: [
			{
				name: 'Create Upload URL',
				value: 'createUploadUrl',
				action: 'Create media upload URL',
				description: 'Create a URL for uploading a file to PostZen',
				routing: {
					request: {
						method: 'POST',
						url: '/v1/media/presign',
					},
				},
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'create',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['post'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create post',
				description: 'Create a post',
				routing: {
					request: {
						method: 'POST',
						url: '/v1/posts',
					},
					output: {
						postReceive: [postResponse],
					},
					send: {
						preSend: [preparePost],
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete post',
				description: 'Delete a post',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/v1/posts/{{encodeURIComponent($parameter.postId)}}',
					},
					output: {
						postReceive: [deletedResponse],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get post',
				description: 'Get a post',
				routing: {
					request: {
						method: 'GET',
						url: '=/v1/posts/{{encodeURIComponent($parameter.postId)}}',
					},
					output: {
						postReceive: [postResponse],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many posts',
				description: 'Get Many posts',
				routing: {
					request: {
						method: 'GET',
						url: '/v1/posts',
						qs: {
							page: 1,
							limit: '={{$parameter.returnAll ? 100 : Math.min($parameter.limit, 100)}}',
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'posts',
								},
							},
						],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update post',
				description: 'Update a post',
				routing: {
					request: {
						method: 'PUT',
						url: '=/v1/posts/{{encodeURIComponent($parameter.postId)}}',
					},
					output: {
						postReceive: [postResponse],
					},
					send: {
						preSend: [preparePost],
					},
				},
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'create',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['profile'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create profile',
				description: 'Create a profile',
				routing: {
					request: {
						method: 'POST',
						url: '/v1/profiles',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'profile',
								},
							},
						],
					},
					send: {
						preSend: [prepareProfile],
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete profile',
				description: 'Delete a profile',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/v1/profiles/{{encodeURIComponent($parameter.profileId)}}',
					},
					output: {
						postReceive: [deletedResponse],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get profile',
				description: 'Get a profile',
				routing: {
					request: {
						method: 'GET',
						url: '=/v1/profiles/{{encodeURIComponent($parameter.profileId)}}',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'profile',
								},
							},
						],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many profiles',
				description: 'Get Many profiles',
				routing: {
					request: {
						method: 'GET',
						url: '/v1/profiles',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'profiles',
								},
							},
						],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update profile',
				description: 'Update a profile',
				routing: {
					request: {
						method: 'PUT',
						url: '=/v1/profiles/{{encodeURIComponent($parameter.profileId)}}',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'profile',
								},
							},
						],
					},
					send: {
						preSend: [prepareProfile],
					},
				},
			},
		],
	},
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'The PostZen post ID',
	},
	{
		displayName: 'Profile ID',
		name: 'profileId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['profile'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'The PostZen profile ID',
	},
	{
		displayName: 'Account ID',
		name: 'accountId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['disconnect'],
			},
		},
		description: 'The PostZen account ID',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAll'],
			},
		},
		routing: {
			send: {
				paginate: true,
			},
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue:
							'={{$response.body.pagination.page < $response.body.pagination.totalPages && ($parameter.returnAll || $response.body.pagination.page * $response.body.pagination.limit < $parameter.limit)}}',
						request: {
							qs: {
								page: '={{$response.body?.pagination?.page ? $response.body.pagination.page + 1 : 1}}',
								limit: '={{$request.qs.limit}}',
								profileId: '={{$request.qs.profileId}}',
								accountId: '={{$request.qs.accountId}}',
								platform: '={{$request.qs.platform}}',
								status: '={{$request.qs.status}}',
								dateFrom: '={{$request.qs.dateFrom}}',
								dateTo: '={{$request.qs.dateTo}}',
								sortBy: '={{$request.qs.sortBy}}',
							},
						},
					},
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		routing: {
			output: {
				maxResults: '={{$value}}',
			},
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		options: [
			{
				displayName: 'Platform',
				name: 'platform',
				type: 'options',
				default: 'x',
				options: [
					{
						name: 'Bluesky',
						value: 'bluesky',
					},
					{
						name: 'Facebook',
						value: 'facebook',
					},
					{
						name: 'Instagram',
						value: 'instagram',
					},
					{
						name: 'LinkedIn',
						value: 'linkedin',
					},
					{
						name: 'Pinterest',
						value: 'pinterest',
					},
					{
						name: 'Telegram',
						value: 'telegram',
					},
					{
						name: 'Threads',
						value: 'threads',
					},
					{
						name: 'TikTok',
						value: 'tiktok',
					},
					{
						name: 'X',
						value: 'x',
					},
					{
						name: 'YouTube',
						value: 'youtube',
					},
				],
				routing: {
					send: {
						type: 'query',
						property: 'platform',
					},
				},
			},
			{
				displayName: 'Profile ID',
				name: 'profileId',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'query',
						property: 'profileId',
					},
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'connected',
				options: [
					{
						name: 'Connected',
						value: 'connected',
					},
					{
						name: 'Disconnected',
						value: 'disconnected',
					},
				],
				routing: {
					send: {
						type: 'query',
						property: 'status',
					},
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['getAll'],
			},
		},
		routing: {
			send: {
				paginate: true,
			},
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue:
							'={{$response.body.pagination.page < $response.body.pagination.totalPages && ($parameter.returnAll || $response.body.pagination.page * $response.body.pagination.limit < $parameter.limit)}}',
						request: {
							qs: {
								page: '={{$response.body?.pagination?.page ? $response.body.pagination.page + 1 : 1}}',
								limit: '={{$request.qs.limit}}',
								profileId: '={{$request.qs.profileId}}',
								accountId: '={{$request.qs.accountId}}',
								platform: '={{$request.qs.platform}}',
								status: '={{$request.qs.status}}',
								dateFrom: '={{$request.qs.dateFrom}}',
								dateTo: '={{$request.qs.dateTo}}',
								sortBy: '={{$request.qs.sortBy}}',
							},
						},
					},
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		routing: {
			output: {
				maxResults: '={{$value}}',
			},
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		options: [
			{
				displayName: 'Account ID',
				name: 'accountId',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'query',
						property: 'accountId',
					},
				},
			},
			{
				displayName: 'Date From',
				name: 'dateFrom',
				type: 'dateTime',
				default: '',
				routing: {
					send: {
						type: 'query',
						property: 'dateFrom',
					},
				},
			},
			{
				displayName: 'Date To',
				name: 'dateTo',
				type: 'dateTime',
				default: '',
				routing: {
					send: {
						type: 'query',
						property: 'dateTo',
					},
				},
			},
			{
				displayName: 'Platform',
				name: 'platform',
				type: 'options',
				default: 'x',
				options: [
					{
						name: 'Bluesky',
						value: 'bluesky',
					},
					{
						name: 'Facebook',
						value: 'facebook',
					},
					{
						name: 'Instagram',
						value: 'instagram',
					},
					{
						name: 'LinkedIn',
						value: 'linkedin',
					},
					{
						name: 'Pinterest',
						value: 'pinterest',
					},
					{
						name: 'Telegram',
						value: 'telegram',
					},
					{
						name: 'Threads',
						value: 'threads',
					},
					{
						name: 'TikTok',
						value: 'tiktok',
					},
					{
						name: 'X',
						value: 'x',
					},
					{
						name: 'YouTube',
						value: 'youtube',
					},
				],
				routing: {
					send: {
						type: 'query',
						property: 'platform',
					},
				},
			},
			{
				displayName: 'Profile ID',
				name: 'profileId',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'query',
						property: 'profileId',
					},
				},
			},
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				default: 'createdAt',
				options: [
					{
						name: 'Created At',
						value: 'createdAt',
					},
					{
						name: 'Scheduled For',
						value: 'scheduledFor',
					},
				],
				routing: {
					send: {
						type: 'query',
						property: 'sortBy',
					},
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'draft',
				options: [
					{
						name: 'Canceled',
						value: 'canceled',
					},
					{
						name: 'Draft',
						value: 'draft',
					},
					{
						name: 'Failed',
						value: 'failed',
					},
					{
						name: 'Partially Failed',
						value: 'partially_failed',
					},
					{
						name: 'Published',
						value: 'published',
					},
					{
						name: 'Publishing',
						value: 'publishing',
					},
					{
						name: 'Queued',
						value: 'queued',
					},
					{
						name: 'Scheduled',
						value: 'scheduled',
					},
				],
				routing: {
					send: {
						type: 'query',
						property: 'status',
					},
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['profile'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['profile'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		routing: {
			output: {
				maxResults: '={{$value}}',
			},
		},
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of the raw data',
		displayOptions: {
			show: {
				resource: ['account'],
				'@tool': [false],
				operation: ['getAll'],
			},
		},
		routing: {
			output: {
				postReceive: [simplifyAccounts],
			},
		},
	},
	{
		displayName: 'Posting Mode',
		name: 'postingMode',
		type: 'options',
		default: 'draft',
		options: [
			{
				name: 'Add to Queue',
				value: 'queue',
			},
			{
				name: 'Publish Now',
				value: 'now',
			},
			{
				name: 'Save as Draft',
				value: 'draft',
			},
			{
				name: 'Schedule',
				value: 'schedule',
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Posting Mode',
		name: 'postingMode',
		type: 'options',
		default: 'keep',
		options: [
			{
				name: 'Add to Queue',
				value: 'queue',
			},
			{
				name: 'Keep Current Mode',
				value: 'keep',
			},
			{
				name: 'Publish Now',
				value: 'now',
			},
			{
				name: 'Save as Draft',
				value: 'draft',
			},
			{
				name: 'Schedule',
				value: 'schedule',
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		default: '',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['create'],
			},
		},
		description: 'Shared text for the selected social accounts',
	},
	{
		displayName: 'Scheduled For',
		name: 'scheduledFor',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['create', 'update'],
				postingMode: ['schedule'],
			},
		},
		description: 'Publish time at least 60 seconds in the future',
	},
	{
		displayName: 'Profile ID',
		name: 'queueProfileId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['create', 'update'],
				postingMode: ['queue'],
			},
		},
		description: 'Profile whose queue will place the post in the next available slot',
	},
	{
		displayName: 'Queue ID',
		name: 'queueId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['create', 'update'],
				postingMode: ['queue'],
			},
		},
		description: 'Leave empty to use the profile default queue',
	},
	{
		displayName: 'Replace Target Accounts',
		name: 'replaceTargets',
		type: 'boolean',
		default: false,
		description: 'Whether to replace all target accounts on the post',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Target Accounts',
		name: 'targets',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Target Account',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				displayName: 'Target',
				name: 'target',
				values: [
					{
						displayName: 'Platform',
						name: 'platform',
						type: 'options',
						default: 'linkedin',
						options: [
							{
								name: 'Bluesky',
								value: 'bluesky',
							},
							{
								name: 'Facebook',
								value: 'facebook',
							},
							{
								name: 'Instagram',
								value: 'instagram',
							},
							{
								name: 'LinkedIn',
								value: 'linkedin',
							},
							{
								name: 'Pinterest',
								value: 'pinterest',
							},
							{
								name: 'Telegram',
								value: 'telegram',
							},
							{
								name: 'Threads',
								value: 'threads',
							},
							{
								name: 'TikTok',
								value: 'tiktok',
							},
							{
								name: 'X',
								value: 'x',
							},
							{
								name: 'YouTube',
								value: 'youtube',
							},
						],
					},
					{
						displayName: 'Account ID',
						name: 'accountId',
						type: 'string',
						default: '',
						required: true,
						description: 'PostZen account ID from Account: Get Many',
					},
					{
						displayName: 'Custom Content',
						name: 'customContent',
						type: 'string',
						default: '',
						typeOptions: {
							rows: 3,
						},
						description: 'Leave empty to use the shared content',
					},
					{
						displayName: 'Platform Settings',
						name: 'settings',
						type: 'json',
						default: '{}',
						description: 'Platform-specific settings from the PostZen API documentation',
					},
				],
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Target Accounts',
		name: 'targets',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Target Account',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				displayName: 'Target',
				name: 'target',
				values: [
					{
						displayName: 'Platform',
						name: 'platform',
						type: 'options',
						default: 'linkedin',
						options: [
							{
								name: 'Bluesky',
								value: 'bluesky',
							},
							{
								name: 'Facebook',
								value: 'facebook',
							},
							{
								name: 'Instagram',
								value: 'instagram',
							},
							{
								name: 'LinkedIn',
								value: 'linkedin',
							},
							{
								name: 'Pinterest',
								value: 'pinterest',
							},
							{
								name: 'Telegram',
								value: 'telegram',
							},
							{
								name: 'Threads',
								value: 'threads',
							},
							{
								name: 'TikTok',
								value: 'tiktok',
							},
							{
								name: 'X',
								value: 'x',
							},
							{
								name: 'YouTube',
								value: 'youtube',
							},
						],
					},
					{
						displayName: 'Account ID',
						name: 'accountId',
						type: 'string',
						default: '',
						required: true,
						description: 'PostZen account ID from Account: Get Many',
					},
					{
						displayName: 'Custom Content',
						name: 'customContent',
						type: 'string',
						default: '',
						typeOptions: {
							rows: 3,
						},
						description: 'Leave empty to use the shared content',
					},
					{
						displayName: 'Platform Settings',
						name: 'settings',
						type: 'json',
						default: '{}',
						description: 'Platform-specific settings from the PostZen API documentation',
					},
				],
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['update'],
				replaceTargets: [true],
			},
		},
	},
	{
		displayName: 'Replace Media',
		name: 'replaceMedia',
		type: 'boolean',
		default: false,
		description: 'Whether to replace all media on the post; an empty list removes existing media',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Media',
		name: 'media',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Media',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				displayName: 'Item',
				name: 'item',
				values: [
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'e.g. https://example.com/image.png',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Optional alt text or title',
					},
				],
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Media',
		name: 'media',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Media',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				displayName: 'Item',
				name: 'item',
				values: [
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'e.g. https://example.com/image.png',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Optional alt text or title',
					},
				],
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['update'],
				replaceMedia: [true],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		options: [
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				description: 'Comma-separated internal tags',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: 'UTC',
				description: 'IANA timezone, such as America/Edmonton',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Internal title; also used as the fallback YouTube video title',
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		options: [
			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 4,
				},
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				description: 'Comma-separated internal tags',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: 'UTC',
				description: 'IANA timezone, such as America/Edmonton',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Internal title; also used as the fallback YouTube video title',
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['create'],
			},
		},
		description:
			'Optional unique idempotency key. Reuse only when retrying the same post. Use a different value for each new post.',
	},
	{
		displayName: 'Name',
		name: 'profileName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['profile'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'profileAdditionalFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		options: [
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: '#ffeda0',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
		],
		displayOptions: {
			show: {
				resource: ['profile'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'profileUpdateFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		options: [
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: '#ffeda0',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Default Profile',
				name: 'isDefault',
				type: 'boolean',
				default: true,
				description: 'Whether to make this the default profile',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
		],
		displayOptions: {
			show: {
				resource: ['profile'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Filename',
		name: 'filename',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. launchVideo.mp4',
		displayOptions: {
			show: {
				resource: ['media'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'filename',
			},
		},
	},
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'options',
		default: 'image/png',
		required: true,
		options: [
			{
				name: 'GIF',
				value: 'image/gif',
			},
			{
				name: 'JPEG',
				value: 'image/jpeg',
			},
			{
				name: 'MP4',
				value: 'video/mp4',
			},
			{
				name: 'MPEG',
				value: 'video/mpeg',
			},
			{
				name: 'PDF',
				value: 'application/pdf',
			},
			{
				name: 'PNG',
				value: 'image/png',
			},
			{
				name: 'QuickTime',
				value: 'video/quicktime',
			},
			{
				name: 'WebM',
				value: 'video/webm',
			},
			{
				name: 'WebP',
				value: 'image/webp',
			},
		],
		displayOptions: {
			show: {
				resource: ['media'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'contentType',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'mediaAdditionalFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		options: [
			{
				displayName: 'Profile ID',
				name: 'profileId',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'body',
						property: 'profileId',
					},
				},
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
					maxValue: 5368709120,
				},
				description: 'File size in bytes',
				routing: {
					send: {
						type: 'body',
						property: 'size',
					},
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['media'],
			},
		},
	},

	{
		displayName: 'Output',
		name: 'output',
		type: 'options',
		default: 'simplified',
		displayOptions: { show: { resource: ['account'], operation: ['getAll'], '@tool': [true] } },
		options: [
			{ name: 'Raw', value: 'raw' },
			{ name: 'Selected Fields', value: 'selected' },
			{ name: 'Simplified', value: 'simplified' },
		],
		routing: { output: { postReceive: [toolAccountOutput] } },
	},
	{
		displayName: 'Fields',
		name: 'outputFields',
		type: 'multiOptions',
		default: [],
		description: 'Fields to return; the account ID is always included',
		displayOptions: {
			show: { resource: ['account'], operation: ['getAll'], '@tool': [true], output: ['selected'] },
		},
		options: [
			{ name: 'Display Name', value: 'displayName' },
			{ name: 'Platform', value: 'platform' },
			{ name: 'Profile ID', value: 'profileId' },
			{ name: 'Status', value: 'status' },
			{ name: 'Username', value: 'username' },
		],
	},
];
