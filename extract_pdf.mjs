import { readFileSync, writeFileSync } from 'fs';

const pdfPath = 'C:/Users/Lenovo/Dropbox/2026/Manual Sembrando Valores - Pastoral Social.pdf';

// Try using pdf2json
try {
  const { default: PDFParser } = await import('pdf2json');
  const pdfParser = new PDFParser(null, 1);

  pdfParser.on('pdfParser_dataReady', (pdfData) => {
    const text = pdfParser.getRawTextContent();
    writeFileSync('manual_texto.txt', text, 'utf8');
    console.log('Done! Chars:', text.length);
  });

  pdfParser.on('pdfParser_dataError', (err) => console.error(err));
  pdfParser.loadPDF(pdfPath);
} catch(e) {
  console.error('pdf2json failed:', e.message);
}
