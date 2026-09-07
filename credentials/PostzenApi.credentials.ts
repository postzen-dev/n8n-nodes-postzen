import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PostzenApi implements ICredentialType {
	name = 'postzenApi';
	displayName = 'PostZen API';
	documentationUrl = 'https://github.com/JesseEisenbart/n8n-nodes-postzen#credentials';
	icon = 'file:../nodes/Postzen/postzen.png' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Create an API key in the PostZen dashboard under API Keys',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } },
	};
	test: ICredentialTestRequest = {
		request: { baseURL: 'https://api.postzen.dev', url: '/v1/profiles', method: 'GET' },
	};
}
