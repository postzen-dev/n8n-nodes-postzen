import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { properties } from './properties';

export class Postzen implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PostZen',
		name: 'postzen',
		icon: { light: 'file:postzen.png', dark: 'file:postzen.dark.png' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create, schedule, and manage social media posts with PostZen',
		defaults: { name: 'PostZen' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'postzenApi', required: true }],
		requestDefaults: {
			baseURL: 'https://api.postzen.dev',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		},
		properties,
	};
}
