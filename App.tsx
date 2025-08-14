
import React, { useState, useEffect } from 'react';
import { DuplicateData, Creditor } from './types';
import { DuplicateForm } from './components/DuplicateForm';
import { CreditorManager } from './components/CreditorManager';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { generatePdf } from './services/pdfGenerator';

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

function App() {
    const [data, setData] = useState<DuplicateData>(initialDuplicateState);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
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
                <p className="text-sm text-slate-500">Desenvolvido com React, TypeScript e Tailwind CSS.</p>
            </footer>
        </div>
    );
}

export default App;
