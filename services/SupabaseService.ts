import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { supabase } from '@/constants/Supabase';
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'order';
export type FilterConstraint = [operator: FilterOperator, field: string, value: unknown];
export type TableName = 'clothes' | 'outfits' | 'users' | 'likes' | 'comments';
export function fetch(
  tableName: string,
  constraints: FilterConstraint[] = [],
  customSelect: string = '*'
) : PostgrestFilterBuilder<any, any, any> {
  let query = supabase
    .from(tableName)
    .select(customSelect)

  for (const [operator, field, value] of constraints) {
    query = applyFilter(query, operator, field, value);
  }

  return query;
}

export function applyFilter<T>(
  query: PostgrestFilterBuilder<any, any, T>,
  operator: FilterOperator,
  field: string,
  value: unknown
) {
  switch (operator) {
    case 'eq': return query.eq(field, value);
    case 'neq': return query.neq(field, value);
    case 'gt': return query.gt(field, value);
    case 'gte': return query.gte(field, value);
    case 'lt': return query.lt(field, value);
    case 'lte': return query.lte(field, value);
    case 'like': return query.like(field, value as string);
    case 'ilike': return query.ilike(field, value as string);
    case 'is': return query.is(field, value);
    case 'in': return query.in(field, value as string[]);
    case 'order': return query.order(field, { ascending: value as boolean });
    default: throw new Error(`Opérateur non supporté: ${operator}`);
  }
}