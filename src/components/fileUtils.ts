import { App, FileManager, TAbstractFile, TFile, Vault } from 'obsidian';

export const createFileIfDoesntExist = async (
	vault: Vault,
	filePath: string,
): Promise<void> => {
	if (!(await vault.adapter.exists(filePath))) {
		await vault.create(filePath, '').catch((error) => {
			console.error(`Error creating ${filePath} folder: ${error}`);
		});
	}
};

export const createFolderIfDoesntExist = async (
	vault: Vault,
	folderPath: string,
): Promise<void> => {
	if (!(await vault.adapter.exists(folderPath))) {
		await vault.createFolder(folderPath).catch((error) => {
			console.error(`Error creating ${folderPath} folder: ${error}`);
		});
	}
};

export const removeFile = (
	fileManager: FileManager,
	file: TAbstractFile,
): void => {
	fileManager
		.trashFile(file)
		.then(() => {
			console.warn(`File ${file.path} has been moved to the trash.`);
		})
		.catch((error: unknown) => {
			console.error(
				`Failed to move file ${file.path} to the trash:`,
				error,
			);
		});
};

export const setNoteProperty = async (
	file: TFile,
	fileManager: FileManager,
	key: string,
	value: string,
) => {
	try {
		await fileManager.processFrontMatter(
			file,
			(props: Record<string, string>) => {
				// Directly mutate the frontmatter object

				props[key] = value;

				// To delete a property:
				// delete frontmatter[key];
			},
		);
		//console.warn(`Property '${key}' updated successfully.`);
	} catch (error) {
		console.error('Failed to update frontmatter:', error);
	}
};

export const setNoteProperties = async (
	app: App,
	notePath: string,
	props: Record<string, string | undefined>,
) => {
	const file = app.vault.getFileByPath(notePath);
	if (!file) {
		console.warn(`Can't set Note props. Note file not found: ${notePath}`);
		return;
	}

	for (const prop of Object.keys(props)) {
		const value = props[prop];
		if (value) {
			await setNoteProperty(file, app.fileManager, prop, value);
		}
	}
};
