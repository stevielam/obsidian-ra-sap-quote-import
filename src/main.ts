import { App, Modal, Plugin, TAbstractFile } from 'obsidian';
import {
	createOrUpdateQuoteNote,
	parseQuotesCSV,
	QuoteProps,
} from './components/quote.js';
import { removeFile } from './components/fileUtils.js';
import {
	CompanyProps,
	createOrUpdateCompanyNote,
} from './components/company.js';
import { createOrUpdatePersonNote, PersonProps } from './components/person.js';

export default class Main extends Plugin {
	onload(): void {
		this.registerEvent(
			this.app.vault.on('create', async (file): Promise<void> => {
				//todo check the file path to see which type of file the user is trying to import
				//possible types: quotes (csv), orders(csv), or contacts (vcf)
				const modal = new Modal(this.app);

				if (
					file.path.startsWith('_meta/Imports/Quotes') &&
					file.path.endsWith('.csv')
				) {
					await handleQuotesFileImport(this.app, file, modal);
				} else if (
					file.path.startsWith('_meta/Imports/Orders') &&
					file.path.endsWith('.csv')
				) {
					await handleOrdersFileImport(this.app, file, modal);
				} else if (
					file.path.startsWith('_meta/Imports/Contacts') &&
					file.path.endsWith('.vcf')
				) {
					await handleContactFileImport(this.app, file, modal);
				} else {
					//console.warn(`Unknown file type detected: ${file.path}`);
				}
			}),
		);
	}
}

const handleContactFileImport = async (
	app: App,
	file: TAbstractFile,
	modal: Modal,
) => {
	console.warn('handleContactFileImport not implimented yet');
};

const handleOrdersFileImport = async (
	app: App,
	file: TAbstractFile,
	modal: Modal,
) => {
	console.warn('handleOrdersFileImport not implimented yet');
};

const handleQuotesFileImport = async (
	app: App,
	file: TAbstractFile,
	modal: Modal,
) => {
	modal.setTitle('Quotes file detected');
	modal.setContent(`parsing started for file: ${file.path}`);
	modal.open();
	//todo: check headers to see if expected format is being used
	//todo:parse csv with feedback
	const results: [QuoteProps[], PersonProps[], CompanyProps[]] =
		await parseQuotesCSV(app, file.path, modal).catch((error) => {
			console.error(`Error parsing CSV file: ${error}`);
			modal.setContent(`Error parsing CSV file`);
			return [[], [], []];
		});

	const [quotes, people, companies] = results;
	let total = quotes.length;
	let processed = 0;
	await Promise.all(
		quotes.map(async (quote) => {
			await createOrUpdateQuoteNote(app, quote).then(() => {
				processed++;
				modal.setContent(`Processing quote ${processed} of ${total}`);
			});
		}),
	);

	total = people.length;
	processed = 0;
	await Promise.all(
		people.map(async (person) => {
			await createOrUpdatePersonNote(app, person).then(() => {
				processed++;
				modal.setContent(`Processing person ${processed} of ${total}`);
			});
		}),
	);

	total = companies.length;
	processed = 0;
	await Promise.all(
		companies.map(async (company) => {
			await createOrUpdateCompanyNote(app, company).then(() => {
				processed++;
				modal.setContent(`Processing company ${processed} of ${total}`);
			});
		}),
	);

	modal.setContent('Finished processing notes.');
	removeFile(app.fileManager, file);
};
