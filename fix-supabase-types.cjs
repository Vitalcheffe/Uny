const fs = require('fs');
const content = fs.readFileSync('types/supabase.ts', 'utf8');
const fixed = content.replace(/Relationships: any\[\]/g, `Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]`);
fs.writeFileSync('types/supabase.ts', fixed);
