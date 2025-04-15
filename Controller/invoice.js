const PDFDocument = require('pdfkit-table');

const createInvoice = async (address, products, stream) => {
    const localType = './fonts/Helvetica.ttf'
    const doc = new PDFDocument({ margin: 30, size: 'A4'});
    
    doc.pipe(stream);
    doc.font(localType); 

    doc.fontSize(20).text('Faktura VAT', { align: 'center' });
    doc.fontSize(10).text(`Data wystawienia: ${products.Data_zakupu}`, {align: "center"});
    doc.moveDown(2);
    
    doc.fontSize(9);
    doc.text('Sprzedawca:', {continued: true}).text("Odbiorca: ", {align: 'right'});
        doc.text('Ksiegarnia Internetowa', {continued: true}).text(`${address.Imie} ${address.Nazwisko}`, {align: 'right'});
        doc.text('ul. Przykładowa 1, 00-000 Warszawa', {continued: true}).text(`ul. ${address.Ulica}, ${address['Kod pocztowy']} ${address.Miasto}`, {align: 'right'});
        doc.text('NIP: 123-456-78-90');
        doc.moveDown(2);

        let table = {
            title: "Zakupione produkty",
            headers: [ "Tytuł", "Ilość", "Cena netto", "Cena brutto" ],
            rows: [],
    
          };
        
        products.Przedmioty.forEach((book)  => {
            const { Tytuł, Cena , quantity } = book;
            table.rows.push([Tytuł, quantity, (parseFloat(Cena) * 0.92).toFixed(2), Cena])
        });


        doc.table(table, { 
            prepareHeader: () => doc.font(localType).fontSize(12),
            prepareRow: (row, i) => doc.font('Helvetica').fontSize(10)
          
          })
          
          doc.font(localType); 

        doc.moveDown();
        let tmp = parseFloat(products['Zapłacona_kwota']).toFixed(2) / 0.8

        if(tmp > 200){
            
            doc.text(`Wysokość rabatu: ${(tmp - products['Zapłacona_kwota']).toFixed(2)}zl`, {align: 'right'});
        }
        

        doc.moveDown();

        doc.text(`Sumaryczna kwota: ${products['Zapłacona_kwota']} zl`, {align: 'right'});

        doc.moveDown();
        doc.text(`Forma płatności: ${products["Metoda płatności"]}`);

        
        doc.end();


  
};

module.exports = createInvoice;
