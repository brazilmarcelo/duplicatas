
export interface Party {
    name: string;
    doc: string; // CPF or CNPJ
    address: string;
    city: string;
    state: string;
    zip: string;
}

export interface DuplicateData {
    creditor: Party;
    debtor: Party;
    number: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    value: string; // Using string to handle currency input easily
    paymentPlace: string;
}

// Creditor stored in localStorage
export type Creditor = Party;
