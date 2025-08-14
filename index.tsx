import React from 'react';

// As importações de React e ReactDOM foram removidas, pois agora são carregadas globalmente no index.html.

// Declare global variables from external scripts to inform TypeScript
declare const jspdf: any;
declare const ReactDOM: any; // Declarando ReactDOM globalmente
declare global {
    interface Window {
        lucide: {
            createIcons: () => void;
        };
    }
}

// Lógica de todos os arquivos foi consolidada aqui para contornar problemas de importação e transpilação no GitHub Pages.

// --- Lógica de hooks/useLocalStorage.ts ---
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = React.useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(error);
        }
    };

    React.useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.error(error);
        }
    }, [key]);

    return [storedValue, setValue];
}

// --- Type definitions (from types.ts) ---
interface Party {
    name: string;
    doc: string; // CPF or CNPJ
    address: string;
    city: string;
    state: string;
    zip: string;
}

interface DuplicateData {
    creditor: Party;
    debtor: Party;
    number: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    value: string; // Using string to handle currency input easily
    paymentPlace: string;
}

type Creditor = Party;


// --- Lógica de services/pdfGenerator.ts ---
const formatCurrency = (value: string) => {
    const numberValue = parseFloat(String(value || '0').replace(',', '.'));
    if (isNaN(numberValue)) return '0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    } catch {
        return dateString;
    }
};

const generatePdf = (data: DuplicateData) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;

    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DUPLICATA DE VENDA MERCANTIL', pageWidth / 2, 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    doc.autoTable({
        startY: 25,
        margin: { left: contentWidth - 50 + margin },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5 },
        headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
        body: [
            ['Nº da Duplicata', data.number || ''],
            ['Vencimento', formatDate(data.dueDate)],
            ['Valor R$', formatCurrency(data.value).replace('R$', '').trim()],
        ],
    });

    const finalYAfterTable = doc.lastAutoTable.finalY;

    doc.autoTable({
        startY: finalYAfterTable + 5,
        margin: { left: margin, right: margin },
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1 },
        head: [['CREDOR (EMITENTE)']],
        headStyles: { fontStyle: 'bold', fontSize: 10, cellPadding: { top: 2, bottom: 1, left: 0 } },
        body: [
            [`Nome/Razão Social: ${data.creditor.name}`],
            [`CNPJ/CPF: ${data.creditor.doc}`],
            [`Endereço: ${data.creditor.address}`],
            [`Município: ${data.creditor.city} UF: ${data.creditor.state} CEP: ${data.creditor.zip}`],
        ],
    });
    
    const finalYCreditor = doc.lastAutoTable.finalY;

    doc.autoTable({
        startY: finalYCreditor + 2,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5 },
        body: [
            [
                { content: `Fatura Nº: ${data.invoiceNumber}`, styles: { halign: 'left' } },
                { content: `Data de Emissão: ${formatDate(data.issueDate)}`, styles: { halign: 'center' } },
                { content: `Valor Total da Fatura: ${formatCurrency(data.value)}`, styles: { halign: 'right' } },
            ]
        ]
    });

    const finalYInvoice = doc.lastAutoTable.finalY;

    doc.autoTable({
        startY: finalYInvoice + 2,
        margin: { left: margin, right: margin },
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1 },
        head: [['SACADO (DEVEDOR)']],
        headStyles: { fontStyle: 'bold', fontSize: 10, cellPadding: { top: 2, bottom: 1, left: 0 } },
        body: [
            [`Nome/Razão Social: ${data.debtor.name}`],
            [`CNPJ/CPF: ${data.debtor.doc}`],
            [`Endereço: ${data.debtor.address}`],
            [`Município: ${data.debtor.city} UF: ${data.debtor.state} CEP: ${data.debtor.zip}`],
            [`Praça de Pagamento: ${data.paymentPlace}`]
        ],
    });
    
    const finalYDebtor = doc.lastAutoTable.finalY;
    
    doc.setFontSize(10);
    const mainText = `Pagar(ão) por esta duplicata de venda, na praça e vencimento acima indicados, a ${data.creditor.name} ou à sua ordem, a importância de ${formatCurrency(data.value)}.`;
    const splitText = doc.splitTextToSize(mainText, contentWidth);
    doc.text(splitText, margin, finalYDebtor + 15);

    doc.rect(margin, finalYDebtor + 30, contentWidth, 25);
    doc.text('Data do Aceite:', margin + 2, finalYDebtor + 35);
    doc.line(margin + 30, finalYDebtor + 35, margin + 80, finalYDebtor + 35);
    doc.text('Assinatura do Sacado:', margin + 2, finalYDebtor + 50);
    doc.line(margin + 40, finalYDebtor + 50, margin + contentWidth - 2, finalYDebtor + 50);

    doc.setLineDashPattern([2, 1], 0);
    doc.line(margin, 230, pageWidth - margin, 230);
    doc.setLineDashPattern([], 0);

    doc.setFont('helvetica', 'bold');
    doc.text('CANHOTO DA DUPLICATA', margin, 235);
    
    doc.autoTable({
        startY: 238,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
        body: [
            [
                { content: `Nº Duplicata\n${data.number}`},
                { content: `Valor\n${formatCurrency(data.value)}`},
                { content: `Vencimento\n${formatDate(data.dueDate)}`},
                { content: `Emitente\n${data.creditor.name}`},
            ]
        ]
    });

    const finalYStubTable = doc.lastAutoTable.finalY;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const stubText = `Recebi(emos) de ${data.creditor.name} os produtos/mercadorias constantes da Nota Fiscal - Fatura indicada ao lado, que constitui o objeto da presente Duplicata, pela qual me dou por achado e ciente, e que assinada confirmo o seu recebimento.`;
    const splitStubText = doc.splitTextToSize(stubText, contentWidth);
    doc.text(splitStubText, margin, finalYStubTable + 5);
    
    doc.text('Data:', margin, 280);
    doc.line(margin + 10, 280, margin + 50, 280);
    doc.text('Assinatura:', margin + 60, 280);
    doc.line(margin + 75, 280, margin + 125, 280);
    doc.text('Nome Legível/RG:', margin + 135, 280);
    doc.line(margin + 160, 280, contentWidth + margin - 10, 280);

    doc.save(`duplicata-${data.number || 'sem-numero'}.pdf`);
};


// --- Lógica de components/ui/* ---
interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, title, action }) => {
    return (
        <div className={`bg-white shadow-md rounded-lg p-6 ${className || ''}`}>
            { (title || action) && (
                <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                    {title && <h2 className="text-xl font-semibold text-slate-700">{title}</h2>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">
                {label}
            </label>
            <input
                id={id}
                {...props}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
        </div>
    );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    className?: string;
    Icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, Icon, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses = {
        primary: 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-blue-500',
        danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    };
    const hasChildren = React.Children.count(children) > 0;
    const paddingClasses = hasChildren ? 'px-4 py-2' : 'p-2';
    const iconMarginClass = hasChildren ? 'mr-2 -ml-1' : '';

    return (
        <button {...props} className={`${baseClasses} ${paddingClasses} ${variantClasses[variant]} ${className || ''}`}>
            {Icon && <span className={iconMarginClass}>{Icon}</span>}
            {children}
        </button>
    );
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    React.useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-50 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Fechar modal">
                        <i data-lucide="x" className="w-6 h-6"></i>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};


// --- Lógica de components/CreditorManager.tsx ---
interface CreditorManagerProps {
    onSelectCreditor: (creditor: Creditor) => void;
    onClose: () => void;
}

const CreditorManager: React.FC<CreditorManagerProps> = ({ onSelectCreditor, onClose }) => {
    const emptyCreditor: Creditor = { name: '', doc: '', address: '', city: '', state: '', zip: '' };
    const [creditors, setCreditors] = useLocalStorage<Creditor[]>('creditors', []);
    const [newCreditor, setNewCreditor] = React.useState<Creditor>(emptyCreditor);

    React.useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCreditor(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCreditor = () => {
        if (newCreditor.name && newCreditor.doc) {
            setCreditors([...creditors, newCreditor]);
            setNewCreditor(emptyCreditor);
        } else {
            alert('Nome e CNPJ/CPF são obrigatórios.');
        }
    };

    const handleDeleteCreditor = (index: number) => {
        if (window.confirm('Tem certeza que deseja remover este credor?')) {
            const updatedCreditors = creditors.filter((_, i) => i !== index);
            setCreditors(updatedCreditors);
        }
    };

    const handleSelect = (creditor: Creditor) => {
        onSelectCreditor(creditor);
        onClose();
    };

    return (
        <div className="space-y-6">
            <div className="p-4 border border-slate-200 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Adicionar Novo Credor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="new-creditor-name" label="Nome / Razão Social" name="name" value={newCreditor.name} onChange={handleInputChange} />
                    <Input id="new-creditor-doc" label="CNPJ / CPF" name="doc" value={newCreditor.doc} onChange={handleInputChange} />
                    <Input id="new-creditor-address" label="Endereço" name="address" value={newCreditor.address} onChange={handleInputChange} />
                    <Input id="new-creditor-city" label="Cidade" name="city" value={newCreditor.city} onChange={handleInputChange} />
                    <Input id="new-creditor-state" label="UF" name="state" value={newCreditor.state} onChange={handleInputChange} />
                    <Input id="new-creditor-zip" label="CEP" name="zip" value={newCreditor.zip} onChange={handleInputChange} />
                </div>
                <Button onClick={handleAddCreditor} className="mt-4" Icon={<i data-lucide="plus" className="w-4 h-4" />}>
                    Adicionar Credor
                </Button>
            </div>
            
            <div className="p-4 border border-slate-200 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Credores Salvos</h3>
                {creditors.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Nenhum credor salvo.</p>
                ) : (
                    <ul className="space-y-3">
                        {creditors.map((creditor, index) => (
                            <li key={index} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200 gap-3">
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800">{creditor.name}</p>
                                    <p className="text-sm text-slate-500">{creditor.doc} - {creditor.address}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button variant="secondary" onClick={() => handleSelect(creditor)} Icon={<i data-lucide="check" className="w-4 h-4" />}>Selecionar</Button>
                                    <Button variant="danger" onClick={() => handleDeleteCreditor(index)} Icon={<i data-lucide="trash-2" className="w-4 h-4" />} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};


// --- Lógica de components/DuplicateForm.tsx ---
interface DuplicateFormProps {
    data: DuplicateData;
    setData: React.Dispatch<React.SetStateAction<DuplicateData>>;
    onCreditorManage: () => void;
}

const DuplicateForm: React.FC<DuplicateFormProps> = ({ data, setData, onCreditorManage }) => {
    const handlePartyChange = (party: 'creditor' | 'debtor', field: keyof Party, value: string) => {
        setData(prev => ({
            ...prev,
            [party]: {
                ...prev[party],
                [field]: value
            }
        }));
    };

    const handleDetailChange = (field: keyof Omit<DuplicateData, 'creditor' | 'debtor'>, value: string) => {
        setData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    return (
        <div className="space-y-6">
            <Card title="Detalhes da Duplicata">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Input id="duplicate-number" label="Nº da Duplicata" name="number" value={data.number} onChange={(e) => handleDetailChange('number', e.target.value)} />
                    <Input id="invoice-number" label="Nº da Fatura" name="invoiceNumber" value={data.invoiceNumber} onChange={(e) => handleDetailChange('invoiceNumber', e.target.value)} />
                    <Input id="value" label="Valor (R$)" placeholder="ex: 1250,50" name="value" value={data.value} onChange={(e) => handleDetailChange('value', e.target.value)} />
                    <Input id="issue-date" label="Data de Emissão" type="date" name="issueDate" value={data.issueDate} onChange={(e) => handleDetailChange('issueDate', e.target.value)} />
                    <Input id="due-date" label="Data de Vencimento" type="date" name="dueDate" value={data.dueDate} onChange={(e) => handleDetailChange('dueDate', e.target.value)} />
                    <Input id="payment-place" label="Praça de Pagamento" placeholder="Cidade / UF" name="paymentPlace" value={data.paymentPlace} onChange={(e) => handleDetailChange('paymentPlace', e.target.value)} />
                </div>
            </Card>

            <Card 
                title="Credor (Emitente)" 
                action={<button onClick={onCreditorManage} className="text-sm font-medium text-blue-600 hover:text-blue-800">Gerenciar Credores</button>}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="creditor-name" label="Nome / Razão Social" name="name" value={data.creditor.name} onChange={(e) => handlePartyChange('creditor', 'name', e.target.value)} />
                    <Input id="creditor-doc" label="CNPJ / CPF" name="doc" value={data.creditor.doc} onChange={(e) => handlePartyChange('creditor', 'doc', e.target.value)} />
                    <Input id="creditor-address" label="Endereço (Rua, Nº, Bairro)" name="address" value={data.creditor.address} onChange={(e) => handlePartyChange('creditor', 'address', e.target.value)} />
                    <Input id="creditor-city" label="Cidade" name="city" value={data.creditor.city} onChange={(e) => handlePartyChange('creditor', 'city', e.target.value)} />
                    <Input id="creditor-state" label="UF" name="state" value={data.creditor.state} onChange={(e) => handlePartyChange('creditor', 'state', e.target.value)} />
                    <Input id="creditor-zip" label="CEP" name="zip" value={data.creditor.zip} onChange={(e) => handlePartyChange('creditor', 'zip', e.target.value)} />
                </div>
            </Card>

            <Card title="Sacado (Devedor)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="debtor-name" label="Nome / Razão Social" name="name" value={data.debtor.name} onChange={(e) => handlePartyChange('debtor', 'name', e.target.value)} />
                    <Input id="debtor-doc" label="CNPJ / CPF" name="doc" value={data.debtor.doc} onChange={(e) => handlePartyChange('debtor', 'doc', e.target.value)} />
                    <Input id="debtor-address" label="Endereço (Rua, Nº, Bairro)" name="address" value={data.debtor.address} onChange={(e) => handlePartyChange('debtor', 'address', e.target.value)} />
                    <Input id="debtor-city" label="Cidade" name="city" value={data.debtor.city} onChange={(e) => handlePartyChange('debtor', 'city', e.target.value)} />
                    <Input id="debtor-state" label="UF" name="state" value={data.debtor.state} onChange={(e) => handlePartyChange('debtor', 'state', e.target.value)} />
                    <Input id="debtor-zip" label="CEP" name="zip" value={data.debtor.zip} onChange={(e) => handlePartyChange('debtor', 'zip', e.target.value)} />
                </div>
            </Card>
        </div>
    );
};


// --- Lógica de App.tsx ---
function App() {
    const initialDuplicateState: DuplicateData = {
        creditor: { name: '', doc: '', address: '', city: '', state: '', zip: '' },
        debtor: { name: '', doc: '', address: '', city: '', state: '', zip: '' },
        number: '',
        invoiceNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        value: '',
        paymentPlace: '',
    };
    const [data, setData] = React.useState<DuplicateData>(initialDuplicateState);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    React.useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });

    const handleSelectCreditor = (creditor: Creditor) => {
        setData(prev => ({ ...prev, creditor }));
    };

    const handleGeneratePdf = () => {
        if (!data.number || !data.value || !data.dueDate || !data.debtor.name) {
            alert('Por favor, preencha todos os campos obrigatórios: Nº da Duplicata, Valor, Vencimento e Nome do Sacado.');
            return;
        }
        generatePdf(data);
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                           <i data-lucide="file-text" className="text-white w-6 h-6"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Gerador de Duplicata</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DuplicateForm
                    data={data}
                    setData={setData}
                    onCreditorManage={() => setIsModalOpen(true)}
                />
                <div className="mt-8 flex justify-end">
                    <Button 
                        onClick={handleGeneratePdf}
                        className="text-lg py-3 px-6"
                        Icon={<i data-lucide="download" className="w-5 h-5" />}
                    >
                        Gerar e Baixar PDF
                    </Button>
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Gerenciador de Credores"
            >
                <CreditorManager
                    onSelectCreditor={handleSelectCreditor}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
            
            <footer className="text-center py-4 mt-8">
                <p className="text-sm text-slate-500">Desenvolvido com React e Tailwind CSS.</p>
            </footer>
        </div>
    );
}

// --- Ponto de Entrada (originalmente em index.tsx) ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);