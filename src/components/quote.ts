import { App, Modal } from 'obsidian';
import { parse } from 'papaparse';
import {
	createFileIfDoesntExist,
	createFolderIfDoesntExist,
	setNoteProperties,
} from './fileUtils.js';
import { CompanyProps } from './company.js';
import { PersonProps } from './person.js';

export type QuoteProps = {
	Agreement?: string; //Agreement
	'Award Date'?: string; //Award Date
	'Bill-To Party'?: string; //Bill-To Party
	'Business Unit'?: string; //Main BU
	Contact?: string; //Contact Pers.
	'Create Date'?: string; //Created On
	Description?: string; //Description
	'Employee Responsible'?: string; //Employee Responsible
	'End Customer'?: string; //End Customer
	'Extended Warranty'?: boolean; //Extended Warranty
	Industry?: string; //Industry Override
	'Net Price'?: string; //Extended Net
	Number: string; //Quotation No
	'PO Date'?: string; //Purchase Order Date
	'PO Number'?: string; //PO Number
	'Ship-To Party'?: string; //Ship To Party
	'Sold-To Party'?: string; //Sold-To Party
	Status?: string; //User Status
	'Sales Office'?: string; //Sales Office
	Type?: string; //Quote Type
	'Valid-To Date'?: string; //Valid To
};

export const createOrUpdateQuoteNote = async (
	app: App,
	quoteData: QuoteProps,
) => {
	//check for errors in the parsed data and handle them appropriately
	if (!quoteData) throw Error('no quote data to parse');

	//check if the quote folder exists, if not create it
	await createFolderIfDoesntExist(app.vault, 'Quotes');

	//check if the quote info already exists, if not create it
	const filePath = `Quotes/${quoteData?.Number}.md`;
	await createFileIfDoesntExist(app.vault, filePath);

	//update the properties of the note
	await setNoteProperties(app, filePath, quoteData);
};

export const parseQuotesCSV = async (
	app: App,
	filePath: string,
	modal: Modal,
): Promise<[QuoteProps[], PersonProps[], CompanyProps[]]> => {
	if (!filePath) {
		modal.setContent('File path is empty. Cannot parse CSV.');
		return [[], [], []];
	}

	//todo: see if the file is in any format other than utf-16le and convert it to utf-16le if necessary
	const fileContentArrayBuffer = await app.vault.adapter.readBinary(filePath);
	//console.warn('File content as ArrayBuffer:', fileContentArrayBuffer);
	const utf8Content = new TextDecoder('utf-16le').decode(
		fileContentArrayBuffer,
	);
	//console.warn('UTF-8 decoded content:', utf8Content);

	let quotes: QuoteProps[] = [];
	let people: PersonProps[] = [];
	let companies: CompanyProps[] = [];
	parse(utf8Content, {
		header: true,
		step: (row, meta) => {
			//console.warn('CSV row parsed:', row);
			//Create or replace the quote in the vault based on the parsed row data
			if (row.errors.length > 0) {
				console.error(row.errors);
				return;
			}
			const convertedRow = convertQuoteCsvRow(
				row.data as Record<string, string>,
			);
			//console.warn(convertedRow);

			quotes.push(convertedRow[0]);
			people.push(...convertedRow[1]);
			companies.push(...convertedRow[2]);
		},
		complete: (_results) => {
			//modal.setContent('CSV parsing complete.');
			//return quotes;
		},
	});

	return [quotes, people, companies];
};

const convertQuoteCsvRow = (
	csvRow: Record<string, string>,
): [QuoteProps, PersonProps[], CompanyProps[]] => {
	//console.warn(csvRow);
	if (!csvRow['Quotation No'])
		throw Error('csv row is missing Quotation No.');

	try {
		return [
			{
				Agreement: csvRow['Agreement'],
				'Award Date': toObsidianDate(csvRow['Award Date']),
				'Bill-To Party': `[[Companies/${csvRow['Bill-To Party']}|"${csvRow['Bill-To Party List']}"]]`,
				'Business Unit': csvRow['Business Unit'],
				Contact: `[[People/${csvRow['Contact Pers.']}|"${csvRow['Contact']}"]]`,
				'Create Date': toObsidianDate(csvRow['Created On']),
				Description: csvRow['Quote Description'],
				'Employee Responsible': `[[People/${csvRow['Employee Responsible']}|"${csvRow['Employee Resp']}"]]`,
				'End Customer': `[[Companies/${csvRow['End Customer']}|"${csvRow['End Customer Name']}"]]`,
				'Extended Warranty':
					csvRow['Extended Warranty']?.trim() === 'X' ? true : false,
				Industry: csvRow['Industry Override'],
				'Net Price': csvRow['Extended Net'],
				Number: csvRow['Quotation No'],
				'PO Date': toObsidianDate(csvRow['Purchase Order Date']),
				'PO Number': csvRow['PO Number'],
				'Ship-To Party': `[[Companies/${csvRow['Ship To']}|"${csvRow['Ship To Name']}"]]`,
				'Sold-To Party': `[[Companies/${csvRow['Customer']}|"${csvRow['Sold-To Party']}"]]`,
				Status: csvRow['User Status'],
				'Sales Office': csvRow['Sales Office'],
				Type: csvRow['Quote Type'],
				'Valid-To Date': toObsidianDate(csvRow['Valid To']),
			},
			[
				{
					Name: csvRow['Contact'],
					BPID: csvRow['Contact Pers.'],
				},
				{
					Name: csvRow['Employee Resp'],
					BPID: csvRow['Employee Responsible'],
				},
			],
			[
				{
					Name: csvRow['Bill-To Party List'],
					BPID: csvRow['Bill-To Party'],
				},
				{
					Name: csvRow['End Customer Name'],
					BPID: csvRow['End Customer'],
				},
				{
					Name: csvRow['Ship To Name'],
					BPID: csvRow['Ship To'],
				},
				{
					Name: csvRow['Sold-To Party'],
					BPID: csvRow['Customer'],
				},
			],
		];
	} catch {
		throw Error('Error converting csv row to quote details');
	}
};

function toObsidianDate(arg0: string | undefined): string | undefined {
	if (!arg0?.trim()) return undefined;

	const value = arg0.trim();
	let year: string | undefined;
	let month: string | undefined;
	let day: string | undefined;

	// Parse the date components explicitly so the result is not affected by
	// the local timezone (SAP exports commonly use either of these formats).
	let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(value);
	if (match) {
		[, year, month, day] = match;
	} else {
		match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(value);
		if (!match) throw Error(`Invalid date: ${arg0}`);
		[, month, day, year] = match;
	}

	const date = new Date(Number(year), Number(month) - 1, Number(day));
	if (
		date.getFullYear() !== Number(year) ||
		date.getMonth() !== Number(month) - 1 ||
		date.getDate() !== Number(day)
	) {
		throw Error(`Invalid date: ${arg0}`);
	}

	return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`;
}
