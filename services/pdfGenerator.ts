
import { DuplicateData } from '../types';

declare const jspdf: any;

// Helper to format currency
const formatCurrency = (value: string): string => {
    const numberValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numberValue)) return '0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
};

// Helper to format date
const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    } catch {
        return dateString;
    }
};

export const generatePdf = (data: DuplicateData) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;

    // Set font
    doc.setFont('helvetica');

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DUPLICATA DE VENDA MERCANTIL', pageWidth / 2, 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    // Top Right Box
    doc.autoTable({
        startY: 25,
        margin: { left: contentWidth - 50 },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5 },
        headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
        body: [
            ['Nº da Duplicata', data.number || ''],
            ['Vencimento', formatDate(data.dueDate)],
            ['Valor R$', formatCurrency(data.value).replace('R$', '').trim()],
        ],
    });

    const finalYAfterTable = (doc as any).lastAutoTable.finalY;

    // Creditor Info
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
    
    const finalYCreditor = (doc as any).lastAutoTable.finalY;

    // Invoice and Debtor info
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

    const finalYInvoice = (doc as any).lastAutoTable.finalY;

    // Debtor Info
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
    
    const finalYDebtor = (doc as any).lastAutoTable.finalY;
    
    // Main Obligation Text
    doc.setFontSize(10);
    const mainText = `Pagar(ão) por esta duplicata de venda, na praça e vencimento acima indicados, a ${data.creditor.name} ou à sua ordem, a importância de ${formatCurrency(data.value)} (${(doc as any).splitTextToSize('valor por extenso aqui', contentWidth-20).join(' ')}), correspondente à Fatura Nº ${data.invoiceNumber}.`;
    const splitText = doc.splitTextToSize(mainText, contentWidth);
    doc.text(splitText, margin, finalYDebtor + 15);

    // Acceptance Block
    doc.rect(margin, finalYDebtor + 35, contentWidth, 25);
    doc.text('Data do Aceite:', margin + 2, finalYDebtor + 40);
    doc.line(margin + 30, finalYDebtor + 40, margin + 80, finalYDebtor + 40);
    doc.text('Assinatura do Sacado:', margin + 2, finalYDebtor + 55);
    doc.line(margin + 40, finalYDebtor + 55, margin + contentWidth - 2, finalYDebtor + 55);


    // Tear-off line (Canhoto)
    doc.setLineDashPattern([2, 1], 0);
    doc.line(margin, 230, pageWidth - margin, 230);
    doc.setLineDashPattern([], 0);

    // Stub (Canhoto) Section
    doc.setFont('helvetica', 'bold');
    doc.text('CANHOTO DA DUPLICATA', margin, 235);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const stubText = `Recebi(emos) de ${data.creditor.name} os produtos/mercadorias constantes da Nota Fiscal - Fatura indicada ao lado, que constitui o objeto da presente Duplicata, pela qual me dou por achado e ciente, e que assinada confirmo o seu recebimento.`;
    const splitStubText = doc.splitTextToSize(stubText, contentWidth - 85);
    
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

    const finalYStubTable = (doc as any).lastAutoTable.finalY;
    
    doc.text(splitStubText, margin, finalYStubTable + 5);
    
    doc.text('Data:', margin, 280);
    doc.line(margin + 10, 280, margin + 50, 280);
    
    doc.text('Assinatura:', margin + 60, 280);
    doc.line(margin + 75, 280, margin + 125, 280);
    
    doc.text('Nome Legível/RG:', margin + 135, 280);
    doc.line(margin + 160, 280, contentWidth + margin, 280);

    doc.save(`duplicata-${data.number || 'sem-numero'}.pdf`);
};
