import { App, Modal } from 'obsidian';
import { parse } from 'papaparse';
import {
	createFileIfDoesntExist,
	createFolderIfDoesntExist,
	setNoteProperties,
} from './fileUtils.js';

export type QuoteProps = {
	PricingAgreement?: string; //Agreement
	AwardDate?: string; //Award Date
	BillToId?: string; //Bill-To Party
	BillToName?: string; //Bill-To Party List
	ContactName?: string; //Contact
	ContactId?: string; //Contact Pers.
	CreatorId?: string; //Created By
	CreateDate?: string; //Created On
	SoldToId?: string; //Customer
	EmployeeResponsibleName?: string; //Employee Resp
	EmployeeResponsibleId?: string; //Employee Responsible
	EndCustomerId?: string; //End Customer
	EndCustomerName?: string; //End Customer Name
	NetPrice?: string; //Extended Net
	HasExtendedWarranty?: string; //Extended Warranty
	CustomerIndustry?: string; //Industry Override
	MainBU?: string; //Main BU
	PoNumber?: string; //PO Number
	PersonResponsibleName?: string; //Person Responsible
	PostingDate?: string; //Posting Date
	ProposalSpecialistName?: string; //Proposal Spc
	PoDate?: string; //Purchase Order Date
	Description?: string; //Quote Description
	EndDate?: string; //Quotation End Date
	Id: string; //Quotation No
	StartDate?: string; //Quotation Start Date
	Type?: string; //Quote Type
	SalesOffice?: string; //Sales Office
	ShipToId?: string; //Ship To
	ShipToName?: string; //Ship To Name
	SoldToName?: string; //Sold-To Party
	Status?: string; //Status
	UserStatus?: string; //User Status
	ExpirationDate?: string; //Valid To
};

export const createOrUpdateQuoteNote = async (
	app: App,
	quoteData: QuoteProps,
) => {
	//check for errors in the parsed data and handle them appropriately
	if (!quoteData) throw Error('no quote data to parse');

	//check if the quote folder exists, if not create it
	await createFolderIfDoesntExist(app.vault, 'Quotes');

	const folderPath = `Quotes/${quoteData?.Id}`;
	//console.warn(folderPath);
	await createFolderIfDoesntExist(app.vault, folderPath);

	//convert csv data to Quote Details
	//const quoteDetails = convertQuoteCsvRow(quoteData);
	//if (!quoteDetails?.Id) throw Error('no id to create new file');

	//check if the quote info already exists, if not create it
	const filePath = `${folderPath}/Details.md`;
	await createFileIfDoesntExist(app.vault, filePath);

	//update the properties of the note
	await setNoteProperties(app, filePath, quoteData);
};

export const parseQuotesCSV = async (
	app: App,
	filePath: string,
	modal: Modal,
): Promise<void> => {
	if (!filePath) {
		modal.setContent('File path is empty. Cannot parse CSV.');
		return;
	}

	//todo: see if the file is in any format other than utf-16le and convert it to utf-16le if necessary
	const fileContentArrayBuffer = await app.vault.adapter.readBinary(filePath);
	//console.warn('File content as ArrayBuffer:', fileContentArrayBuffer);
	const utf8Content = new TextDecoder('utf-16le').decode(
		fileContentArrayBuffer,
	);
	//console.warn('UTF-8 decoded content:', utf8Content);

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

			createOrUpdateQuoteNote(app, convertedRow).catch((error) => {
				console.error(`Error creating/updating quote note: ${error}`);
				modal.setContent(`Error creating/updating quote note`);
			});
		},
		complete: (_results) => {
			//modal.setContent('CSV parsing complete.');
		},
	});
};

const convertQuoteCsvRow = (csvRow: Record<string, string>): QuoteProps => {
	console.warn(csvRow);
	if (!csvRow['Quotation No'])
		throw Error('csv row is missing Quotation No.');

	try {
		return {
			Id: csvRow['Quotation No'],
			PricingAgreement: csvRow['Agreement'],
			AwardDate: csvRow['Award Date'],
			BillToId: csvRow['Bill-To Party'],
			BillToName: csvRow['Bill-To Party List'],
			ContactName: csvRow['Contact'],
			ContactId: csvRow['Contact Pers.'],
			CreatorId: csvRow['Created By'],
			CreateDate: csvRow['Created On'],
			SoldToId: csvRow['Customer'],
			EmployeeResponsibleName: csvRow['Employee Resp'],
			EmployeeResponsibleId: csvRow['Employee Responsible'],
			EndCustomerId: csvRow['End Customer'],
			EndCustomerName: csvRow['End Customer Name'],
			NetPrice: csvRow['Extended Net'],
			HasExtendedWarranty: csvRow['Extended Warranty'],
			CustomerIndustry: csvRow['Industry Override'],
			MainBU: csvRow['Main BU'],
			PoNumber: csvRow['PO Number'],
			PersonResponsibleName: csvRow['Person Responsible'],
			PostingDate: csvRow['Posting Date'],
			ProposalSpecialistName: csvRow['Proposal Spc'],
			PoDate: csvRow['Purchase Order Date'],
			Description: csvRow['Quote Description'],
			EndDate: csvRow['Quotation End Date'],
			StartDate: csvRow['Quotation Start Date'],
			Type: csvRow['Quote Type'],
			SalesOffice: csvRow['Sales Office'],
			ShipToId: csvRow['Ship To'],
			ShipToName: csvRow['Ship To Name'],
			SoldToName: csvRow['Sold-To Party'],
			Status: csvRow['Status'],
			UserStatus: csvRow['User Status'],
			ExpirationDate: csvRow['Valid To'],
		};
	} catch {
		throw Error('Error converting csv row to quote details');
	}
};
