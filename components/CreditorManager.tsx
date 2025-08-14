
import React, { useState, useEffect } from 'react';
import { Creditor, Party } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface CreditorManagerProps {
    onSelectCreditor: (creditor: Creditor) => void;
    onClose: () => void;
}

const emptyCreditor: Party = { name: '', doc: '', address: '', city: '', state: '', zip: '' };

export const CreditorManager: React.FC<CreditorManagerProps> = ({ onSelectCreditor, onClose }) => {
    const [creditors, setCreditors] = useLocalStorage<Creditor[]>('creditors', []);
    const [newCreditor, setNewCreditor] = useState<Creditor>(emptyCreditor);

    useEffect(() => {
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
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
                    <Input label="Nome / Razão Social" name="name" value={newCreditor.name} onChange={handleInputChange} />
                    <Input label="CNPJ / CPF" name="doc" value={newCreditor.doc} onChange={handleInputChange} />
                    <Input label="Endereço" name="address" value={newCreditor.address} onChange={handleInputChange} />
                    <Input label="Cidade" name="city" value={newCreditor.city} onChange={handleInputChange} />
                    <Input label="UF" name="state" value={newCreditor.state} onChange={handleInputChange} />
                    <Input label="CEP" name="zip" value={newCreditor.zip} onChange={handleInputChange} />
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
