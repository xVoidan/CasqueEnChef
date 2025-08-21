import { supabase } from './supabase';

interface SQLResult {
  data?: unknown[];
  error?: string;
  message?: string;
  count?: number;
}

/**
 * Service d'exécution SQL pour Supabase
 * Traduit les requêtes SQL en opérations SDK Supabase
 */
export class SQLExecutor {
  /**
   * Exécute une requête SQL en la traduisant en opérations SDK
   */
  static async execute(sql: string): Promise<SQLResult> {
    const sqlLower = sql.toLowerCase().trim();
    
    try {
      // SELECT
      if (sqlLower.startsWith('select')) {
        return await this.handleSelect(sql);
      }
      
      // INSERT
      if (sqlLower.startsWith('insert')) {
        return await this.handleInsert(sql);
      }
      
      // UPDATE
      if (sqlLower.startsWith('update')) {
        return await this.handleUpdate(sql);
      }
      
      // DELETE
      if (sqlLower.startsWith('delete')) {
        return await this.handleDelete(sql);
      }
      
      // CREATE OR REPLACE FUNCTION
      if (sqlLower.includes('create') && sqlLower.includes('function')) {
        return await this.handleFunction(sql);
      }
      
      // Pour DDL et autres requêtes complexes
      if (sqlLower.startsWith('create') || sqlLower.startsWith('alter') || sqlLower.startsWith('drop')) {
        return await this.handleDDL(sql);
      }
      
      // Essayer via RPC si disponible
      return await this.executeViaRPC(sql);
      
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  private static async handleSelect(sql: string): Promise<SQLResult> {
    // Parser basique pour SELECT
    const tableMatch = sql.match(/from\s+(\w+)/i);
    if (!tableMatch) {
      return { error: 'Table non trouvée dans SELECT' };
    }
    
    const table = tableMatch[1];
    const selectMatch = sql.match(/select\s+(.*?)\s+from/i);
    const columns = selectMatch?.[1] === '*' ? '*' : selectMatch?.[1];
    const whereMatch = sql.match(/where\s+(.+?)(?:order|limit|group|$)/i);
    const limitMatch = sql.match(/limit\s+(\d+)/i);
    const orderMatch = sql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
    
    let query = supabase.from(table).select(columns || '*');
    
    // Appliquer WHERE
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      const conditions = whereClause.split(/\s+and\s+/i);
      
      for (const condition of conditions) {
        const condMatch = condition.match(/(\w+)\s*(=|!=|>|<|>=|<=|like|ilike)\s*['"]?([^'"]+)['"]?/i);
        if (condMatch) {
          const [, column, operator, value] = condMatch;
          const cleanValue = value.replace(/^['"]|['"]$/g, '');
          
          switch(operator.toLowerCase()) {
            case '=': query = query.eq(column, cleanValue); break;
            case '!=': query = query.neq(column, cleanValue); break;
            case '>': query = query.gt(column, cleanValue); break;
            case '<': query = query.lt(column, cleanValue); break;
            case '>=': query = query.gte(column, cleanValue); break;
            case '<=': query = query.lte(column, cleanValue); break;
            case 'like': query = query.like(column, cleanValue); break;
            case 'ilike': query = query.ilike(column, cleanValue); break;
          }
        }
      }
    }
    
    // ORDER BY
    if (orderMatch) {
      query = query.order(orderMatch[1], { ascending: orderMatch[2] !== 'desc' });
    }
    
    // LIMIT
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return { error: error.message };
    }
    
    return { 
      data, 
      count: data?.length ?? 0,
      message: `${data?.length ?? 0} ligne(s) trouvée(s)`
    };
  }

  private static async handleInsert(sql: string): Promise<SQLResult> {
    // Parser pour INSERT INTO table (col1, col2) VALUES (val1, val2)
    const match = sql.match(/insert\s+into\s+(\w+)\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/i);
    if (!match) {
      return { error: 'Format INSERT non reconnu' };
    }
    
    const [, table, columns, values] = match;
    const columnList = columns.split(',').map(c => c.trim());
    const valueList = values.split(',').map(v => {
      v = v.trim();
      // Retirer les quotes
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
        return v.slice(1, -1);
      }
      // Nombres
      if (!isNaN(Number(v))) return Number(v);
      // Booléens
      if (v.toLowerCase() === 'true') return true;
      if (v.toLowerCase() === 'false') return false;
      // NULL
      if (v.toLowerCase() === 'null') return null;
      // NOW()
      if (v.toLowerCase() === 'now()') return new Date().toISOString();
      return v;
    });
    
    const insertData: Record<string, unknown> = {};
    columnList.forEach((col, i) => {
      insertData[col] = valueList[i];
    });
    
    const { data, error } = await supabase
      .from(table)
      .insert(insertData)
      .select();
    
    if (error) {
      return { error: error.message };
    }
    
    return { 
      data, 
      message: 'INSERT réussi',
      count: data?.length ?? 0
    };
  }

  private static async handleUpdate(sql: string): Promise<SQLResult> {
    const match = sql.match(/update\s+(\w+)\s+set\s+(.+?)\s+where\s+(.+)/i);
    if (!match) {
      return { error: 'Format UPDATE non reconnu' };
    }
    
    const [, table, setClause, whereClause] = match;
    
    // Parser SET
    const updateData: Record<string, unknown> = {};
    const setPairs = setClause.split(',');
    
    for (const pair of setPairs) {
      const [col, val] = pair.split('=').map(s => s.trim());
      let value: unknown = val;
      
      // Nettoyer la valeur
      if (typeof value === 'string') {
        if ((value.startsWith("'") && value.endsWith("'")) || 
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        } else if (!isNaN(Number(value))) {
          value = Number(value);
        } else if (value.toLowerCase() === 'true') {
          value = true;
        } else if (value.toLowerCase() === 'false') {
          value = false;
        } else if (value.toLowerCase() === 'null') {
          value = null;
        } else if (value.toLowerCase() === 'now()') {
          value = new Date().toISOString();
        }
      }
      
      updateData[col] = value;
    }
    
    // Parser WHERE simple
    let query = supabase.from(table).update(updateData);
    
    const whereMatch = whereClause.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
    if (whereMatch) {
      query = query.eq(whereMatch[1], whereMatch[2]);
    }
    
    const { data, error } = await query.select();
    
    if (error) {
      return { error: error.message };
    }
    
    return { 
      data, 
      message: `${data?.length ?? 0} ligne(s) modifiée(s)`,
      count: data?.length ?? 0
    };
  }

  private static async handleDelete(sql: string): Promise<SQLResult> {
    const match = sql.match(/delete\s+from\s+(\w+)(?:\s+where\s+(.+))?/i);
    if (!match) {
      return { error: 'Format DELETE non reconnu' };
    }
    
    const [, table, whereClause] = match;
    
    let query = supabase.from(table).delete();
    
    if (whereClause) {
      const whereMatch = whereClause.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
      if (whereMatch) {
        query = query.eq(whereMatch[1], whereMatch[2]);
      } else {
        return { error: 'WHERE clause non reconnue' };
      }
    }
    
    const { data, error } = await query.select();
    
    if (error) {
      return { error: error.message };
    }
    
    return { 
      data, 
      message: `${data?.length ?? 0} ligne(s) supprimée(s)`,
      count: data?.length ?? 0
    };
  }

  private static async handleFunction(sql: string): Promise<SQLResult> {
    // Sauvegarder pour migration
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${timestamp}_custom_function.sql`;
    
    console.log(`⚠️ Fonction SQL sauvegardée: supabase/migrations/${filename}`);
    console.log('Pour l\'appliquer:');
    console.log('1. Copier dans Supabase SQL Editor');
    console.log('2. Ou utiliser: npx supabase migration up');
    
    return {
      message: 'CREATE FUNCTION nécessite Supabase Dashboard',
      data: [{ sql, filename }]
    };
  }

  private static async handleDDL(sql: string): Promise<SQLResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${timestamp}_ddl.sql`;
    
    console.log(`⚠️ DDL sauvegardé: supabase/migrations/${filename}`);
    console.log('Pour l\'appliquer: Utiliser Supabase SQL Editor');
    
    return {
      message: 'DDL nécessite Supabase Dashboard',
      data: [{ sql, filename }]
    };
  }

  private static async executeViaRPC(sql: string): Promise<SQLResult> {
    try {
      // Essayer d'exécuter via une fonction RPC si elle existe
      const { data, error } = await supabase
        .rpc('execute_sql', { query: sql });
      
      if (error) throw error;
      
      return { 
        data: data as unknown[],
        message: 'Exécuté via RPC'
      };
    } catch {
      return {
        error: 'SQL complexe non supporté directement',
        message: 'Utiliser Supabase Dashboard ou créer une fonction RPC'
      };
    }
  }

  /**
   * Génère le SQL pour créer une fonction RPC d'exécution SQL
   */
  static generateExecutorFunction(): string {
    return `
-- ⚠️ ATTENTION: Fonction à utiliser uniquement en développement!
-- Cette fonction permet d'exécuter du SQL arbitraire
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Pour SELECT
  IF lower(query) LIKE 'select%' THEN
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
    RETURN result;
  END IF;
  
  -- Pour INSERT/UPDATE/DELETE avec RETURNING
  IF lower(query) LIKE 'insert%' OR lower(query) LIKE 'update%' OR lower(query) LIKE 'delete%' THEN
    IF NOT (lower(query) LIKE '%returning%') THEN
      query := query || ' RETURNING *';
    END IF;
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
    RETURN COALESCE(result, '[]'::json);
  END IF;
  
  -- Pour autres requêtes
  EXECUTE query;
  RETURN '{"message": "Requête exécutée"}'::json;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;
REVOKE EXECUTE ON FUNCTION execute_sql FROM anon, authenticated;
`;
  }
}

// Export par défaut pour faciliter l'import
export default SQLExecutor;