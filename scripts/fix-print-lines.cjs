const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Add print-specific CSS to ensure borders and colors are preserved
if (!content.includes('@media print')) {
  content = content.replace(
    '</style>',
    `
/* --- Print styles --- */
@media print {
  .q-shdr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    border-bottom: 2px solid #c0392b !important;
    color: #c0392b !important;
  }

  .q-col-hdr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    background: #c0392b !important;
    color: #fff !important;
  }

  .q-ptbl thead tr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    background: #c0392b !important;
  }

  .q-ptbl th {
    color: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .q-availability {
    border-left: 3px solid #c0392b !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .q-sig-cell {
    border-top: 1px solid #333 !important;
  }
}
</style>`
  );
}

fs.writeFileSync(file, content);
console.log('Print CSS added - borders and colors preserved in PDF');
