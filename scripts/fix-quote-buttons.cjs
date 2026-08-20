const fs = require('fs');

// 1. Remove "Save Quote" button from QuoteBuilderView
const qbFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let qb = fs.readFileSync(qbFile, 'utf-8');

// Find and remove the save button container
// Look for the save-quote button area
const saveStart = qb.indexOf('<!-- Save Quote button -->');
if (saveStart !== -1) {
  const saveEnd = qb.indexOf('</div>', saveStart) + '</div>'.length;
  qb = qb.substring(0, saveStart) + qb.substring(saveEnd);
  console.log('Removed Save Quote button via comment marker');
} else {
  // Try finding it by the button text
  const btnMatch = qb.match(/Save Quote|Update Quote/);
  if (btnMatch) {
    // Find the container div with save-quote class or the button wrapper
    const saveBtnIdx = qb.indexOf("saving ? 'Saving...' : (isEditing ? 'Update Quote' : 'Save Quote')");
    if (saveBtnIdx !== -1) {
      // Find the enclosing div
      let searchBack = saveBtnIdx;
      while (searchBack > 0 && !qb.substring(searchBack - 100, searchBack).includes('<div class="quote-builder-view__actions"')) {
        searchBack--;
      }
      const divStart = qb.lastIndexOf('<div class="quote-builder-view__actions"', saveBtnIdx);
      if (divStart !== -1) {
        const divEnd = qb.indexOf('</div>', saveBtnIdx) + '</div>'.length;
        qb = qb.substring(0, divStart) + qb.substring(divEnd);
        console.log('Removed Save Quote button wrapper');
      }
    }
  }
}

fs.writeFileSync(qbFile, qb);
console.log('QuoteBuilderView updated');

// 2. Update the Signatories section labels to match reference
const formFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let form = fs.readFileSync(formFile, 'utf-8');

// Fix label text to match reference
form = form.replace(
  'Supplier Name',
  'Supplier Name (void-warranty line)'
);

// Fix signatories layout - make them stacked (not in rows) to match reference
form = form.replace(
  '<label class="fp-lbl" for="ae-name">Account Executive</label>',
  '<label class="fp-lbl" for="ae-name">Account Executive</label>'
);

// Set default values for Noted By
form = form.replace(
  'placeholder="Name" maxlength="100"',
  'placeholder="Ness Deomano" maxlength="100"'
);
form = form.replace(
  'placeholder="Role" maxlength="100"',
  'placeholder="Area Sales Manager" maxlength="100"'
);

// Add "CLOSING DOCUMENTS" section header before the buttons
const closingBtnMarker = '<!-- Open Closing Documents Button -->';
if (form.includes(closingBtnMarker)) {
  form = form.replace(
    closingBtnMarker,
    `<hr class="fp-hr" />
      <h2 class="fp-section-title">Closing Documents</h2>
      <p class="fp-note" style="margin-bottom:8px">Prepare the delivery & document details, then open the printable closing documents (T&C, Delivery Instructions, Warranty, CAC, PDC, Pullout).</p>

      <!-- Open Closing Documents Button -->`
  );
}

fs.writeFileSync(formFile, form);
console.log('QuoteFormPanel labels and section header updated');
