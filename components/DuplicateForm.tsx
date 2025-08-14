
import React from 'react';
import { DuplicateData, Party } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';

interface DuplicateFormProps {
    data: DuplicateData;
    setData: React.Dispatch<React.SetStateAction<DuplicateData>>;
    onCreditorManage: () => void;
}

export const DuplicateForm: React.FC<DuplicateFormProps> = ({ data, setData, onCreditorManage }) => {
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
                    <Input label="Nº da Duplicata" value={data.number} onChange={(e) => handleDetailChange('number', e.target.value)} />
                    <Input label="Nº da Fatura" value={data.invoiceNumber} onChange={(e) => handleDetailChange('invoiceNumber', e.target.value)} />
                    <Input label="Valor (R$)" placeholder="ex: 1250,50" value={data.value} onChange={(e) => handleDetailChange('value', e.target.value)} />
                    <Input label="Data de Emissão" type="date" value={data.issueDate} onChange={(e) => handleDetailChange('issueDate', e.target.value)} />
                    <Input label="Data de Vencimento" type="date" value={data.dueDate} onChange={(e) => handleDetailChange('dueDate', e.target.value)} />
                    <Input label="Praça de Pagamento" placeholder="Cidade / UF" value={data.paymentPlace} onChange={(e) => handleDetailChange('paymentPlace', e.target.value)} />
                </div>
            </Card>

            <Card 
                title="Credor (Emitente)" 
                action={<button onClick={onCreditorManage} className="text-sm font-medium text-blue-600 hover:text-blue-800">Gerenciar Credores</button>}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nome / Razão Social" value={data.creditor.name} onChange={(e) => handlePartyChange('creditor', 'name', e.target.value)} />
                    <Input label="CNPJ / CPF" value={data.creditor.doc} onChange={(e) => handlePartyChange('creditor', 'doc', e.target.value)} />
                    <Input label="Endereço (Rua, Nº, Bairro)" value={data.creditor.address} onChange={(e) => handlePartyChange('creditor', 'address', e.target.value)} />
                    <Input label="Cidade" value={data.creditor.city} onChange={(e) => handlePartyChange('creditor', 'city', e.target.value)} />
                    <Input label="UF" value={data.creditor.state} onChange={(e) => handlePartyChange('creditor', 'state', e.target.value)} />
                    <Input label="CEP" value={data.creditor.zip} onChange={(e) => handlePartyChange('creditor', 'zip', e.target.value)} />
                </div>
            </Card>

            <Card title="Sacado (Devedor)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nome / Razão Social" value={data.debtor.name} onChange={(e) => handlePartyChange('debtor', 'name', e.target.value)} />
                    <Input label="CNPJ / CPF" value={data.debtor.doc} onChange={(e) => handlePartyChange('debtor', 'doc', e.target.value)} />
                    <Input label="Endereço (Rua, Nº, Bairro)" value={data.debtor.address} onChange={(e) => handlePartyChange('debtor', 'address', e.target.value)} />
                    <Input label="Cidade" value={data.debtor.city} onChange={(e) => handlePartyChange('debtor', 'city', e.target.value)} />
                    <Input label="UF" value={data.debtor.state} onChange={(e) => handlePartyChange('debtor', 'state', e.target.value)} />
                    <Input label="CEP" value={data.debtor.zip} onChange={(e) => handlePartyChange('debtor', 'zip', e.target.value)} />
                </div>
            </Card>
        </div>
    );
};
