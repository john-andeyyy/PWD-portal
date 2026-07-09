export interface MemberImportPayload {
  fname: string;
  lname: string;
  mname?: string;
  bday: string;
  disability: string;
  phoneNumber: string;
  address: string;
  barangay: string;
  isBedridden: boolean;
  pwdId: string;
  dateIssued: string;
  gender: string;
}

export interface MemberImportRow {
  rowNumber: number;
  payload: MemberImportPayload | null;
  warnings: string[];
  errors: string[];
}

export interface MemberImportResult {
  delimiter: "comma" | "tab";
  rows: MemberImportRow[];
}

const HEADER_ALIASES: Record<string, keyof MemberImportPayload | "ignore"> = {
  barangay: "barangay",
  lastname: "lname",
  firstname: "fname",
  middlename: "mname",
  birthday: "bday",
  age: "ignore",
  address: "address",
  contact: "phoneNumber",
  contactnumber: "phoneNumber",
  disability: "disability",
  pwdno: "pwdId",
  pwdnumber: "pwdId",
  dateissued: "dateIssued",
  idstatus: "ignore",
  gender: "gender",
  bedridden: "isBedridden",
  civilstatus: "ignore",
};

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const parseDelimitedLine = (line: string, delimiter: "," | "\t") => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells;
};

const detectDelimiter = (headerLine: string): "," | "\t" => {
  const tabCount = (headerLine.match(/\t/g) ?? []).length;
  const commaCount = (headerLine.match(/,/g) ?? []).length;

  return tabCount > commaCount ? "\t" : ",";
};

const stripBom = (value: string) => value.replace(/^\uFEFF/, "");

const toIsoDate = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return trimmedValue;
  }

  const cleanedValue = trimmedValue
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",");
  const monthDayYearMatch = cleanedValue.match(
    /^([A-Za-z]{3,9}),?(?:\s+)?(\d{1,2}),?(?:\s+)?(\d{4})$/,
  );
  if (monthDayYearMatch) {
    const month = MONTHS[monthDayYearMatch[1].toLowerCase()];
    const day = Number(monthDayYearMatch[2]);
    const year = Number(monthDayYearMatch[3]);

    if (!month || Number.isNaN(day) || Number.isNaN(year)) {
      return null;
    }

    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  }

  const parsedDate = new Date(trimmedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
};

const toGender = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "male") {
    return "Male";
  }

  if (normalized === "female") {
    return "Female";
  }

  if (normalized === "other") {
    return "Other";
  }

  return value.trim();
};

const toBoolean = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return ["1", "true", "yes", "y", "checked"].includes(normalized);
};

export const parseMemberImportText = (text: string): MemberImportResult => {
  const normalizedText = stripBom(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = normalizedText
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { delimiter: "comma", rows: [] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerRow = parseDelimitedLine(lines[0], delimiter);
  const normalizedHeaders = headerRow.map(
    (header) => HEADER_ALIASES[normalizeHeader(header)] ?? "ignore",
  );
  const rows: MemberImportRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const cells = parseDelimitedLine(lines[index], delimiter);
    const rawValues: Record<string, string> = {};

    normalizedHeaders.forEach((headerKey, headerIndex) => {
      if (headerKey === "ignore") {
        return;
      }

      rawValues[headerKey] = cells[headerIndex] ?? "";
    });

    const warnings: string[] = [];
    const errors: string[] = [];

    const fname = rawValues.fname?.trim() ?? "";
    const lname = rawValues.lname?.trim() ?? "";
    const mname = rawValues.mname?.trim() ?? "";
    const disability = rawValues.disability?.trim() ?? "";
    const phoneNumber = rawValues.phoneNumber?.trim() ?? "";
    const address = rawValues.address?.trim() ?? "";
    const barangay = rawValues.barangay?.trim() ?? "";
    const pwdId = rawValues.pwdId?.trim() ?? "";
    const gender = toGender(rawValues.gender ?? "");

    const bday = toIsoDate(rawValues.bday ?? "");
    if (!bday) {
      errors.push("Birthday is missing or invalid.");
    }

    let dateIssued = toIsoDate(rawValues.dateIssued ?? "");
    if (!dateIssued) {
      dateIssued = new Date().toISOString().slice(0, 10);
      warnings.push("Date issued was empty, so today was used.");
    }

    if (!fname) {
      errors.push("First name is required.");
    }

    if (!lname) {
      errors.push("Last name is required.");
    }

    if (!disability) {
      errors.push("Disability is required.");
    }

    if (!address) {
      errors.push("Address is required.");
    }

    if (!barangay) {
      errors.push("Barangay is required.");
    }

    if (!pwdId) {
      errors.push("PWD number is required.");
    }

    if (!gender) {
      errors.push("Gender is required.");
    }

    const payload: MemberImportPayload | null =
      errors.length > 0 || !bday
        ? null
        : {
            fname,
            lname,
            mname: mname || undefined,
            bday,
            disability,
            phoneNumber,
            address,
            barangay,
            isBedridden: toBoolean(rawValues.isBedridden ?? ""),
            pwdId,
            dateIssued,
            gender,
          };

    rows.push({
      rowNumber: index + 1,
      payload,
      warnings,
      errors,
    });
  }

  return { delimiter: delimiter === "\t" ? "tab" : "comma", rows };
};
