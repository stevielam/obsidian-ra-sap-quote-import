import { App } from 'obsidian';
import {
	createFileIfDoesntExist,
	createFolderIfDoesntExist,
	setNoteProperties,
} from './fileUtils.js';

export type PersonProps = {
	Name?: string; //Name
	BPID?: string; //BPID
};

export const createOrUpdatePersonNote = async (app: App, data: PersonProps) => {
	//check for errors in the parsed data and handle them appropriately
	if (!data) throw Error('no data to parse');

	//check if the people folder exists, if not create it
	await createFolderIfDoesntExist(app.vault, 'People');

	const filePath = `People/${data?.BPID}.md`;
	await createFileIfDoesntExist(app.vault, filePath);

	//update the properties of the note
	await setNoteProperties(app, filePath, data);
};
