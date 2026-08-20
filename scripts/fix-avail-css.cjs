const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Add availability CSS before the closing </style> tag
if (!content.includes('.q-availability')) {
  content = content.replace(
    '</style>',
    `.q-availability {
  font-size: 8pt;
  padding: 2mm 3mm;
  border-left: 3px solid #c0392b;
  background: #f9f9f9;
  margin: 2mm 0;
  color: #333;
}
</style>`
  );
}

fs.writeFileSync(file, content);
console.log('Availability CSS added');
