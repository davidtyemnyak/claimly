export interface CSVRecord {
  PROPERTY_ID: string;
  PROPERTY_TYPE: string;
  CASH_REPORTED: string;
  SHARES_REPORTED: string;
  NAME_OF_SECURITIES_REPORTED: string;
  NO_OF_OWNERS: string;
  OWNER_NAME: string;
  OWNER_STREET_1: string;
  OWNER_STREET_2: string;
  OWNER_STREET_3: string;
  OWNER_CITY: string;
  OWNER_STATE: string;
  OWNER_ZIP: string;
  OWNER_COUNTRY_CODE: string;
  CURRENT_CASH_BALANCE: string;
  NUMBER_OF_PENDING_CLAIMS: string;
  NUMBER_OF_PAID_CLAIMS: string;
  HOLDER_NAME: string;
  HOLDER_STREET_1: string;
  HOLDER_STREET_2: string;
  HOLDER_STREET_3: string;
  HOLDER_CITY: string;
  HOLDER_STATE: string;
  HOLDER_ZIP: string;
  CUSIP: string;
}

export const parseCSV = (csvText: string): CSVRecord[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(';');
  const records: CSVRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    if (values.length !== headers.length) continue;

    const record: any = {};
    headers.forEach((header, index) => {
      record[header.trim()] = values[index]?.trim() || '';
    });

    records.push(record as CSVRecord);
  }

  return records;
};

export const convertCSVRecordToDBRecord = (csvRecord: CSVRecord) => {
  const parseDecimal = (value: string): number => {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseInt = (value: string): number => {
    const cleaned = value.replace(/[^\d-]/g, '');
    const parsed = Number(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  return {
    property_id: csvRecord.PROPERTY_ID,
    property_type: csvRecord.PROPERTY_TYPE,
    cash_reported: parseDecimal(csvRecord.CASH_REPORTED),
    shares_reported: parseDecimal(csvRecord.SHARES_REPORTED),
    name_of_securities_reported: csvRecord.NAME_OF_SECURITIES_REPORTED,
    no_of_owners: csvRecord.NO_OF_OWNERS,
    owner_name: csvRecord.OWNER_NAME,
    owner_street_1: csvRecord.OWNER_STREET_1,
    owner_street_2: csvRecord.OWNER_STREET_2,
    owner_street_3: csvRecord.OWNER_STREET_3,
    owner_city: csvRecord.OWNER_CITY,
    owner_state: csvRecord.OWNER_STATE,
    owner_zip: csvRecord.OWNER_ZIP,
    owner_country_code: csvRecord.OWNER_COUNTRY_CODE,
    current_cash_balance: parseDecimal(csvRecord.CURRENT_CASH_BALANCE),
    number_of_pending_claims: parseInt(csvRecord.NUMBER_OF_PENDING_CLAIMS),
    number_of_paid_claims: parseInt(csvRecord.NUMBER_OF_PAID_CLAIMS),
    holder_name: csvRecord.HOLDER_NAME,
    holder_street_1: csvRecord.HOLDER_STREET_1,
    holder_street_2: csvRecord.HOLDER_STREET_2,
    holder_street_3: csvRecord.HOLDER_STREET_3,
    holder_city: csvRecord.HOLDER_CITY,
    holder_state: csvRecord.HOLDER_STATE,
    holder_zip: csvRecord.HOLDER_ZIP,
    cusip: csvRecord.CUSIP,
  };
};

export const validateCSVRecord = (record: CSVRecord): string[] => {
  const errors: string[] = [];

  if (!record.PROPERTY_ID?.trim()) {
    errors.push('Property ID is required');
  }

  if (!record.OWNER_NAME?.trim()) {
    errors.push('Owner name is required');
  }

  if (!record.PROPERTY_TYPE?.trim()) {
    errors.push('Property type is required');
  }

  return errors;
};