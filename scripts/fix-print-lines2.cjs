const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Find the existing @media print block and add rules to it
// Add rules before the closing } of the @media print block
const printIdx = content.indexOf('@media print {');
if (printIdx === -1) { console.log('No @media print found'); process.exit(1); }

// Find the last } that closes @media print (before </style>)
const styleEnd = content.indexOf('</style>');
const lastBrace = content.lastIndexOf('}', styleEnd);

// Insert before the closing brace of @media print
const addRules = `
  .q-shdr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    border-bottom: 2px solid #c0392b !important;
    color: #c0392b !important;
  }

  .q-col-hdr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background: #c0392b !important;
    color: #fff !important;
  }

  .q-ptbl thead tr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background: #c0392b !important;
  }

  .q-ptbl th {
    color: #fff !important;
  }

  .q-availability {
    border-left: 3px solid #c0392b !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
`;

content = content.substring(0, lastBrace) + addRules + content.substring(lastBrace);
fs.writeFileSync(file, content);
console.log('Print CSS rules added to existing @media print block');
