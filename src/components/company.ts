import { App } from 'obsidian';
import {
	createFileIfDoesntExist,
	createFolderIfDoesntExist,
	setNoteProperties,
} from './fileUtils.js';

export type CompanyProps = {
	Name?: string; //Name
	BPID?: string; //BPID
};

export const createOrUpdateCompanyNote = async (
	app: App,
	data: CompanyProps,
) => {
	//check for errors in the parsed data and handle them appropriately
	if (!data) throw Error('no data to parse');

	//check if the company folder exists, if not create it
	await createFolderIfDoesntExist(app.vault, 'Companies');

	const filePath = `Companies/${data?.BPID}.md`;
	await createFileIfDoesntExist(app.vault, filePath);

	//update the properties of the note
	await setNoteProperties(app, filePath, data);
};
