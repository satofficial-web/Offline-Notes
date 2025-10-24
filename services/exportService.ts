import type { Note, LedgerData } from '../types';
import { NoteMode } from '../types';

declare const html2pdf: any;
declare const docx: any;

const htmlToText = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

const parseAndCleanNumber = (value: string): number => {
    if (typeof value !== 'string') return 0;
    // Remove thousand separators and replace comma decimal with a period
    const cleanedValue = value.replace(/[.,]/g, '');
    return parseFloat(cleanedValue) || 0;
};


const ledgerToHtmlTable = (note: Note): string => {
    if (note.mode !== NoteMode.LEDGER) return note.content;
    try {
        const parsedContent = JSON.parse(note.content || 'null');
        if (!parsedContent) return '<p>Empty ledger.</p>';

        // Handle new dynamic format
        if ('headers' in parsedContent && 'rows' in parsedContent) {
            const ledgerData = parsedContent as LedgerData;
            
            const totals = (ledgerData.sumColumnIndices || []).map(index => {
                const total = ledgerData.rows.reduce((acc, row) => {
                    const value = parseFloat(row.data[index] || '0');
                    return acc + (isNaN(value) ? 0 : value);
                }, 0);
                return { index, total };
            });

            const headerHtml = ledgerData.headers.map(header => `<th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">${header}</th>`).join('');
            
            const rowsHtml = ledgerData.rows.map(row => {
                const cellsHtml = row.data.map((cell, cellIndex) => {
                    const isSumColumn = (ledgerData.sumColumnIndices || []).includes(cellIndex);
                    const value = isSumColumn ? (parseFloat(cell) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : cell;
                    return `<td style="padding: 8px; border: 1px solid #ddd; ${isSumColumn ? 'text-align: right;' : ''}">${value}</td>`;
                }).join('');
                return `<tr>${cellsHtml}</tr>`;
            }).join('');
            
            const totalRowHtml = totals.map(({ index, total }) => `
                <tr>
                    <th colspan="${index}" style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total ${ledgerData.headers[index]}</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</th>
                    ${ledgerData.headers.length > index + 1 ? `<th colspan="${ledgerData.headers.length - index - 1}"></th>` : ''}
                </tr>
            `).join('');

            return `
                <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
                    <thead><tr>${headerHtml}</tr></thead>
                    <tbody>${rowsHtml}</tbody>
                    <tfoot>${totalRowHtml}</tfoot>
                </table>
            `;
        }

        // --- Fallback for old format ---
        const items: any[] = parsedContent;
        if (!Array.isArray(items)) return '<p>Invalid ledger data</p>';

        let total = 0;
        const rows = items.map(item => {
            const description = item.description ?? item.label ?? '';
            const quantity = (parseFloat(String(item.quantity)) || 1);
            const price = (parseFloat(String(item.price)) || 0);
            const operation = item.operation || '+';
            const subtotal = quantity * price;
            const signedSubtotal = operation === '-' ? -subtotal : subtotal;
            total += signedSubtotal;
            return `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${description}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${signedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');
        return `
            <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
                <thead><tr><th>Item</th><th>Amount</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr><th style="text-align: right;">Total</th><th style="text-align: right;">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</th></tr></tfoot>
            </table>
        `;

    } catch (e) {
        return '<p>Error parsing ledger data.</p>';
    }
};

export const exportToMarkdown = (note: Note) => {
  let contentText = '';
  if (note.mode === NoteMode.LEDGER) {
    try {
      const parsedContent = JSON.parse(note.content || 'null');
      if (!parsedContent) {
          contentText = 'Empty ledger.';
      } else if ('headers' in parsedContent && 'rows' in parsedContent) {
          const ledgerData = parsedContent as LedgerData;
          const headers = `| ${ledgerData.headers.join(' | ')} |`;
          const separator = `|${ledgerData.headers.map((_, i) => (ledgerData.sumColumnIndices || []).includes(i) ? '---:|' : '---|').join('')}`;
          const rows = ledgerData.rows.map(row => `| ${row.data.join(' | ')} |`).join('\n');
          contentText = `${headers}\n${separator}\n${rows}`;

          if ((ledgerData.sumColumnIndices || []).length > 0) {
              const totals = ledgerData.sumColumnIndices.map(index => {
                  const total = ledgerData.rows.reduce((acc, row) => {
                      const value = parseFloat(row.data[index] || '0');
                      return acc + (isNaN(value) ? 0 : value);
                  }, 0);
                  return { index, total };
              });
              
              totals.forEach(({ index, total }) => {
                  let totalRow = `| **Total ${ledgerData.headers[index]}** |`;
                  for (let i = 1; i < ledgerData.headers.length; i++) {
                      totalRow += i === index ? ` **${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** |` : ` |`;
                  }
                  contentText += `\n${totalRow}`;
              });
          }

      } else { // Old format
          const items: any[] = parsedContent;
          let total = 0;
          let table = '| Item | Amount |\n|:---|---:|';
          items.forEach(item => {
              const description = item.description ?? item.label ?? '';
              const quantity = (parseFloat(String(item.quantity)) || 1);
              const price = (parseFloat(String(item.price)) || 0);
              const operation = item.operation || '+';
              const subtotal = quantity * price;
              const signedSubtotal = operation === '-' ? -subtotal : subtotal;
              total += signedSubtotal;
              const amountStr = `${signedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              table += `\n| ${description} | ${amountStr} |`;
          });
          table += `\n| **Total** | **${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** |`;
          contentText = table;
      }
    } catch(e) {
        contentText = 'Could not parse ledger data.';
    }
  } else {
    contentText = htmlToText(note.content);
  }
  
  const markdownContent = `# ${note.title}\n\n**Mode:** ${note.mode}\n**Tags:** ${note.tags.join(', ')}\n\n---\n\n${contentText}`;
  
  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title.replace(/\s+/g, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToPdf = (note: Note) => {
  const element = document.createElement('div');
  element.style.width = '210mm';
  element.style.padding = '20mm';
  element.style.fontFamily = 'Arial, sans-serif';

  const titleEl = document.createElement('h1');
  titleEl.innerText = note.title;
  element.appendChild(titleEl);

  const metaEl = document.createElement('div');
  metaEl.style.fontSize = '12px';
  metaEl.style.color = '#555';
  metaEl.style.marginBottom = '20px';
  metaEl.innerHTML = `<strong>Mode:</strong> ${note.mode}<br/><strong>Tags:</strong> ${note.tags.join(', ')}`;
  element.appendChild(metaEl);

  const contentEl = document.createElement('div');
  contentEl.innerHTML = note.mode === NoteMode.LEDGER ? ledgerToHtmlTable(note) : note.content;
  element.appendChild(contentEl);

  html2pdf()
    .from(element)
    .save(`${note.title.replace(/\s+/g, '_')}.pdf`);
};

const rgbToHex = (rgb: string) => {
    const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
    if (!result) return '000000';
    const r = parseInt(result[1], 10);
    const g = parseInt(result[2], 10);
    const b = parseInt(result[3], 10);
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};


// Helper to parse HTML nodes into docx.js objects
const htmlToDocxChildren = (html: string) => {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const parseNode = (node: ChildNode): any[] => {
        if (node.nodeType === Node.TEXT_NODE) {
            return [new TextRun(node.textContent || '')];
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            let children = Array.from(element.childNodes).flatMap(parseNode);

            switch (element.tagName) {
                case 'STRONG':
                    return children.map(child => (child instanceof TextRun ? new TextRun({ ...child.options, bold: true }) : child));
                case 'EM':
                    return children.map(child => (child instanceof TextRun ? new TextRun({ ...child.options, italics: true }) : child));
                case 'U':
                     return children.map(child => (child instanceof TextRun ? new TextRun({ ...child.options, underline: {} }) : child));
                case 'S':
                     return children.map(child => (child instanceof TextRun ? new TextRun({ ...child.options, strike: true }) : child));
                case 'SPAN':
                     if(element.style.color) {
                        children = children.map(child => (child instanceof TextRun ? new TextRun({ ...child.options, color: rgbToHex(element.style.color)}) : child));
                     }
                     if(element.style.backgroundColor) {
                        children = children.map(child => (child instanceof TextRun ? new TextRun({ ...child.options, highlight: rgbToHex(element.style.backgroundColor)}) : child));
                     }
                     return children;
                default:
                    return children;
            }
        }
        return [];
    };
    
    return Array.from(tempDiv.childNodes).map(node => {
        const element = node as HTMLElement;
        const childrenRuns = Array.from(node.childNodes).flatMap(parseNode).filter(c => c instanceof TextRun) as any[];

        const paragraphProps: any = { children: childrenRuns };

        // Handle alignment
        if(element.classList?.contains('ql-align-center')) paragraphProps.alignment = AlignmentType.CENTER;
        if(element.classList?.contains('ql-align-right')) paragraphProps.alignment = AlignmentType.RIGHT;
        if(element.classList?.contains('ql-align-justify')) paragraphProps.alignment = AlignmentType.JUSTIFY;
        
        switch(node.nodeName) {
            case 'H1':
                return new Paragraph({ ...paragraphProps, heading: HeadingLevel.HEADING_1 });
            case 'H2':
                return new Paragraph({ ...paragraphProps, heading: HeadingLevel.HEADING_2 });
            case 'H3':
                return new Paragraph({ ...paragraphProps, heading: HeadingLevel.HEADING_3 });
            case 'H4':
                return new Paragraph({ ...paragraphProps, heading: HeadingLevel.HEADING_4 });
            case 'UL':
                return Array.from(element.querySelectorAll('li')).map(li => new Paragraph({ ...paragraphProps, text: li.innerText, bullet: { level: 0 }}));
            case 'OL':
                return Array.from(element.querySelectorAll('li')).map(li => new Paragraph({ ...paragraphProps, text: li.innerText, numbering: { reference: 'default-numbering', level: 0 }}));
            case 'P':
                 return new Paragraph(paragraphProps);
            default:
                if(node.textContent) {
                    return new Paragraph({ children: [new TextRun(node.textContent)] });
                }
                return null;
        }
    }).flat().filter(Boolean);
};


export const exportToWord = (note: Note) => {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = docx;

  let contentChildren: any[];

  if (note.mode === NoteMode.LEDGER) {
    contentChildren = [];
    try {
        const parsedContent = JSON.parse(note.content || 'null');
        if (!parsedContent) throw new Error("Empty content");
        
        if ('headers' in parsedContent && 'rows' in parsedContent) {
            const ledgerData = parsedContent as LedgerData;
            
            const headerRow = new TableRow({
                children: ledgerData.headers.map(header => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })] })),
                tableHeader: true,
            });

            const bodyRows = ledgerData.rows.map(row => new TableRow({
                children: row.data.map((cell, cellIndex) => new TableCell({
                    children: [new Paragraph({
                        text: cell,
                        alignment: (ledgerData.sumColumnIndices || []).includes(cellIndex) ? AlignmentType.RIGHT : AlignmentType.LEFT,
                    })],
                })),
            }));

            let tableRows = [headerRow, ...bodyRows];

            if ((ledgerData.sumColumnIndices || []).length > 0) {
                 const totals = ledgerData.sumColumnIndices.map(index => {
                    const total = ledgerData.rows.reduce((acc, row) => {
                        const value = parseFloat(row.data[index] || '0');
                        return acc + (isNaN(value) ? 0 : value);
                    }, 0);
                    return { index, total };
                });

                totals.forEach(({ index, total }) => {
                    const totalCells = Array(ledgerData.headers.length).fill(new TableCell({ children: [new Paragraph('')] }));
                    totalCells[index - 1] = new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: `Total ${ledgerData.headers[index]}`, bold: true })], alignment: AlignmentType.RIGHT })],
                    });
                     totalCells[index] = new TableCell({
                         children: [new Paragraph({ children: [new TextRun({ text: total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), bold: true })], alignment: AlignmentType.RIGHT })]
                    });
                     const totalRow = new TableRow({ children: totalCells });
                     tableRows.push(totalRow);
                });
            }

            const table = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
            contentChildren.push(table);

        } else { // Old format
            const items: any[] = parsedContent;
            if (!Array.isArray(items)) throw new Error("Invalid old format");
            let total = 0;
            const tableRows = items.map(item => {
                const description = item.description ?? item.label ?? '';
                const quantity = (parseFloat(String(item.quantity)) || 1);
                const price = (parseFloat(String(item.price)) || 0);
                const operation = item.operation || '+';
                const subtotal = quantity * price;
                const signedSubtotal = operation === '-' ? -subtotal : subtotal;
                total += signedSubtotal;
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(description)] }),
                        new TableCell({ children: [new Paragraph({ text: signedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), alignment: AlignmentType.RIGHT })] }),
                    ],
                });
            });
            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [new TableCell({ children: [new Paragraph('Item')] }), new TableCell({ children: [new Paragraph('Amount')] })], tableHeader: true }),
                    ...tableRows,
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })], alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), bold: true })], alignment: AlignmentType.RIGHT })] })] })
                ]
            });
            contentChildren.push(table);
        }

    } catch (e) {
        contentChildren.push(new Paragraph('Error parsing ledger data.'));
    }
  } else {
     contentChildren = htmlToDocxChildren(note.content);
  }

  const doc = new Document({
    numbering: {
        config: [
            {
                reference: 'default-numbering',
                levels: [
                    {
                        level: 0,
                        format: 'decimal',
                        text: '%1.',
                        alignment: 'start',
                    },
                ],
            },
        ],
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: note.title, bold: true, size: 44, font: 'Arial' })],
          heading: HeadingLevel.TITLE
        }),
        new Paragraph({
          children: [new TextRun({ text: `Mode: ${note.mode}`, size: 24, font: 'Arial' })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Tags: ${note.tags.join(', ')}`, size: 24, font: 'Arial' })],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        ...contentChildren,
      ],
    }],
  });

  Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};