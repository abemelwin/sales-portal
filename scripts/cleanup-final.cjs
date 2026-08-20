const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Remove the broken notification sections - from Error notification comment to Loading state
const errorComment = '    <!-- Error notification (Requirement 5.16: retain form data, show error) -->';
const successComment = '    <!-- Success notification -->';
const loadingComment = '    <!-- Loading state when loading an existing quote -->';

const errorIdx = content.indexOf(errorComment);
const loadingIdx = content.indexOf(loadingComment);

if (errorIdx !== -1 && loadingIdx !== -1) {
  // Remove everything between error comment and loading comment
  content = content.substring(0, errorIdx) + '\n' + content.substring(loadingIdx);
  console.log('Removed broken notification sections');
} else {
  console.log('errorIdx:', errorIdx, 'loadingIdx:', loadingIdx);
}

fs.writeFileSync(file, content);
