const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\RoleManagementView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Fix the select query - cast data to any[]
content = content.replace(
  `const { data, error: fetchErr } = await supabase
      .from('role_permissions' as any)
      .select('*')
      .order('role')`,
  `const { data: rawData, error: fetchErr } = await supabase
      .from('role_permissions' as any)
      .select('*')
      .order('role')
    const data = rawData as any[]`
);

// Fix the spread - cast found to any
content = content.replace(
  `const found = (data || []).find((d: any) => d.role === r)`,
  `const found = (data || []).find((d: any) => d.role === r) as any`
);

fs.writeFileSync(file, content);
console.log('Fixed TS spread/property errors');
